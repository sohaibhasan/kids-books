import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { findStaleJobs } from '@/lib/jobs/claim'
import { runStoryJob } from '@/lib/jobs/run-story-job'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Resumes any in-flight story job whose worker died mid-flight (function
 * timeout, container reclaim). Vercel hits this on a 1-minute cron; the
 * authorize header is the platform-set bearer token from CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const stale = await findStaleJobs(5)
  for (const slug of stale) {
    waitUntil(
      runStoryJob(slug).catch(err => {
        console.error(`[cron/resume-stories ${slug}] threw`, err)
      }),
    )
  }
  return NextResponse.json({ picked_up: stale.length, slugs: stale })
}
