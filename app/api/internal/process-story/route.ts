import { NextRequest, NextResponse } from 'next/server'
import { runStoryJob } from '@/lib/jobs/run-story-job'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * Internal endpoint that owns a full 4-minute budget for one story's
 * worker. The cron sweeper fires fire-and-forget POSTs here per stale
 * slug so each resumed job gets the same window the original /api/stories/start
 * worker had, with no parallel starvation under cron's 60s cap.
 *
 * Auth: same shared CRON_SECRET as /api/cron/resume-stories.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  let slug: string | undefined
  try {
    const body = await req.json()
    slug = typeof body?.slug === 'string' ? body.slug : undefined
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const result = await runStoryJob(slug)
  return NextResponse.json({ ok: true, slug, result })
}
