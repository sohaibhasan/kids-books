import { supabase } from '@/lib/supabase'
import { generateStoryStream } from '@/lib/ai/generate-story'
import { generateImage, selectProviderForStyle, ImageProvider } from '@/lib/ai/generate-image'
import { classifyImageError } from '@/lib/ai/classify-image-error'
import { rewritePromptForError } from '@/lib/ai/sanitize-prompt'
import { maybeAlertProviderQuota, maybeAlertEmailFailure } from '@/lib/alerts'
import { sendStorySuccessEmail } from './emails'
import { claimStory, heartbeat, getStoryRow, type PageStatus, type StoryRow } from './claim'
import { failStory } from './fail-story'
import { parseFormLenient, parsePagesLenient, type StoryPage } from '@/lib/validation'
import { ArtStyle, WizardFormData } from '@/types'

const BUCKET = 'story-images'
const SOFT_DEADLINE_MS = 240_000          // leave headroom under the 300s function cap
const MAX_TRANSIENT_RETRIES = 4
const MAX_REWRITES = 4
const MAX_ATTEMPTS_PER_PAGE = 8           // total cap across transient + rewrites
const HEARTBEAT_EVERY_MS = 25_000

type JobResult =
  | { finalStatus: 'complete'; reason?: undefined }
  | { finalStatus: 'failed'; reason: string }
  | { finalStatus: 'in_progress_handed_off'; reason?: undefined }
  | { finalStatus: 'not_claimed'; reason?: undefined }

/** Context passed to generatePage for a single-page generation attempt. */
export interface GeneratePageCtx {
  slug: string
  artStyle: ArtStyle
  provider: ImageProvider
  characterSheet: string | undefined
  stylePrefix: string | undefined
  /** The PageStatus entry for this page — mutated in place by generatePage. */
  status: PageStatus
  /** Returns true once the soft deadline has elapsed. */
  deadlineHit: () => boolean
  /** Heartbeat function — call between retries to keep the job alive. */
  beat: () => Promise<void>
  /** Called when generatePage detects the deadline mid-loop. */
  onDeadline: () => void
}


