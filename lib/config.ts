// ── Central constants ─────────────────────────────────────────────────────────
// Single source of truth for values that would otherwise be copy-pasted across
// the job runner, API routes, and the generating-page client. Import from here;
// never re-declare these locally.

// Supabase Storage bucket for all generated story images.
export const STORY_IMAGES_BUCKET = 'story-images'

// ── Job execution budgets ─────────────────────────────────────────────────────

// How long a single Vercel function invocation may run before handing off to
// the cron sweeper. Must be well under the 300 s function cap.
export const SOFT_DEADLINE_MS = 240_000

// Maximum number of transient (same-prompt) retries before escalating to a
// prompt rewrite.
export const MAX_TRANSIENT_RETRIES = 4

// Maximum number of prompt rewrites per page before giving up.
export const MAX_REWRITES = 4

// Hard cap on total provider calls per page (transient retries + rewrites).
export const MAX_ATTEMPTS_PER_PAGE = 8

// How often to bump last_progress_at so the cron sweeper leaves us alone.
export const HEARTBEAT_EVERY_MS = 25_000

// ── Generating-page adaptive polling ─────────────────────────────────────────

// Poll interval while status === 'generating_images' (fast feedback as pages
// complete).
export const POLL_MS_IMAGES = 3_000

// Poll interval while status === 'pending' or 'generating_text' (text gen is
// slow; no point hammering the endpoint).
export const POLL_MS_TEXT = 5_000

// Poll interval once SLOW_AFTER_MS has elapsed (tab left open; be
// conservative).
export const POLL_MS_SLOW = 8_000

// After this many milliseconds of total elapsed time, switch to POLL_MS_SLOW
// regardless of status.
export const SLOW_AFTER_MS = 120_000

// ── Freemium ──────────────────────────────────────────────────────────────────

// Default daily cap for free stories (overridden by FREE_STORIES_PER_DAY_GLOBAL
// env var).
export const FREE_GLOBAL_DAILY_DEFAULT = 200
