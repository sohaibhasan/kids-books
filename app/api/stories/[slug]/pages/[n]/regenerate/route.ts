import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getOrSetDeviceId } from '@/lib/identity'
import { generatePage, resolveImageContext } from '@/lib/jobs/run-story-job'
import type { PageStatus } from '@/lib/jobs/claim'
import { parseFormLenient, parsePagesLenient } from '@/lib/validation'

export const maxDuration = 300

const BUCKET = 'story-images'
// Leave headroom under the 300s function cap, matching the background job's
// soft deadline. generatePage stops looping once this elapses.
const REGEN_DEADLINE_MS = 240_000

/** Postgres "undefined column" (migration 0009 not applied yet) detection. */
function isUndefinedColumn(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  const code = err.code ?? ''
  const msg = err.message ?? ''
  return code === '42703' || code === 'PGRST204' || /column .*regens_remaining.* does not exist/i.test(msg)
}

/** Best-effort refund of one regen when a generation attempt fails. */
async function refundRegen(slug: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('stories')
      .select('regens_remaining')
      .eq('slug', slug)
      .maybeSingle()
    const cur = (data?.regens_remaining as number | undefined) ?? 0
    await supabase.from('stories').update({ regens_remaining: cur + 1 }).eq('slug', slug)
  } catch (err) {
    console.error(`[regenerate ${slug}] refund failed`, err)
  }
}

