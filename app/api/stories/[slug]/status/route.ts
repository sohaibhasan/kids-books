import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getExpectedTotal } from '@/lib/ai/generate-story'
import type { PageStatus } from '@/lib/jobs/claim'

const BUCKET = 'story-images'

/**
 * Rich status used by /generating to drive its polling UI. Returns:
 *   - status (pending → generating_text → generating_images → complete/failed)
 *   - per-page state + cached image URLs as they become available
 *   - text_progress (estimated from page count vs. expected total)
 *   - email banner info (masked) so we can tell the user where it'll arrive
 *   - failure_reason for the terminal "we couldn't finish" screen
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data, error } = await supabase
    .from('stories')
    .select(
      'slug, title, images_done, status, pages, page_status, last_progress_at, failure_reason, email, notify_email_sent_at, form',
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const pages = parseArray(data.pages) as Array<{ page_number: number; type?: string }>
  const total = pages.length
  const form = typeof data.form === 'string' ? JSON.parse(data.form) : (data.form ?? {})

  // text_progress: while pages haven't been written yet, estimate from form.length.
  // Once they exist, we're done with the text phase.
  let textProgress: { completed: number; total: number } | null = null
  if (data.status === 'pending' || data.status === 'generating_text') {
    const expected = getExpectedTotal(form?.length ?? 'medium')
    textProgress = { completed: total, total: expected }
  } else {
    textProgress = null
  }

  const pageStatus: PageStatus[] = Array.isArray(data.page_status)
    ? (data.page_status as PageStatus[])
    : []
  const psByNum = new Map<number, PageStatus>()
  for (const ps of pageStatus) psByNum.set(ps.page_number, ps)

  const pagesPayload = pages.map(p => {
    const ps = psByNum.get(p.page_number)
    const state = ps?.state ?? 'pending'
    const filename = `${slug}/page-${String(p.page_number).padStart(2, '0')}.png`
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return {
      page_number: p.page_number,
      state,
      image_url: state === 'done' ? pub.publicUrl : null,
      attempt: ps?.attempts ?? 0,
      rewrites: ps?.rewrites ?? 0,
    }
  })

  const { data: refundRow } = await supabase
    .from('credit_events')
    .select('id')
    .eq('story_slug', slug)
    .eq('reason', 'refund_failed_gen')
    .maybeSingle()

  return NextResponse.json(
    {
      slug,
      title: data.title,
      status: data.status,
      total_pages: total,
      pages: pagesPayload,
      text_progress: textProgress,
      email_will_be_sent: !!data.email && !data.notify_email_sent_at,
      email_address_masked: data.email ? maskEmail(data.email as string) : null,
      last_progress_at: data.last_progress_at,
      failure_reason: data.failure_reason,
      refunded: !!refundRow,
      images_done: Boolean(data.images_done),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function parseArray(raw: unknown): unknown[] {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw
  return Array.isArray(data) ? data : []
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  if (user.length <= 1) return `${user}***@${domain}`
  return `${user[0]}***@${domain}`
}
