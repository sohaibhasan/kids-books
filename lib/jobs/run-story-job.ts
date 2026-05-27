import { supabase } from '@/lib/supabase'
import { generateStoryStream } from '@/lib/ai/generate-story'
import { generateImage, selectProviderForStyle, ImageProvider } from '@/lib/ai/generate-image'
import { classifyImageError } from '@/lib/ai/classify-image-error'
import { rewritePromptForError } from '@/lib/ai/sanitize-prompt'
import { refundFailedGen } from '@/lib/credits'
import { maybeAlertProviderQuota } from '@/lib/alerts'
import { sendStorySuccessEmail, sendStoryFailureEmail } from './emails'
import { claimStory, heartbeat, getStoryRow, type PageStatus, type StoryRow } from './claim'
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
    await heartbeat(slug)
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
      await supabase
        .from('stories')
        .update({ status: 'generating_text', last_progress_at: new Date().toISOString() })
        .eq('slug', slug)

      const form = parseForm(row.form)
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
        const { error: updateErr } = await supabase
          .from('stories')
          .update({
            title: story.title,
            pages: story.pages,
            page_status: seededStatus,
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
      row = refreshed
    }

    // ---------------------- IMAGE PHASE ----------------------
    const form = parseForm(row.form)
    const pages = parsePages(row.pages)
    const artStyle: ArtStyle = (form.art_style as ArtStyle) || 'comic-book'
    const provider: ImageProvider = selectProviderForStyle(artStyle)
    const characterSheet = extractCharacterSheet(form, pages)
    const stylePrefix = extractStylePrefix(pages)

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

    let terminalFailure: string | null = null

    for (const page of pages) {
      const status = pageStatusMap.get(page.page_number)!
      if (status.state === 'done') continue

      if (deadlineHit()) {
        await persistPageStatus(slug, pageStatusMap)
        await heartbeat(slug)
        return { finalStatus: 'in_progress_handed_off' }
      }

      const filename = `${slug}/page-${String(page.page_number).padStart(2, '0')}.png`

      // If the image was uploaded by a prior crashed worker, just record it.
      if (await imageExists(slug, page.page_number)) {
        status.state = 'done'
        await persistPageStatus(slug, pageStatusMap)
        continue
      }

      let currentPrompt = page.scene_description
      let pageFatal: string | null = null
      const previousRewrites: string[] = status.previous_rewrites ?? []

      while (status.attempts < MAX_ATTEMPTS_PER_PAGE && !pageFatal) {
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
          break
        } catch (err) {
          const classification = classifyImageError(err, provider)
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
          pageFatal = `hit per-page attempt cap (${MAX_ATTEMPTS_PER_PAGE}) without success`
        }
        status.state = 'failed'
        status.last_error = pageFatal
        terminalFailure = pageFatal
        await persistPageStatus(slug, pageStatusMap)
        break  // single page failure terminates the whole story
      }

      await persistPageStatus(slug, pageStatusMap)
      await beat()
    }

    // ---------------------- FINALIZE ----------------------
    if (terminalFailure) {
      return await failStory(slug, row, terminalFailure)
    }

    const everyDone = pages.every(p => pageStatusMap.get(p.page_number)?.state === 'done')
    if (!everyDone) {
      // Should be unreachable unless deadlineHit caught us first (already handled).
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

async function sendSuccessIfNeeded(slug: string): Promise<void> {
  const fresh = await getStoryRow(slug)
  if (!fresh) return
  if (!fresh.email || fresh.notify_email_sent_at) return
  try {
    const { data: cover } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(`${slug}/page-00.png`)
    const form = parseForm(fresh.form)
    await sendStorySuccessEmail({
      to: fresh.email,
      title: fresh.title ?? 'Your storybook',
      slug,
      childName: (form.child_name as string) || 'your child',
      coverUrl: cover.publicUrl,
    })
    await supabase
      .from('stories')
      .update({ notify_email_sent_at: new Date().toISOString() })
      .eq('slug', slug)
  } catch (err) {
    console.error(`[run-story-job ${slug}] success email failed`, err)
  }
}

async function failStory(slug: string, row: StoryRow, reason: string): Promise<JobResult> {
  let refunded = false
  if (row.credit_event_id && row.device_id) {
    try {
      const r = await refundFailedGen(row.device_id, slug)
      refunded = r.refunded
    } catch (refundErr) {
      console.error(`[run-story-job ${slug}] refund failed`, refundErr)
    }
  }
  await supabase
    .from('stories')
    .update({
      status: 'failed',
      failure_reason: reason.slice(0, 600),
      last_progress_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  if (row.email && !row.notify_email_sent_at) {
    try {
      const form = parseForm(row.form)
      await sendStoryFailureEmail({
        to: row.email,
        childName: (form.child_name as string) || 'your child',
        refunded,
        failureReason: reason,
      })
      await supabase
        .from('stories')
        .update({ notify_email_sent_at: new Date().toISOString() })
        .eq('slug', slug)
    } catch (mailErr) {
      console.error(`[run-story-job ${slug}] failure email failed`, mailErr)
    }
  }
  return { finalStatus: 'failed', reason }
}

function parseForm(raw: unknown): WizardFormData {
  if (typeof raw === 'string') return JSON.parse(raw) as WizardFormData
  return raw as WizardFormData
}

function parsePages(raw: unknown): Array<{ page_number: number; scene_description: string }> {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw
  return Array.isArray(data) ? data : []
}

function extractCharacterSheet(form: WizardFormData, pages: Array<{ scene_description: string }>): string | undefined {
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

function extractStylePrefix(pages: Array<{ scene_description: string }>): string | undefined {
  const first = pages[0]?.scene_description
  if (!first) return undefined
  const m = first.match(/^([^.]+\.)\s*/)
  return m?.[1]
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