/**
 * FEAT-3 — per-page illustration regenerate for the story's owner.
 *
 * POST /api/stories/[slug]/pages/[n]/regenerate
 *
 * Runs a single-page image regeneration inline (reusing generatePage from the
 * background job) and, on success, upserts the new image over the old one and
 * bumps a per-page image_version used to cache-bust the public URL. We are NOT
 * the background job: we never claim the story, heartbeat, or touch
 * last_progress_at / status. Only page_status is updated, and only on success.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; n: string }> },
) {
  const requestStart = Date.now()
  const { slug, n } = await params

  const pageNumber = Number(n)
  if (!Number.isInteger(pageNumber)) {
    return NextResponse.json({ error: 'invalid page number' }, { status: 400 })
  }

  // 1. Load the story row.
  const { data: row, error: loadErr } = await supabase
    .from('stories')
    .select('slug, status, form, pages, page_status, device_id')
    .eq('slug', slug)
    .maybeSingle()
  if (loadErr || !row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // 2. Ownership + state gate.
  const { deviceId } = await getOrSetDeviceId()
  if (!row.device_id || deviceId !== row.device_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (row.status !== 'complete') {
    return NextResponse.json({ error: 'story is not finished yet' }, { status: 409 })
  }

  // 4. Validate the page exists + has a scene to regenerate FROM. Done before
  //    the budget decrement so a bad page index never burns a regen.
  const pages = parsePagesLenient(row.pages)
  const page = pages.find(p => p.page_number === pageNumber)
  if (!page) {
    return NextResponse.json({ error: 'page not found' }, { status: 404 })
  }
  if (!page.scene_description || !page.scene_description.trim()) {
    return NextResponse.json({ error: 'page has no scene to regenerate' }, { status: 400 })
  }

  // 3. Budget: read → check → optimistic decrement. Tolerate the column not
  //    existing yet (migration ordering) with a 503, same posture as BUG-4.
  const { data: budgetRow, error: budgetErr } = await supabase
    .from('stories')
    .select('regens_remaining')
    .eq('slug', slug)
    .maybeSingle()
  if (budgetErr) {
    if (isUndefinedColumn(budgetErr)) {
      console.error(`[regenerate ${slug}] regens_remaining column missing`, budgetErr)
      return NextResponse.json({ error: 'regeneration not available yet' }, { status: 503 })
    }
    return NextResponse.json({ error: 'ledger error' }, { status: 500 })
  }
  const regensRemaining = (budgetRow?.regens_remaining as number | undefined) ?? 0
  if (regensRemaining <= 0) {
    return NextResponse.json({ error: 'No regenerations left for this story' }, { status: 429 })
  }

  // Optimistic decrement guarded by regens_remaining > 0 so we don't dip below
  // the floor if two requests race. Refunded in the failure path below.
  const { data: decRow, error: decErr } = await supabase
    .from('stories')
    .update({ regens_remaining: regensRemaining - 1 })
    .eq('slug', slug)
    .gt('regens_remaining', 0)
    .select('regens_remaining')
    .maybeSingle()
  if (decErr) {
    if (isUndefinedColumn(decErr)) {
      console.error(`[regenerate ${slug}] regens_remaining column missing`, decErr)
      return NextResponse.json({ error: 'regeneration not available yet' }, { status: 503 })
    }
    return NextResponse.json({ error: 'ledger error' }, { status: 500 })
  }
  if (!decRow) {
    // Lost the race for the last regen.
    return NextResponse.json({ error: 'No regenerations left for this story' }, { status: 429 })
  }

  // 5. Run the regeneration inline. Fresh status entry (attempts reset). Because
  //    state='pending' + attempts=0, generatePage skips the storage-exists check
  //    and generates a new image; the upload is upsert:true, so the OLD image is
  //    only replaced if the new one succeeds. generatePage mutates `status` in
  //    place and does NOT touch the story row (no claim/heartbeat/persist) — the
  //    caller owns persistence, which we do only on success.
  const form = parseFormLenient(row.form)
  const { artStyle, provider, characterSheet, stylePrefix } = resolveImageContext(form, pages)

  const status: PageStatus = {
    page_number: pageNumber,
    state: 'pending',
    attempts: 0,
    rewrites: 0,
    last_error: null,
    provider_used: null,
  }

  let result: { ok: boolean; fatal: string | null }
  try {
    result = await generatePage(
      { page_number: pageNumber, scene_description: page.scene_description },
      {
        slug,
        artStyle,
        provider,
        characterSheet,
        stylePrefix,
        status,
        deadlineHit: () => Date.now() - requestStart > REGEN_DEADLINE_MS,
        beat: async () => {},        // not the background job — never heartbeat
        onDeadline: () => {},        // no-op; a deadline surfaces as !result.ok below
      },
    )
  } catch (err) {
    result = { ok: false, fatal: err instanceof Error ? err.message : String(err) }
  }

  if (!result.ok) {
    // Deadline or fatal failure. The upsert never ran, so the old image is
    // intact and page_status is untouched. Refund the regen.
    await refundRegen(slug)
    const message = status.last_error || result.fatal || 'could not regenerate this page'
    console.error(`[regenerate ${slug} page ${pageNumber}] failed: ${message}`)
    return NextResponse.json({ error: 'Could not redraw this page. Please try again.' }, { status: 502 })
  }

  // 6. Success — bump the per-page image_version and merge the fresh status
  //    entry back into page_status (state stays 'done'). Do NOT touch status /
  //    last_progress_at on the row.
  const version = Date.now()
  status.state = 'done'
  status.image_version = version

  const existing: PageStatus[] = Array.isArray(row.page_status)
    ? (row.page_status as PageStatus[])
    : []
  let replaced = false
  const merged = existing.map(ps => {
    if (ps.page_number === pageNumber) {
      replaced = true
      return status
    }
    return ps
  })
  if (!replaced) merged.push(status)
  merged.sort((a, b) => a.page_number - b.page_number)

  const { error: psErr } = await supabase
    .from('stories')
    .update({ page_status: merged })
    .eq('slug', slug)
  if (psErr) {
    // The image was uploaded and the regen consumed. Cache-busting won't take
    // effect on future loads, but the current client still gets the fresh URL.
    console.error(`[regenerate ${slug} page ${pageNumber}] page_status persist failed`, psErr)
  }

  const filename = `${slug}/page-${String(pageNumber).padStart(2, '0')}.png`
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return NextResponse.json({ ok: true, url: `${pub.publicUrl}?v=${version}` })
}
