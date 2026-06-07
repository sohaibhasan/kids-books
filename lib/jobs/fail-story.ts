import { supabase } from '@/lib/supabase'
import { refundFailedGen } from '@/lib/credits'
import { sendStoryFailureEmail } from './emails'
import type { StoryRow } from './claim'
import { WizardFormData } from '@/types'

export type FailResult = { finalStatus: 'failed'; reason: string }

/**
 * Terminally fail a story: refund (if paid), mark status='failed', send the
 * failure email. Idempotent on the email side via notify_email_sent_at; the
 * refund helper is also idempotent.
 */
export async function failStory(
  slug: string,
  row: StoryRow,
  reason: string,
): Promise<FailResult> {
  let refunded = false
  if (row.credit_event_id && row.device_id) {
    try {
      const r = await refundFailedGen(row.device_id, slug)
      refunded = r.refunded
    } catch (refundErr) {
      console.error(`[failStory ${slug}] refund failed`, refundErr)
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
      console.error(`[failStory ${slug}] failure email failed`, mailErr)
    }
  }

  return { finalStatus: 'failed', reason }
}

function parseForm(raw: unknown): WizardFormData {
  if (typeof raw === 'string') return JSON.parse(raw) as WizardFormData
  return raw as WizardFormData
}
