import { supabase } from './supabase'
import { sendEmail, type SendEmailResult } from './email'

const ALERT_DEBOUNCE_MS = 60 * 60 * 1000 // 1 hour per provider

type Provider = 'anthropic' | 'openai' | 'recraft' | 'fal' | 'unknown'

interface QuotaSignal {
  provider: Provider
  status: number
  message: string
}

/** Inspect a thrown error and return a structured quota signal if it's a 402/429, else null. */
function classify(err: unknown): QuotaSignal | null {
  const message = err instanceof Error ? err.message : String(err)
  const sdkStatus = (err as { status?: number; statusCode?: number })?.status ??
                    (err as { status?: number; statusCode?: number })?.statusCode
  const inlineMatch = message.match(/\((\d{3})\)/)?.[1]
  const status = sdkStatus ?? (inlineMatch ? Number(inlineMatch) : 0)
  if (status !== 402 && status !== 429) return null

  const lower = message.toLowerCase()
  let provider: Provider = 'unknown'
  if (lower.includes('openai')) provider = 'openai'
  else if (lower.includes('recraft')) provider = 'recraft'
  else if (lower.includes('fal')) provider = 'fal'
  else if (lower.includes('anthropic') || lower.includes('claude')) provider = 'anthropic'

  return { provider, status, message: message.slice(0, 400) }
}

/**
 * If `err` looks like a 402/429, send an alert email to the operator —
 * but only once per provider per hour, to avoid inbox spam on a stuck job.
 *
 * Safe to call from any catch block. Never throws.
 */
export async function maybeAlertProviderQuota(err: unknown, contextHint?: string): Promise<void> {
  try {
    const sig = classify(err)
    if (!sig) return

    const { data } = await supabase
      .from('provider_alerts')
      .select('last_alerted_at, alert_count')
      .eq('provider', sig.provider)
      .maybeSingle()

    const now = Date.now()
    const lastMs = data?.last_alerted_at ? new Date(data.last_alerted_at).getTime() : 0
    const debounced = now - lastMs < ALERT_DEBOUNCE_MS

    // Always increment the counter so we can see scope in the audit, but only email outside the debounce window.
    await supabase.from('provider_alerts').upsert({
      provider: sig.provider,
      last_alerted_at: debounced ? data!.last_alerted_at : new Date(now).toISOString(),
      last_status: sig.status,
      last_error: sig.message,
      alert_count: (data?.alert_count ?? 0) + 1,
    })

    if (debounced) return

    const to = process.env.ALERT_EMAIL
    if (!to) {
      console.warn('[alerts] ALERT_EMAIL not set — skipping email send')
      return
    }

    const reload: Record<Provider, string> = {
      anthropic: 'https://console.anthropic.com/settings/billing',
      openai:    'https://platform.openai.com/account/billing/overview',
      recraft:   'https://www.recraft.ai/profile/api',
      fal:       'https://fal.ai/dashboard/billing',
      unknown:   'https://storybookstudio.org',
    }

    const label = sig.status === 402 ? 'Out of credit / payment required' : 'Rate limited'
    await sendEmail({
      to,
      subject: `[Storybook Studio] ${sig.provider} ${sig.status} — ${label}`,
      html: `
        <h2>Provider quota alert</h2>
        <p><b>${sig.provider.toUpperCase()}</b> returned <b>HTTP ${sig.status}</b> (${label}).</p>
        ${contextHint ? `<p>Context: ${contextHint}</p>` : ''}
        <p>Reload credits: <a href="${reload[sig.provider]}">${reload[sig.provider]}</a></p>
        <pre style="background:#f6f6f6;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:12px">${sig.message}</pre>
        <p style="color:#888;font-size:12px">Further alerts for ${sig.provider} are debounced for 1 hour.</p>
      `,
    })
  } catch (alertErr) {
    console.error('[alerts] alert handler failed', alertErr)
  }
}

/**
 * Notify the operator that a transactional email failed to send. Call this
 * with the result of a `sendEmail` attempt whenever `ok` is false.
 *
 * Early-returns on `missing_config` — if RESEND_API_KEY/EMAIL_FROM are the
 * problem, this alert can't send either, so there's no point trying (and it
 * avoids a recursive failure loop). Never throws.
 */
export async function maybeAlertEmailFailure(
  result: SendEmailResult,
  contextHint?: string,
): Promise<void> {
  try {
    if (result.ok) return
    if (result.reason === 'missing_config') {
      console.warn('[alerts] email send skipped (missing_config) — not alerting', contextHint ?? '')
      return
    }

    const to = process.env.ALERT_EMAIL
    if (!to) {
      console.warn('[alerts] ALERT_EMAIL not set — skipping email-failure alert')
      return
    }

    await sendEmail({
      to,
      subject: `[Storybook Studio] transactional email failed (HTTP ${result.status ?? '??'})`,
      html: `
        <h2>Transactional email failed</h2>
        <p>Resend returned <b>HTTP ${result.status ?? 'unknown'}</b>.</p>
        ${contextHint ? `<p>Context: ${contextHint}</p>` : ''}
        <pre style="background:#f6f6f6;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:12px">${(result.body ?? '').slice(0, 600)}</pre>
        <p style="color:#888;font-size:12px">The recipient row was left without a notify_email_sent_at timestamp, so it remains recoverable via the admin resend endpoint.</p>
      `,
    })
  } catch (alertErr) {
    console.error('[alerts] email-failure alert handler failed', alertErr)
  }
}
