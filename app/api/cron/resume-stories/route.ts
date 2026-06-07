import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { findStaleJobs, findExhaustedJobs } from '@/lib/jobs/claim'
import { failStory } from '@/lib/jobs/fail-story'

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

  return NextResponse.json({
    picked_up: stale.length,
    slugs: stale,
    terminally_failed: failed.length,
    failed_slugs: failed,
  })
}
