/**
 * Classify a thrown image-generation error so the worker knows whether to
 * back off + retry, ask Claude to rewrite the prompt, or give up.
 *
 * We deliberately do NOT have a `switch_provider` outcome. The provider is
 * fixed for the life of a story by the user's art-style choice — swapping
 * mid-story would visibly break aesthetic consistency across pages. So if a
 * prompt can't be coaxed past the chosen provider after the rewrite budget
 * is exhausted, the whole story fails (refund + notify) rather than papering
 * over it with a different-looking page.
 */

export type ImageErrorCategory =
  | 'transient'        // 5xx, network, generic 429-with-Retry-After
  | 'prompt_filter'    // moderation / content / safety rejection
  | 'prompt_invalid'   // 400 too-long / malformed
  | 'no_output'        // 200 OK but no image returned
  | 'provider_down'    // 401/403, persistent quota exhausted, auth failure
  | 'unknown'

export interface ImageErrorClassification {
  category: ImageErrorCategory
  status?: number
  message: string
  retryable_same_prompt: boolean      // true for transient
  retryable_after_rewrite: boolean    // true for prompt_filter | prompt_invalid | no_output
  is_blocking: boolean                // true when productive retry is not possible (provider_down)
}

type Provider = 'openai' | 'recraft' | 'fal' | 'google'

const FILTER_PATTERNS = [
  /prompt_is_improper/i,
  /content[_ ]filter/i,
  /content[_ ]policy/i,
  /content_policy_violation/i,
  /safety[_ ]system/i,
  /moderation_blocked/i,
  /improper/i,
  /unsafe/i,
]

const NO_OUTPUT_PATTERNS = [
  /no image data/i,
  /no image url/i,
  /no image data in response/i,
  /no image url or base64 data/i,
]

const PROMPT_INVALID_PATTERNS = [
  /prompt too long/i,
  /string too long/i,
  /invalid prompt/i,
  /prompt is required/i,
  /must be at most/i,
]

export function classifyImageError(
  err: unknown,
  provider: Provider,
): ImageErrorClassification {
  const message = (err instanceof Error ? err.message : String(err)).slice(0, 600)
  const status = extractStatus(message, err)

  // Provider auth / quota — no retry will help, the operator needs to act.
  if (status === 401 || status === 403) {
    return shape('provider_down', status, message, { is_blocking: true })
  }
  // Google's free tier specifically — quota exhausted, no point in repeating.
  if (status === 429 && provider === 'google' && /RESOURCE_EXHAUSTED/i.test(message)) {
    return shape('provider_down', status, message, { is_blocking: true })
  }
  // fal.ai async FAILED — body usually carries the reason; treat as no_output
  // unless the message itself looks like a content filter rejection.
  if (/fal\.ai generation failed/i.test(message)) {
    if (FILTER_PATTERNS.some(re => re.test(message))) {
      return shape('prompt_filter', status, message, { retryable_after_rewrite: true })
    }
    return shape('no_output', status, message, { retryable_after_rewrite: true })
  }

  if (FILTER_PATTERNS.some(re => re.test(message))) {
    return shape('prompt_filter', status, message, { retryable_after_rewrite: true })
  }

  if (NO_OUTPUT_PATTERNS.some(re => re.test(message))) {
    return shape('no_output', status, message, { retryable_after_rewrite: true })
  }

  if (status === 400 && PROMPT_INVALID_PATTERNS.some(re => re.test(message))) {
    return shape('prompt_invalid', status, message, { retryable_after_rewrite: true })
  }
  if (status === 400) {
    // Generic 400 — treat as prompt issue and let Claude take another swing.
    return shape('prompt_invalid', status, message, { retryable_after_rewrite: true })
  }

  // Transient classes: network drops, 5xx, generic 429
  if (!status || status >= 500 || status === 429 || /ECONNRESET|ETIMEDOUT|ENETUNREACH|fetch failed/i.test(message)) {
    return shape('transient', status, message, { retryable_same_prompt: true })
  }

  return shape('unknown', status, message, {})
}

function shape(
  category: ImageErrorCategory,
  status: number | undefined,
  message: string,
  flags: Partial<Pick<ImageErrorClassification, 'retryable_same_prompt' | 'retryable_after_rewrite' | 'is_blocking'>>,
): ImageErrorClassification {
  return {
    category,
    status,
    message,
    retryable_same_prompt: !!flags.retryable_same_prompt,
    retryable_after_rewrite: !!flags.retryable_after_rewrite,
    is_blocking: !!flags.is_blocking,
  }
}

function extractStatus(message: string, err: unknown): number | undefined {
  const sdkStatus = (err as { status?: number; statusCode?: number } | null)?.status
    ?? (err as { status?: number; statusCode?: number } | null)?.statusCode
  if (typeof sdkStatus === 'number' && sdkStatus > 0) return sdkStatus
  const inline = message.match(/\((\d{3})\)/)?.[1]
  if (inline) return Number(inline)
  return undefined
}
