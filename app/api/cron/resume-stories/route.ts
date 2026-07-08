import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { findStaleJobs, findExhaustedJobs } from '@/lib/jobs/claim'
import { failStory } from '@/lib/jobs/fail-story'
import { supabase } from '@/lib/supabase'
import { sendSuccessIfNeeded } from '@/lib/jobs/run-story-job'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Two-phase sweeper, run on a cron from GitHub Actions (Vercel Hobby caps
 * crons at once/day):
 *
 *   1) Terminally fail any in-flight job whose retry budget is exhausted
 *      and which has gone long-stale (>5 min). Without this they orphan
 *      forever — findStaleJobs filters them out and they sit in
 *      `generating_images` with no refund and no email.
 *
 *   2) Hand off each *recoverable* stale slug to /api/internal/process-story
 *      via fire-and-forget POST. That route declares its own 300s
 *      maxDuration, so each resumed worker gets the full 4-minute window
 *      runStoryJob's soft deadline was designed for — instead of sharing
 *      this route's 60s cap with up to 5 siblings.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  // Phase 1 — terminally fail exhausted-budget jobs.
  const exhausted = await findExhaustedJobs(10)
  const failed: string[] = []
  for (const row of exhausted) {
    try {
      await failStory(row.slug, row, 'exhausted retry budget')
      failed.push(row.slug)
    } catch (err) {
      console.error(`[cron/resume-stories ${row.slug}] failStory threw`, err)
    }
  }

  // Phase 2 — hand off recoverable stale jobs to the per-story worker.
  const stale = await findStaleJobs(5)
  const appUrl = process.env.APP_URL ?? `https://${req.headers.get('host') ?? 'storybookstudio.org'}`
  for (const slug of stale) {
    waitUntil(
      fetch(`${appUrl}/api/internal/process-story`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(secret ? { authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({ slug }),
      })
        .then(async res => {
          if (!res.ok) {
            const text = await res.text().catch(() => '')
            console.error(`[cron/resume-stories ${slug}] dispatch ${res.status}: ${text.slice(0, 200)}`)
          }
        })
        .catch(err => {
          console.error(`[cron/resume-stories ${slug}] dispatch threw`, err)
        }),
    )
  }

  // Phase 3 — retry unsent success emails for recently completed stories.
  // DEPLOYMENT NOTE: this phase requires migration 0008_notify_attempts.sql to
  // be applied to Supabase first. If the column does not yet exist the query
  // will return an error; we catch it, log once, and skip the phase so the
  // rest of the sweep is unaffected.
  let emailRetried = 0
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: emailRows, error: emailQueryErr } = await supabase
      .from('stories')
      .select('slug, notify_attempts')
      .eq('status', 'complete')
      .not('email', 'is', null)
      .is('notify_email_sent_at', null)
      .lt('notify_attempts', 5)
      .lt('last_progress_at', tenMinAgo)
      .order('last_progress_at', { ascending: true })
      .limit(10)

    if (emailQueryErr) {
      // Most likely cause: migration 0008 not yet applied. Log and skip.
      console.warn('[cron/resume-stories] email-retry query failed (migration 0008 pending?)', emailQueryErr)
    } else {
      for (const row of (emailRows ?? []) as Array<{ slug: string; notify_attempts: number }>) {
        try {
          // Increment notify_attempts before attempting the send so that a
          // crash or timeout during the send still consumes an attempt (cap: 5).
          await supabase
            .from('stories')
            .update({ notify_attempts: (row.notify_attempts ?? 0) + 1 })
            .eq('slug', row.slug)
          await sendSuccessIfNeeded(row.slug)
          emailRetried++
        } catch (err) {
          console.error(`[cron/resume-stories ${row.slug}] email retry threw`, err)
        }
      }
    }
  } catch (err) {
    console.error('[cron/resume-stories] email-retry phase threw', err)
  }

  return NextResponse.json({
    picked_up: stale.length,
    slugs: stale,
    terminally_failed: failed.length,
    failed_slugs: failed,
    email_retried: emailRetried,
  })
}
