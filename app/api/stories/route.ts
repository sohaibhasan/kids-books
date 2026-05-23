import { NextRequest } from 'next/server'
import { generateStoryStream } from '@/lib/ai/generate-story'
import { supabase } from '@/lib/supabase'
import { getOrSetDeviceId, getFallbackHash } from '@/lib/identity'
import { getEntitlement, consumeOne, isGloballyThrottled, PACKS } from '@/lib/credits'
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
        send({ type: 'start' })

        const story = await generateStoryStream(form, (completed, total) => {
          send({ type: 'text-progress', completed, total })
        })

        const creditEventId = await consumeOne(deviceId, entitlement.kind, slug)

        const { error } = await supabase.from('stories').insert({
          slug,
          title: story.title,
          form,
          pages: story.pages,
          images_done: false,
          device_id: deviceId,
          fallback_hash: fallbackHash,
          credit_event_id: creditEventId,
        })
        if (error) throw error

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
