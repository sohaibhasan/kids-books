import { NextRequest } from 'next/server'
import { generateStoryStream, getExpectedTotal } from '@/lib/ai/generate-story'
import { supabase } from '@/lib/supabase'
import { getOrSetDeviceId, getFallbackHash } from '@/lib/identity'
import { getEntitlement, consumeOne, refundFailedGen, isGloballyThrottled, PACKS } from '@/lib/credits'
import { maybeAlertProviderQuota } from '@/lib/alerts'
import { WizardFormData } from '@/types'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  let payload: { form: WizardFormData; slug: string }
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400 })
  }
  const { form, slug } = payload

  if (!form?.child_name?.trim() || !slug) {
    return new Response(JSON.stringify({ error: 'form.child_name and slug are required' }), { status: 400 })
  }

  const { deviceId } = await getOrSetDeviceId()
  const fallbackHash = await getFallbackHash()
  const entitlement = await getEntitlement(deviceId, fallbackHash)

  if (entitlement.kind === 'none') {
    return new Response(
      JSON.stringify({
        paywall: true,
        packs: Object.entries(PACKS).map(([id, p]) => ({
          id, credits: p.credits, label: p.label, price: p.price,
        })),
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (entitlement.kind === 'free' && (await isGloballyThrottled())) {
    return new Response(
      JSON.stringify({ error: 'Free tier is temporarily at capacity. Please try again later.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const send = (data: object) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch { /* stream gone */ }
      }
      const keepalive = setInterval(() => {
        if (closed) return
        try { controller.enqueue(encoder.encode(`: keepalive\n\n`)) } catch { /* stream gone */ }
      }, 15_000)

      try {
        const expectedTotal = getExpectedTotal(form.length)
        send({ type: 'start' })
        // Prime the client's textProgress.total so the bar renders > 0 immediately
        // (without this, total=0 makes textPct=0 regardless of completed count).
        send({ type: 'text-progress', completed: 0, total: expectedTotal })

        // Idempotent retry: if a prior attempt already wrote this row (network
        // dropped between insert and text-done), skip Claude and credit entirely.
        const { data: existing } = await supabase
          .from('stories')
          .select('title')
          .eq('slug', slug)
          .maybeSingle()
        if (existing) {
          console.warn(`[POST /api/stories] row exists for slug ${slug}, skipping regeneration`)
          send({ type: 'text-progress', completed: expectedTotal, total: expectedTotal })
          send({ type: 'text-done', slug, title: existing.title })
          return
        }

        const story = await generateStoryStream(form, (completed, total) => {
          send({ type: 'text-progress', completed, total })
        })

        const creditEventId = await consumeOne(deviceId, entitlement.kind, slug)

        const { error: insertError } = await supabase.from('stories').insert({
          slug,
          title: story.title,
          form,
          pages: story.pages,
          images_done: false,
          device_id: deviceId,
          fallback_hash: fallbackHash,
          credit_event_id: creditEventId,
          featured_candidate: Boolean(form.feature_opt_in),
        })
        if (insertError) {
          // 23505 = unique-violation. Two cases hit this:
          //   (1) free-tier concurrent race caught by the partial unique index
          //       on stories(device_id) WHERE credit_event_id IS NULL
          //       (migration 0005) — paywall the user, no credit was consumed.
          //   (2) anything else — refund any consumed credit, surface the error.
          const code = (insertError as { code?: string }).code
          if (code === '23505' && entitlement.kind === 'free') {
            send({ type: 'error', message: 'You have already used your free story. Please purchase a credit pack to make more.' })
            return
          }
          if (entitlement.kind === 'paid') {
            try { await refundFailedGen(deviceId, slug) }
            catch (refundErr) { console.error('[POST /api/stories] refund after insert fail', refundErr) }
          }
          throw insertError
        }

        send({ type: 'text-done', slug, title: story.title })
      } catch (err) {
        console.error('[POST /api/stories]', err)
        void maybeAlertProviderQuota(err, 'POST /api/stories (Claude story-gen)')
        const message = err instanceof Error ? err.message : String(err)
        send({ type: 'error', message })
      } finally {
        clearInterval(keepalive)
        closed = true
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      Connection:          'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
