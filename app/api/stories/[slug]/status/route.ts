import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getExpectedTotal } from '@/lib/ai/generate-story'
import type { PageStatus } from '@/lib/jobs/claim'
import { parsePagesLenient, parseFormLenient } from '@/lib/validation'
import { STORY_IMAGES_BUCKET } from '@/lib/config'
import { apiError, apiOk } from '@/lib/api'

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
      'title, images_done, status, pages, page_status, failure_reason, email, notify_email_sent_at, form',
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return apiError(404, 'NOT_FOUND', 'not_found')
  }

  const pages = parsePagesLenient(data.pages)
  const total = pages.length
  // parseFormLenient is lenient but can throw when form is not an object at
  // all — fall back to an empty record so the status endpoint stays resilient.
  let form: Record<string, unknown>
  try {
    form = parseFormLenient(data.form ?? {}) as unknown as Record<string, unknown>
  } catch {
    form = {}
  }

  // text_progress: while pages haven't been written yet, estimate from form.length.
  // Once they exist, we're done with the text phase.
  let textProgress: { completed: number; total: number } | null = null
  if (data.status === 'pending' || data.status === 'generating_text') {
    const expected = getExpectedTotal(typeof form.length === 'string' ? form.length : 'medium')
    textProgress = { completed: total, total: expected }
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
    const { data: pub } = supabase.storage.from(STORY_IMAGES_BUCKET).getPublicUrl(filename)
    return {
      page_number: p.page_number,
      state,
      image_url: state === 'done' ? pub.publicUrl : null,
      attempt: ps?.attempts ?? 0,
      rewrites: ps?.rewrites ?? 0,
    }
  })

  // Only query credit_events when the story has already failed — the
  // generating page only needs the refunded flag in that terminal state.
  let refunded = false
  if (data.status === 'failed') {
    const { data: refundRow } = await supabase
      .from('credit_events')
      .select('id')
      .eq('story_slug', slug)
      .eq('reason', 'refund_failed_gen')
      .maybeSingle()
    refunded = !!refundRow
  }

  return apiOk(
    {
      title: data.title,
      status: data.status,
      total_pages: total,
      pages: pagesPayload,
      text_progress: textProgress,
      email_will_be_sent: !!data.email && !data.notify_email_sent_at,
      email_address_masked: data.email ? maskEmail(data.email as string) : null,
      failure_reason: data.failure_reason,
      refunded,
      images_done: Boolean(data.images_done),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  if (user.length <= 1) return `${user}***@${domain}`
  return `${user[0]}***@${domain}`
}
