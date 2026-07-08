import { NextResponse } from 'next/server'

/**
 * Standard JSON error response.
 *
 * The `error` key is preserved verbatim so existing clients keep working:
 *   - WizardContainer reads `body.error` on non-ok responses from /api/stories/start
 *   - PaywallModal reads `body.error` on checkout errors
 *   - StoryReader reads `data.error` on regenerate failures
 *
 * The `code` key is a stable machine-readable string for programmatic handling.
 */
export function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: message, code }, { status })
}

/**
 * Standard JSON success response. Thin wrapper so routes have a consistent
 * call-site pattern and a place to add cross-cutting headers later.
 */
export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init)
}

export interface PaywallPack {
  id: string
  credits: number
  label: string
  price: string
}

/**
 * 402 paywall response. WizardContainer reads `body.paywall` and `body.packs`
 * verbatim to open the purchase modal — do not change this shape.
 */
export function apiPaywall(packs: PaywallPack[]): NextResponse {
  return NextResponse.json({ paywall: true, packs }, { status: 402 })
}
