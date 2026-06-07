/**
 * Result of a send attempt. Callers use `ok` to decide whether to record a
 * `notify_email_sent_at` timestamp — a failed send must stay recoverable, so
 * we never report success unless Resend returned a 2xx.
 */
export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'missing_config' | 'resend_error'; status?: number; body?: string }

/** Send a transactional email via Resend's REST API (no SDK dep). */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  /** Plain-text alternative. Including a text part (multipart/alternative)
   *  materially improves inbox placement — HTML-only mail is a spam signal. */
  text?: string
  replyTo?: string
  headers?: Record<string, string>
}): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    console.warn('[email] RESEND_API_KEY or EMAIL_FROM missing — skipping send')
    return { ok: false, reason: 'missing_config' }
  }

  const payload: Record<string, unknown> = {
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  }
  if (opts.text) payload.text = opts.text
  if (opts.replyTo) payload.reply_to = opts.replyTo
  if (opts.headers && Object.keys(opts.headers).length > 0) payload.headers = opts.headers

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[email] resend error', res.status, body)
    return { ok: false, reason: 'resend_error', status: res.status, body }
  }

  const json = (await res.json().catch(() => null)) as { id?: string } | null
  return { ok: true, id: json?.id ?? null }
}
