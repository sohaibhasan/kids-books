/**
 * Resolve the canonical app URL.
 *
 * In production, APP_URL must be set explicitly. Falling back to the request
 * origin would let an attacker spoof the Host header on a webhook replay or
 * a maliciously-routed claim request and inject a phishing URL into the
 * recovery email Stripe success/cancel redirect.
 *
 * In dev/preview, fall back to the request origin so localhost and Vercel
 * preview deployments work without configuration.
 */
export function appUrl(req?: { url: string } | Request): string {
  const explicit = process.env.APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[app-url] APP_URL is required in production. ' +
        'Set it to the canonical https URL (e.g. https://storybookstudio.org) ' +
        'in the deployment environment.',
    )
  }

  if (req) return new URL(req.url).origin
  return 'http://localhost:3000'
}
