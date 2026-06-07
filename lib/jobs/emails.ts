import { sendEmail, type SendEmailResult } from '@/lib/email'
import { appUrl } from '@/lib/app-url'

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

// Support address on the verified sending subdomain. Used for Reply-To and the
// List-Unsubscribe header — both improve inbox placement (esp. with Apple Mail).
const SUPPORT_ADDRESS = 'hello@support.storybookstudio.org'

// Standard headers attached to every transactional send. Even one-shot
// transactional mail places better when List-Unsubscribe is present.
const DELIVERABILITY_HEADERS: Record<string, string> = {
  'List-Unsubscribe': `<mailto:${SUPPORT_ADDRESS}?subject=unsubscribe>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
}

const wrap = (inner: string) => `
  <div style="font-family: ${FONT_STACK}; line-height: 1.55; color: #2a2118; max-width: 560px; margin: 0 auto; padding: 24px;">
    ${inner}
    <hr style="margin: 32px 0 16px; border: none; border-top: 1px solid #ece7df;" />
    <p style="font-size: 12px; color: #998c7c; margin: 0;">
      Storybook Studio · personalized stories for kids.<br/>
      This is the only email we'll send. We didn't add you to a list.
    </p>
  </div>
`

export interface SuccessOptions {
  to: string
  title: string
  slug: string
  childName: string
  coverUrl?: string
}

export async function sendStorySuccessEmail(opts: SuccessOptions): Promise<SendEmailResult> {
  const url = `${appUrl()}/read/${opts.slug}`
  const cover = opts.coverUrl
    ? `<img src="${opts.coverUrl}" alt="" width="520" style="display:block; max-width:100%; height:auto; border-radius:14px; margin: 0 0 24px;" />`
    : ''
  const html = wrap(`
    <p style="font-size: 13px; color: #998c7c; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 8px;">Your story is ready</p>
    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; line-height: 1.2; margin: 0 0 12px; color: #1a140e;">
      ${escapeHtml(opts.childName)}&rsquo;s story is ready to read.
    </h1>
    <p style="margin: 0 0 24px; color: #574838; font-size: 16px;">
      We just finished &ldquo;${escapeHtml(opts.title)}&rdquo;. Tap below to open the book.
    </p>
    ${cover}
    <p style="margin: 0 0 32px;">
      <a href="${url}" style="display:inline-block; background:#e25d3d; color:#fff; text-decoration:none; font-weight:600; padding:14px 24px; border-radius:999px; font-size:16px;">
        Read &ldquo;${escapeHtml(opts.title)}&rdquo;
      </a>
    </p>
    <p style="margin: 0; color: #998c7c; font-size: 13px;">
      Or copy this link: <a href="${url}" style="color:#998c7c;">${url}</a>
    </p>
  `)
  const text = [
    `${opts.childName}'s story is ready to read.`,
    '',
    `We just finished "${opts.title}". Open the book here:`,
    url,
    '',
    '— Storybook Studio',
  ].join('\n')
  return sendEmail({
    to: opts.to,
    subject: `“${opts.title}” is ready to read`,
    html,
    text,
    replyTo: SUPPORT_ADDRESS,
    headers: DELIVERABILITY_HEADERS,
  })
}

export interface FailureOptions {
  to: string
  childName: string
  refunded: boolean
  failureReason?: string | null
}

export async function sendStoryFailureEmail(opts: FailureOptions): Promise<SendEmailResult> {
  const url = `${appUrl()}/wizard`
  const refundLine = opts.refunded
    ? `<p style="margin: 0 0 16px;">We've <strong>refunded the credit</strong> to your account — please give it another try with a different art style or a slightly different setup.</p>`
    : `<p style="margin: 0 0 16px;">Please give it another try with a different art style or a slightly different setup.</p>`
  const reasonLine = opts.failureReason
    ? `<p style="margin: 0 0 24px; color: #998c7c; font-size: 13px;"><em>What went wrong: ${escapeHtml(opts.failureReason)}</em></p>`
    : ''
  const html = wrap(`
    <p style="font-size: 13px; color: #998c7c; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 8px;">Story not delivered</p>
    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.2; margin: 0 0 12px; color: #1a140e;">
      Sorry — we couldn&rsquo;t finish ${escapeHtml(opts.childName)}&rsquo;s story.
    </h1>
    <p style="margin: 0 0 16px; color: #574838; font-size: 16px;">
      One of our illustration providers kept hiccuping on a particular page and we couldn&rsquo;t deliver every one. Rather than ship you a half-finished book, we held off.
    </p>
    ${refundLine}
    ${reasonLine}
    <p style="margin: 0 0 32px;">
      <a href="${url}" style="display:inline-block; background:#e25d3d; color:#fff; text-decoration:none; font-weight:600; padding:14px 24px; border-radius:999px; font-size:16px;">
        Try another story
      </a>
    </p>
  `)
  const refundText = opts.refunded
    ? "We've refunded the credit to your account — please give it another try with a different art style or a slightly different setup."
    : 'Please give it another try with a different art style or a slightly different setup.'
  const text = [
    `Sorry — we couldn't finish ${opts.childName}'s story.`,
    '',
    "One of our illustration providers kept hiccuping on a particular page and we couldn't deliver every one. Rather than ship a half-finished book, we held off.",
    '',
    refundText,
    opts.failureReason ? `\nWhat went wrong: ${opts.failureReason}` : '',
    '',
    `Try another story: ${url}`,
    '',
    '— Storybook Studio',
  ].join('\n')
  return sendEmail({
    to: opts.to,
    subject: `Sorry — we couldn't finish ${opts.childName}'s story`,
    html,
    text,
    replyTo: SUPPORT_ADDRESS,
    headers: DELIVERABILITY_HEADERS,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
