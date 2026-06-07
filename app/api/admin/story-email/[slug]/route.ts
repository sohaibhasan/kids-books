import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getStoryRow } from '@/lib/jobs/claim'
import { sendStorySuccessEmail } from '@/lib/jobs/emails'
import { maybeAlertEmailFailure } from '@/lib/alerts'
import { WizardFormData } from '@/types'

export const dynamic = 'force-dynamic'

const BUCKET = 'story-images'

/**
 * Admin inspect + force-resend for a story's "ready" email.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}`. This route FAILS CLOSED — if
 * CRON_SECRET is unset we reject everything, because a resend endpoint must
 * never be publicly open (unlike the cron route, which is harmless when
 * triggered without a secret).
 */
function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return (req.headers.get('authorization') ?? '') === `Bearer ${secret}`
}

function parseForm(raw: unknown): WizardFormData {
  if (typeof raw === 'string') return JSON.parse(raw) as WizardFormData
  return raw as WizardFormData
}

/** GET → inspect the row's email-delivery state. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { slug } = await params
  const row = await getStoryRow(slug)
  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json({
    slug: row.slug,
    status: row.status,
    title: row.title,
    email: row.email,
    notify_email_sent_at: row.notify_email_sent_at,
  })
}

/**
 * POST → force-resend the success email, ignoring `notify_email_sent_at` on
 * the way in. Only writes the timestamp on a confirmed 2xx, and returns the
 * SendEmailResult so a still-failing send is visible to the caller.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { slug } = await params
  const row = await getStoryRow(slug)
  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (!row.email) {
    return NextResponse.json({ error: 'no_email_on_row' }, { status: 400 })
  }
  if (row.status !== 'complete') {
    return NextResponse.json(
      { error: 'not_complete', status: row.status },
      { status: 409 },
    )
  }

  const { data: cover } = supabase.storage.from(BUCKET).getPublicUrl(`${slug}/page-00.png`)
  const form = parseForm(row.form)
  const result = await sendStorySuccessEmail({
    to: row.email,
    title: row.title ?? 'Your storybook',
    slug,
    childName: (form.child_name as string) || 'your child',
    coverUrl: cover.publicUrl,
  })

  if (result.ok) {
    await supabase
      .from('stories')
      .update({ notify_email_sent_at: new Date().toISOString() })
      .eq('slug', slug)
    return NextResponse.json({ sent: true, result })
  }

  await maybeAlertEmailFailure(result, `admin force-resend for ${slug}`)
  return NextResponse.json({ sent: false, result }, { status: 502 })
}
