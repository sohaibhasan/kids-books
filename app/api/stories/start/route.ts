import { NextRequest } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { supabase } from '@/lib/supabase'
import { makeSlug } from '@/lib/utils/slug'
import { getOrSetDeviceId, getFallbackHash } from '@/lib/identity'
import { consumeOne, getEntitlement, isGloballyThrottled, refundFailedGen, PACKS } from '@/lib/credits'
import { runStoryJob } from '@/lib/jobs/run-story-job'
import { WizardFormData } from '@/types'
import { WizardFormSchema } from '@/lib/validation'
import { apiError, apiOk, apiPaywall } from '@/lib/api'

export const maxDuration = 300

/**
 * Enqueue a new story-generation job. Returns immediately with the slug —
 * actual story + image generation runs in the background (waitUntil) and is
 * resumed by /api/cron/resume-stories if this function dies before
 * finishing. The client navigates to /generating/[slug] and polls
 * /api/stories/[slug]/status.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'invalid body')
  }

  // Validate and sanitise the wizard payload.  WizardFormSchema:
  //   • strips unknown keys
  //   • enforces enum constraints on art_style, length, tone, writing_style, genre
  //   • trims child_name and rejects if empty
  //   • coerces child_age to a number and range-checks 2–12
  //   • collapses whitespace + clamps custom_* fields (replaces manual clampText)
  //   • validates email with the same regex as the former isValidEmail guard
  const parseResult = WizardFormSchema.safeParse(body)
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? 'invalid input'
    return apiError(400, 'VALIDATION_ERROR', message)
  }
  const form = parseResult.data as unknown as WizardFormData

  const { deviceId } = await getOrSetDeviceId()
  const fallbackHash = await getFallbackHash()
  const entitlement = await getEntitlement(deviceId, fallbackHash)

  if (entitlement.kind === 'none') {
    const packs = Object.entries(PACKS).map(([id, p]) => ({
      id, credits: p.credits, label: p.label, price: p.price,
    }))
    return apiPaywall(packs)
  }

  if (entitlement.kind === 'free' && (await isGloballyThrottled())) {
    return apiError(503, 'UNAVAILABLE', 'Free tier is temporarily at capacity. Please try again later.')
  }

  const slug = makeSlug(form.child_name)

  // Consume the credit up front. If the insert fails for any reason we
  // refund (idempotent). For free tier creditEventId is null.
  let creditEventId: string | null = null
  try {
    creditEventId = await consumeOne(deviceId, entitlement.kind, slug)
  } catch (err) {
    console.error('[POST /api/stories/start] consumeOne failed', err)
    return apiError(500, 'LEDGER_ERROR', 'credit ledger error')
  }

  const { error: insertError } = await supabase.from('stories').insert({
    slug,
    // Placeholder until the background job writes the real Claude-generated
    // title. Keeps the insert valid even before migration 0007 (which drops the
    // NOT NULL on title) has been applied to the database.
    title: 'Creating story…',
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
      return apiError(402, 'PAYWALL', 'You have already used your free story. Please purchase a credit pack to make more.')
    }
    // For paid tier — refund the credit we just burned so the user isn't out.
    if (entitlement.kind === 'paid') {
      try { await refundFailedGen(deviceId, slug) }
      catch (refundErr) { console.error('[POST /api/stories/start] refund failed', refundErr) }
    }
    console.error('[POST /api/stories/start] insert failed', insertError)
    return apiError(500, 'SERVER_ERROR', insertError.message ?? 'insert failed')
  }

  // Kick off the worker; it owns claiming + heartbeating from here.
  waitUntil(runStoryJob(slug).catch(err => {
    console.error(`[POST /api/stories/start] background job ${slug} threw`, err)
  }))

  return apiOk({ slug })
}
