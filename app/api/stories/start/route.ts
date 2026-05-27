import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { supabase } from '@/lib/supabase'
import { makeSlug } from '@/lib/utils/slug'
import { getOrSetDeviceId, getFallbackHash } from '@/lib/identity'
import { consumeOne, getEntitlement, isGloballyThrottled, refundFailedGen, PACKS } from '@/lib/credits'
import { runStoryJob } from '@/lib/jobs/run-story-job'
import { WizardFormData } from '@/types'

export const maxDuration = 300

/**
 * Enqueue a new story-generation job. Returns immediately with the slug —
 * actual story + image generation runs in the background (waitUntil) and is
 * resumed by /api/cron/resume-stories if this function dies before
 * finishing. The client navigates to /generating/[slug] and polls
 * /api/stories/[slug]/status.
 */
export async function POST(req: NextRequest) {
  let form: WizardFormData
  try {
    form = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  if (!form?.child_name?.trim()) {
    return NextResponse.json({ error: 'child_name is required' }, { status: 400 })
  }
  if (form.email && !isValidEmail(form.email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 })
  }

  const { deviceId } = await getOrSetDeviceId()
  const fallbackHash = await getFallbackHash()
  const entitlement = await getEntitlement(deviceId, fallbackHash)

  if (entitlement.kind === 'none') {
    return NextResponse.json(
      {
        paywall: true,
        packs: Object.entries(PACKS).map(([id, p]) => ({
          id, credits: p.credits, label: p.label, price: p.price,
        })),
      },
      { status: 402 },
    )
  }

  if (entitlement.kind === 'free' && (await isGloballyThrottled())) {
    return NextResponse.json(
      { error: 'Free tier is temporarily at capacity. Please try again later.' },
      { status: 503 },
    )
  }

  const slug = makeSlug(form.child_name)

  // Consume the credit up front. If the insert fails for any reason we
  // refund (idempotent). For free tier creditEventId is null.
  let creditEventId: string | null = null
  try {
    creditEventId = await consumeOne(deviceId, entitlement.kind, slug)
  } catch (err) {
    console.error('[POST /api/stories/start] consumeOne failed', err)
    return NextResponse.json({ error: 'credit ledger error' }, { status: 500 })
  }

  const { error: insertError } = await supabase.from('stories').insert({
    slug,
    title: null,
    form,
    pages: [],
    images_done: false,
    status: 'pending',
    email: form.email?.trim() || null,
    device_id: deviceId,
    fallback_hash: fallbackHash,
    credit_event_id: creditEventId,
    featured_candidate: Boolean(form.feature_opt_in),
    attempts_remaining: 6,
  })

  if (insertError) {
    const code = (insertError as { code?: string }).code
    // Two concurrent free-tier inserts trip the partial unique index from
    // migration 0005 — one wins, the other gets here. Surface the paywall.
    if (code === '23505' && entitlement.kind === 'free') {
      return NextResponse.json(
        { error: 'You have already used your free story. Please purchase a credit pack to make more.' },
        { status: 402 },
      )
    }
    // For paid tier — refund the credit we just burned so the user isn't out.
    if (entitlement.kind === 'paid') {
      try { await refundFailedGen(deviceId, slug) }
      catch (refundErr) { console.error('[POST /api/stories/start] refund failed', refundErr) }
    }
    console.error('[POST /api/stories/start] insert failed', insertError)
    return NextResponse.json({ error: insertError.message ?? 'insert failed' }, { status: 500 })
  }

  // Kick off the worker; it owns claiming + heartbeating from here.
  waitUntil(runStoryJob(slug).catch(err => {
    console.error(`[POST /api/stories/start] background job ${slug} threw`, err)
  }))

  return NextResponse.json({ slug })
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}
