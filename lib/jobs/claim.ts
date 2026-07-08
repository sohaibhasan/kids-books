import { supabase } from '@/lib/supabase'

export type StoryStatus =
  | 'pending'
  | 'generating_text'
  | 'generating_images'
  | 'complete'
  | 'failed'

export interface StoryRow {
  slug: string
  status: StoryStatus
  title: string | null
  form: Record<string, unknown>
  pages: unknown
  device_id: string | null
  credit_event_id: string | null
  email: string | null
  notify_email_sent_at: string | null
  attempts_total: number
  attempts_remaining: number
  page_status: PageStatus[]
  failure_reason: string | null
}

export interface PageStatus {
  page_number: number
  state: 'pending' | 'in_progress' | 'done' | 'failed'
  attempts: number          // total provider calls (transient retries + rewrites)
  rewrites: number          // rewrites only
  last_error: string | null
  provider_used: string | null
  previous_rewrites?: string[]  // last few rewritten prompts so the next round can diverge
  image_version?: number        // FEAT-3: bumped (Date.now()) each time this page is regenerated; used as a ?v cache-buster on the public URL
}

// Full-row select used wherever the job runner needs every field it might
// mutate or inspect. Per-route endpoints deliberately use narrower selects
// (PERF-5 and intentional read minimisation) — do NOT widen those here.
export const STORY_SELECT =
  'slug, status, title, form, pages, device_id, credit_event_id, email, notify_email_sent_at, attempts_total, attempts_remaining, page_status, failure_reason'

/**
 * Atomically claim a story for processing. Returns the row if this caller
 * won the claim, null if another worker already owns it (or the row is
 * already in a terminal state).
 *
 * Rules:
 *   - `pending` is always claimable.
 *   - `generating_text` / `generating_images` is claimable only if
 *     last_progress_at is older than 90s (stale — the previous worker
 *     almost certainly died / timed out).
 *   - `complete` / `failed` is never re-claimed.
 *
 * The conditional UPDATE ... RETURNING is the single source of mutual
 * exclusion — two cron pickups racing for the same slug both call this and
 * exactly one wins.
 */
export async function claimStory(slug: string): Promise<StoryRow | null> {
  const now = new Date().toISOString()
  const stale = new Date(Date.now() - 90_000).toISOString()

  // Try to claim a fresh pending job first. The conditional UPDATE is
  // atomic — if two workers race here, exactly one gets data, the other
  // gets null (PG row locking + predicate re-check on commit).
  const fresh = await supabase
    .from('stories')
    .update({ last_progress_at: now })
    .eq('slug', slug)
    .eq('status', 'pending')
    .gt('attempts_remaining', 0)
    .select(STORY_SELECT)
    .maybeSingle()
  if (fresh.error) {
    console.error(`[claim ${slug}] fresh update error`, fresh.error)
  }
  if (fresh.data) return fresh.data as unknown as StoryRow

  // Otherwise try to take over a stale in-flight job (cron recovery path).
  const recovery = await supabase
    .from('stories')
    .update({ last_progress_at: now })
    .eq('slug', slug)
    .in('status', ['generating_text', 'generating_images'])
    .lt('last_progress_at', stale)
    .gt('attempts_remaining', 0)
    .select(STORY_SELECT)
    .maybeSingle()
  if (recovery.error) {
    console.error(`[claim ${slug}] recovery update error`, recovery.error)
    return null
  }
  return (recovery.data as unknown as StoryRow) ?? null
}

/** Heartbeat — bump last_progress_at so cron leaves us alone. */
export async function heartbeat(slug: string): Promise<void> {
  await supabase
    .from('stories')
    .update({ last_progress_at: new Date().toISOString() })
    .eq('slug', slug)
}

/** Re-read the current row (we own the claim, so no concurrency check). */
export async function getStoryRow(slug: string): Promise<StoryRow | null> {
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error(`[getStoryRow ${slug}]`, error)
    return null
  }
  return data as unknown as StoryRow | null
}

/** Find stale jobs for the cron sweeper. */
export async function findStaleJobs(limit = 5): Promise<string[]> {
  const stale = new Date(Date.now() - 90_000).toISOString()
  const { data, error } = await supabase
    .from('stories')
    .select('slug')
    .in('status', ['pending', 'generating_text', 'generating_images'])
    .gt('attempts_remaining', 0)
    .lt('last_progress_at', stale)
    .order('last_progress_at', { ascending: true })
    .limit(limit)
  if (error) {
    console.error('[findStaleJobs]', error)
    return []
  }
  return (data ?? []).map(r => r.slug as string)
}

/**
 * Find in-flight jobs whose retry budget is exhausted. These rows would
 * otherwise be ignored by `findStaleJobs` forever — the cron sweeper calls
 * this to terminally fail them (refund + email) instead of leaving them
 * parked. The 5-minute long-stale gate keeps us from racing an actively
 * claimed worker that just happens to be on its last attempt.
 */
export async function findExhaustedJobs(limit = 10): Promise<StoryRow[]> {
  const longStale = new Date(Date.now() - 300_000).toISOString()
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .in('status', ['pending', 'generating_text', 'generating_images'])
    .lte('attempts_remaining', 0)
    .lt('last_progress_at', longStale)
    .order('last_progress_at', { ascending: true })
    .limit(limit)
  if (error) {
    console.error('[findExhaustedJobs]', error)
    return []
  }
  return (data ?? []) as unknown as StoryRow[]
}
