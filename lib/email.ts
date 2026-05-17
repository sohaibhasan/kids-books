/** Send a transactional email via Resend's REST API (no SDK dep). */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    console.warn('[email] RESEND_API_KEY or EMAIL_FROM missing — skipping send')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[email] resend error', res.status, body)
  }
}