export async function runStoryJob(slug: string): Promise<JobResult> {
  const claimed = await claimStory(slug)
  if (!claimed) {
    return { finalStatus: 'not_claimed' }
  }

  const startedAt = Date.now()
  let row: StoryRow = claimed
  let lastBeat = Date.now()

  const beat = async () => {
    if (Date.now() - lastBeat < HEARTBEAT_EVERY_MS) return
    lastBeat = Date.now()
    try {
      await heartbeat(slug)
    } catch (err) {
      console.warn(`[run-story-job ${slug}] heartbeat failed`, err)
    }
  }

  const deadlineHit = () => Date.now() - startedAt > SOFT_DEADLINE_MS

  try {
    // Increment attempts_total once per claim so we can cap retries even
    // across cron pickups (a stuck story doesn't run forever).
    await supabase
      .from('stories')
      .update({
        attempts_total: row.attempts_total + 1,
        attempts_remaining: Math.max(0, row.attempts_remaining - 1),
      })
      .eq('slug', slug)

    // ---------------------- TEXT PHASE ----------------------
    if (row.status === 'pending' || row.status === 'generating_text') {
      row = await runTextPhase(slug, row, beat)
    }

    // ---------------------- IMAGE PHASE ----------------------
    const { terminalFailure, deadlineReached, pages, pageStatusMap } =
      await runImagePhase(slug, row, { beat, deadlineHit })

    // ---------------------- FINALIZE ----------------------
    return await finalizeStory(slug, row, terminalFailure, deadlineReached, pages, pageStatusMap)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[run-story-job ${slug}] uncaught`, err)
    void maybeAlertProviderQuota(err, `run-story-job ${slug}`)
    // If this attempt has burned the last retry, terminally fail. Otherwise
    // bump the heartbeat (so cron picks it up after the stale window) and
    // hand off.
    const fresh = await getStoryRow(slug)
    if (fresh && fresh.attempts_remaining <= 0) {
      return await failStory(slug, fresh, message)
    }
    await heartbeat(slug)
    return { finalStatus: 'in_progress_handed_off' }
  }
}

// ── TEXT PHASE ────────────────────────────────────────────────────────────────

/**
 * Runs the text-generation phase (Claude API call → pages seeded into DB).
 * Returns the refreshed StoryRow with status='generating_images' and pages
 * populated, ready for the image phase.
 */
async function runTextPhase(
  slug: string,
  row: StoryRow,
  beat: () => Promise<void>,
): Promise<StoryRow> {
  await supabase
    .from('stories')
    .update({ status: 'generating_text', last_progress_at: new Date().toISOString() })
    .eq('slug', slug)

  const form = parseFormLenient(row.form)
  const needsText = !Array.isArray(row.pages) || (row.pages as unknown[]).length === 0
  if (needsText) {
    const story = await generateStoryStream(form, () => { void beat() })
    const seededStatus: PageStatus[] = story.pages.map(p => ({
      page_number: p.page_number,
      state: 'pending',
      attempts: 0,
      rewrites: 0,
      last_error: null,
      provider_used: null,
    }))
    // Stash the character sheet + style prefix in the form JSONB so the
    // image phase can reuse them without re-extracting via regex (the
    // scene_description no longer contains a cleanly separable sheet block
    // by convention — it's server-composed). No DB migration needed; the
    // image phase falls back to regex extraction for in-flight stories
    // created before this field existed.
    const formWithSheet = {
      ...form,
      character_sheet: story.character_sheet,
      style_prefix: story.style_prefix,
    }
    const { error: updateErr } = await supabase
      .from('stories')
      .update({
        title: story.title,
        pages: story.pages,
        page_status: seededStatus,
        form: formWithSheet,
        status: 'generating_images',
        last_progress_at: new Date().toISOString(),
      })
      .eq('slug', slug)
    if (updateErr) throw updateErr
  } else {
    await supabase
      .from('stories')
      .update({ status: 'generating_images', last_progress_at: new Date().toISOString() })
      .eq('slug', slug)
  }

  // Refresh row to pick up the freshly written pages.
  const refreshed = await getStoryRow(slug)
  if (!refreshed) throw new Error(`row vanished after text phase: ${slug}`)
  return refreshed
}

// ── IMAGE PHASE ───────────────────────────────────────────────────────────────

/**
 * Runs the image-generation phase: bounded 3-worker pool, one image per page.
 * Calls generatePage() for each not-done page and serialises page_status writes
 * via a mutex promise chain. Returns the terminal state so finalizeStory can
 * decide what to do next.
 */
async function runImagePhase(
  slug: string,
  row: StoryRow,
  deps: { beat: () => Promise<void>; deadlineHit: () => boolean },
): Promise<{
  terminalFailure: string | null
  deadlineReached: boolean
  pageStatusMap: Map<number, PageStatus>
  pages: StoryPage[]
}> {
  const { beat, deadlineHit } = deps
  const form = parseFormLenient(row.form)
  const pages = parsePagesLenient(row.pages)
  const artStyle: ArtStyle = (form.art_style as ArtStyle) || 'comic-book'
  const provider: ImageProvider = selectProviderForStyle(artStyle)
  // Prefer the values stashed on the form during the text phase; fall back to
  // regex extraction for in-flight stories created before this deploy (their
  // pages are already composed but the form has no stashed sheet/prefix).
  const formRecord = form as unknown as Record<string, unknown>
  const characterSheet =
    (typeof formRecord.character_sheet === 'string' && formRecord.character_sheet.trim())
      ? formRecord.character_sheet
      : extractCharacterSheet(form, pages)
  const stylePrefix =
    (typeof formRecord.style_prefix === 'string' && formRecord.style_prefix.trim())
      ? formRecord.style_prefix
      : extractStylePrefix(pages)

  // Index page_status by page_number for cheap updates.
  const pageStatusMap = new Map<number, PageStatus>()
  for (const ps of (row.page_status ?? [])) pageStatusMap.set(ps.page_number, ps)
  // Ensure every page has a status row (in case the text phase predates this code).
  for (const p of pages) {
    if (!pageStatusMap.has(p.page_number)) {
      pageStatusMap.set(p.page_number, {
        page_number: p.page_number,
        state: 'pending',
        attempts: 0,
        rewrites: 0,
        last_error: null,
        provider_used: null,
      })
    }
  }

  // First fatal page wins; workers stop pulling once this is set.
  let terminalFailure: string | null = null
  // Set once the soft deadline is reached — workers stop pulling, in-flight
  // pages settle, then the main flow hands off to the cron sweeper.
  let deadlineReached = false

  // Serialize page_status writes across the worker pool: every persist is
  // chained onto the previous one so upserts never overlap or reorder. All
  // workers mutate the SAME shared pageStatusMap, so each write sees the
  // latest merged snapshot.
  let persistChain: Promise<void> = Promise.resolve()
  const persistSafe = (): Promise<void> => {
    persistChain = persistChain
      .then(() => persistPageStatus(slug, pageStatusMap))
      .catch(err => console.warn(`[run-story-job ${slug}] page_status persist failed`, err))
    return persistChain
  }

  // Bounded worker pool: 3 workers share a single index cursor and each pulls
  // the next page until the list is exhausted, the deadline hits, or a
  // terminal failure is recorded. In-flight pages always settle (we never
  // abort mid-upload).
  const cursor = { i: 0 }
  const worker = async (): Promise<void> => {
    while (true) {
      if (terminalFailure || deadlineReached) return
      if (deadlineHit()) {
        deadlineReached = true
        return
      }
      const idx = cursor.i++
      if (idx >= pages.length) return
      const page = pages[idx]
      const status = pageStatusMap.get(page.page_number)!
      if (status.state === 'done') continue

      const result = await generatePage(page, {
        slug,
        artStyle,
        provider,
        characterSheet,
        stylePrefix,
        status,
        deadlineHit,
        beat,
        onDeadline: () => { deadlineReached = true },
      })

      if (result.ok) {
        // Page succeeded — persist and heartbeat.
        await persistSafe()
        await beat()
      } else if (result.fatal !== null) {
        // Fatal failure — record and persist; workers will stop on the next
        // iteration when they see terminalFailure is set.
        if (!terminalFailure) terminalFailure = result.fatal
        await persistSafe()
      }
      // else: deadline or non-fatal abort — leave page recoverable, no persist.
    }
  }
  await Promise.all([worker(), worker(), worker()])

  // Drain any in-flight persist so the DB reflects the final merged map. All
  // workers have returned, so no new persistSafe calls can race this.
  await persistChain

  return { terminalFailure, deadlineReached, pageStatusMap, pages }
}

// ── PER-PAGE GENERATION ───────────────────────────────────────────────────────

/**
 * Process a single page: recovery check + the transient/rewrite attempt loop.
 * Mutates ctx.status in place. Returns:
 *   { ok: true,  fatal: null }   — page generated and uploaded successfully
 *   { ok: false, fatal: string } — fatal error; caller should fail the story
 *   { ok: false, fatal: null }   — deadline hit; page left in a recoverable
 *                                  state for the cron sweeper
 *
 * Callers are responsible for persisting the updated page_status after this
 * returns. Exported so the per-page-regenerate endpoint (FEAT-3) can reuse it
 * directly without the full pool.
 *
 * PERF-4: imageExists() is only called when ctx.status.state === 'in_progress'
 * (a prior worker may have uploaded but crashed before persisting 'done').
 * Pending pages skip the storage check and go straight to generation — the
 * upload uses upsert:true so any re-generation of a stale pending page is safe.
 */
export async function generatePage(
  page: { page_number: number; scene_description: string },
  ctx: GeneratePageCtx,
): Promise<{ ok: boolean; fatal: string | null }> {
  const {
    slug, artStyle, provider, characterSheet, stylePrefix,
    status, deadlineHit, beat, onDeadline,
  } = ctx

  if (status.state === 'done') return { ok: true, fatal: null }

  const filename = `${slug}/page-${String(page.page_number).padStart(2, '0')}.png`

  // Only check storage when the page was left 'in_progress' — a prior worker
  // may have uploaded but crashed before persisting 'done'. Pending pages
  // (state === 'pending' in the DB, always attempts === 0) were never started,
  // or started but no intervening persistSafe captured the in_progress state;
  // in either case we skip the check and generate fresh.
  if (status.state === 'in_progress') {
    if (await imageExists(slug, page.page_number)) {
      status.state = 'done'
      return { ok: true, fatal: null }
    }
  }

  let currentPrompt = page.scene_description
  let pageFatal: string | null = null
  const previousRewrites: string[] = status.previous_rewrites ?? []

  while (status.attempts < MAX_ATTEMPTS_PER_PAGE && !pageFatal) {
    // Bail out between attempts if the deadline hit — leave the page
    // 'pending'/'in_progress' (NOT 'failed') so the sweeper re-claims it.
    if (deadlineHit()) {
      onDeadline()
      return { ok: false, fatal: null }
    }
    status.state = 'in_progress'
    status.provider_used = provider
    status.attempts += 1

    try {
      const buffer = await generateImage(currentPrompt, artStyle, provider)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, { contentType: 'image/png', upsert: true })
      if (uploadError) throw uploadError
      status.state = 'done'
      status.last_error = null
      return { ok: true, fatal: null }
    } catch (err) {
      const classification = classifyImageError(err)
      status.last_error = `${classification.category}: ${classification.message.slice(0, 200)}`
      console.warn(
        `[run-story-job ${slug} page ${page.page_number}] attempt ${status.attempts} → ${classification.category}: ${classification.message.slice(0, 200)}`,
      )
      void maybeAlertProviderQuota(err, `run-story-job ${slug} page ${page.page_number}`)

      if (classification.is_blocking) {
        pageFatal = `provider ${provider} is unavailable: ${classification.message.slice(0, 150)}`
        break
      }

      // Decide: backoff + same prompt, or rewrite?
      if (classification.retryable_same_prompt && (status.attempts - status.rewrites) <= MAX_TRANSIENT_RETRIES) {
        const transientCount = status.attempts - status.rewrites
        const delayMs = Math.min(8000, 500 * Math.pow(2, transientCount))
        await sleep(delayMs)
        await beat()
        continue
      }

      if (classification.retryable_after_rewrite && status.rewrites < MAX_REWRITES) {
        try {
          const rewritten = await rewritePromptForError({
            prompt: currentPrompt,
            provider,
            category: classification.category,
            errorMessage: classification.message,
            attempt: status.rewrites + 1,
            previousRewrites,
            characterSheet,
            stylePrefix,
          })
          previousRewrites.push(currentPrompt)
          status.previous_rewrites = previousRewrites.slice(-3)
          currentPrompt = rewritten
          status.rewrites += 1
          await beat()
          continue
        } catch (rewriteErr) {
          pageFatal = `prompt rewrite failed: ${rewriteErr instanceof Error ? rewriteErr.message : String(rewriteErr)}`
          break
        }
      }

      // Exhausted whichever budget applied → fatal for this page.
      pageFatal = `unable to recover after ${status.attempts} attempts (last error: ${classification.message.slice(0, 150)})`
      break
    }
  }

  if (status.state !== 'done') {
    if (!pageFatal) {
      // Loop exited without success and without a fatal reason — either the
      // attempt cap was hit or the deadline aborted us mid-loop. If the
      // deadline aborted, leave the page recoverable (don't mark failed).
      if (deadlineHit()) {
        onDeadline()
        return { ok: false, fatal: null }
      }
      pageFatal = `hit per-page attempt cap (${MAX_ATTEMPTS_PER_PAGE}) without success`
    }
    status.state = 'failed'
    status.last_error = pageFatal
    return { ok: false, fatal: pageFatal }
  }

  return { ok: true, fatal: null }
}

// ── FINALIZE ──────────────────────────────────────────────────────────────────

/**
 * Completes the job after the image phase returns: terminal failure → failStory,
 * soft-deadline/incomplete → persist + heartbeat + hand off to cron sweeper,
 * all-done → mark complete + send success email.
 */
async function finalizeStory(
  slug: string,
  row: StoryRow,
  terminalFailure: string | null,
  deadlineReached: boolean,
  pages: StoryPage[],
  pageStatusMap: Map<number, PageStatus>,
): Promise<JobResult> {
  if (terminalFailure) {
    return await failStory(slug, row, terminalFailure)
  }

  const everyDone = pages.every(p => pageStatusMap.get(p.page_number)?.state === 'done')
  if (deadlineReached || !everyDone) {
    // Soft-deadline handoff (or an otherwise-incomplete run): persist + beat
    // and let the cron sweeper re-claim and finish the remaining pages.
    await persistPageStatus(slug, pageStatusMap)
    await heartbeat(slug)
    return { finalStatus: 'in_progress_handed_off' }
  }

  await supabase
    .from('stories')
    .update({
      status: 'complete',
      images_done: true,
      last_progress_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  await sendSuccessIfNeeded(slug)
  return { finalStatus: 'complete' }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function persistPageStatus(slug: string, map: Map<number, PageStatus>): Promise<void> {
  const arr = Array.from(map.values()).sort((a, b) => a.page_number - b.page_number)
  await supabase
    .from('stories')
    .update({ page_status: arr, last_progress_at: new Date().toISOString() })
    .eq('slug', slug)
}

async function imageExists(slug: string, pageNumber: number): Promise<boolean> {
  const filename = `page-${String(pageNumber).padStart(2, '0')}.png`
  const { data } = await supabase.storage.from(BUCKET).list(slug, { search: filename })
  return !!(data && data.length > 0)
}

export async function sendSuccessIfNeeded(slug: string): Promise<void> {
  const fresh = await getStoryRow(slug)
  if (!fresh) return
  if (!fresh.email || fresh.notify_email_sent_at) return
  try {
    const { data: cover } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(`${slug}/page-00.png`)
    const form = parseFormLenient(fresh.form)
    const result = await sendStorySuccessEmail({
      to: fresh.email,
      title: fresh.title ?? 'Your storybook',
      slug,
      childName: (form.child_name as string) || 'your child',
      coverUrl: cover.publicUrl,
    })
    if (!result.ok) {
      // Leave notify_email_sent_at null so the row stays recoverable (status
      // route keeps reporting email_will_be_sent, admin endpoint can resend).
      console.error(`[run-story-job ${slug}] success email failed`, result)
      await maybeAlertEmailFailure(result, `success email for ${slug}`)
      return
    }
    await supabase
      .from('stories')
      .update({ notify_email_sent_at: new Date().toISOString() })
      .eq('slug', slug)
  } catch (err) {
    console.error(`[run-story-job ${slug}] success email failed`, err)
  }
}

export function extractCharacterSheet(form: WizardFormData, pages: Array<{ scene_description: string }>): string | undefined {
  // The character sheet is pasted verbatim into every scene_description by
  // Claude. We grab it back out of the first story page for the rewriter so
  // it can preserve the visual anchor across rewrites. Approximation is OK:
  // the rewriter is robust to a slightly noisy snippet.
  const first = pages[0]?.scene_description
  if (!first) return undefined
  // Most prompts look like: "<style prefix>. <character sheet>. <scene>"
  // Slice the middle chunk after the style prefix when we can.
  const noPrefix = first.replace(/^[^.]+\.\s*/, '')
  return noPrefix.slice(0, 800)
}

export function extractStylePrefix(pages: Array<{ scene_description: string }>): string | undefined {
  const first = pages[0]?.scene_description
  if (!first) return undefined
  const m = first.match(/^([^.]+\.)\s*/)
  return m?.[1]
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
