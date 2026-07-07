import { describe, it, expect } from 'vitest'
import { classifyImageError } from '@/lib/ai/classify-image-error'

// ── 401/403 auth failures → provider_down ────────────────────────────────────

describe('classifyImageError — auth failures', () => {
  it('classifies a 401 error as provider_down, blocking', () => {
    const err = Object.assign(new Error('Unauthorized'), { status: 401 })
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('provider_down')
    expect(c.is_blocking).toBe(true)
    expect(c.retryable_same_prompt).toBe(false)
    expect(c.retryable_after_rewrite).toBe(false)
  })

  it('classifies a 403 error as provider_down, blocking', () => {
    const err = Object.assign(new Error('Forbidden'), { status: 403 })
    const c = classifyImageError(err, 'recraft')
    expect(c.category).toBe('provider_down')
    expect(c.is_blocking).toBe(true)
  })
})

// ── 429 rate limits ───────────────────────────────────────────────────────────

describe('classifyImageError — 429 rate limits', () => {
  it('classifies a generic 429 as transient (retryable same prompt)', () => {
    const err = Object.assign(new Error('Too Many Requests'), { status: 429 })
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('transient')
    expect(c.retryable_same_prompt).toBe(true)
    expect(c.is_blocking).toBe(false)
  })

  it('classifies a Google 429 RESOURCE_EXHAUSTED as provider_down (quota gone)', () => {
    const err = Object.assign(
      new Error('Google image generation failed (429): RESOURCE_EXHAUSTED quota exceeded'),
      { status: 429 },
    )
    const c = classifyImageError(err, 'google')
    expect(c.category).toBe('provider_down')
    expect(c.is_blocking).toBe(true)
    expect(c.retryable_same_prompt).toBe(false)
  })

  it('does NOT treat a non-Google RESOURCE_EXHAUSTED 429 as provider_down', () => {
    const err = Object.assign(
      new Error('OpenAI failed (429): RESOURCE_EXHAUSTED rate limit'),
      { status: 429 },
    )
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('transient')
  })
})

// ── Content policy / moderation ───────────────────────────────────────────────

describe('classifyImageError — content policy', () => {
  it('classifies content_policy_violation as prompt_filter', () => {
    const err = new Error('Request rejected: content_policy_violation — unsafe content detected')
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('prompt_filter')
    expect(c.retryable_after_rewrite).toBe(true)
    expect(c.retryable_same_prompt).toBe(false)
    expect(c.is_blocking).toBe(false)
  })

  it('classifies a safety_system rejection as prompt_filter', () => {
    const err = new Error('Blocked by safety_system moderator')
    const c = classifyImageError(err, 'recraft')
    expect(c.category).toBe('prompt_filter')
    expect(c.retryable_after_rewrite).toBe(true)
  })

  it('classifies prompt_is_improper as prompt_filter', () => {
    const err = new Error('Error: prompt_is_improper — please revise your prompt')
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('prompt_filter')
  })
})

// ── No-output responses ───────────────────────────────────────────────────────

describe('classifyImageError — no output', () => {
  it('classifies "no image data" message as no_output', () => {
    const err = new Error('No image data in Google response')
    const c = classifyImageError(err, 'google')
    expect(c.category).toBe('no_output')
    expect(c.retryable_after_rewrite).toBe(true)
    expect(c.retryable_same_prompt).toBe(false)
  })

  it('classifies "No image URL or base64 data" as no_output', () => {
    const err = new Error('No image URL or base64 data in response')
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('no_output')
    expect(c.retryable_after_rewrite).toBe(true)
  })
})

// ── fal.ai async FAILED ───────────────────────────────────────────────────────

describe('classifyImageError — fal.ai generation failed', () => {
  it('classifies generic fal.ai FAILED as no_output', () => {
    const err = new Error('fal.ai generation failed: {"status":"FAILED","error":"unknown"}')
    const c = classifyImageError(err, 'fal')
    expect(c.category).toBe('no_output')
    expect(c.retryable_after_rewrite).toBe(true)
  })

  it('classifies fal.ai FAILED with unsafe content as prompt_filter', () => {
    const err = new Error('fal.ai generation failed: unsafe content moderation_blocked')
    const c = classifyImageError(err, 'fal')
    expect(c.category).toBe('prompt_filter')
    expect(c.retryable_after_rewrite).toBe(true)
  })
})

// ── 5xx server errors ─────────────────────────────────────────────────────────

describe('classifyImageError — 5xx transient', () => {
  it('classifies a 500 as transient', () => {
    const err = Object.assign(new Error('Internal Server Error'), { status: 500 })
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('transient')
    expect(c.retryable_same_prompt).toBe(true)
  })

  it('classifies a 503 as transient', () => {
    const err = Object.assign(new Error('Service Unavailable'), { status: 503 })
    const c = classifyImageError(err, 'recraft')
    expect(c.category).toBe('transient')
    expect(c.retryable_same_prompt).toBe(true)
    expect(c.is_blocking).toBe(false)
  })
})

// ── Network errors ────────────────────────────────────────────────────────────

describe('classifyImageError — network errors', () => {
  it('classifies ECONNRESET as transient', () => {
    const err = new Error('ECONNRESET connection reset by peer')
    const c = classifyImageError(err, 'fal')
    expect(c.category).toBe('transient')
    expect(c.retryable_same_prompt).toBe(true)
  })

  it('classifies fetch failed as transient', () => {
    const err = new Error('fetch failed: network unreachable')
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('transient')
    expect(c.retryable_same_prompt).toBe(true)
  })
})

// ── 400 prompt invalid ────────────────────────────────────────────────────────

describe('classifyImageError — prompt invalid (400)', () => {
  it('classifies 400 + prompt too long as prompt_invalid', () => {
    const err = Object.assign(new Error('prompt too long — string too long must be at most 4096 chars'), { status: 400 })
    const c = classifyImageError(err, 'recraft')
    expect(c.category).toBe('prompt_invalid')
    expect(c.retryable_after_rewrite).toBe(true)
  })

  it('classifies a generic 400 as prompt_invalid', () => {
    const err = Object.assign(new Error('Bad Request (400)'), { status: 400 })
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('prompt_invalid')
    expect(c.retryable_after_rewrite).toBe(true)
  })
})

// ── Unknown ───────────────────────────────────────────────────────────────────

describe('classifyImageError — unknown', () => {
  it('classifies a completely unrecognized error as unknown', () => {
    const err = Object.assign(new Error('Something bizarre happened'), { status: 418 })
    const c = classifyImageError(err, 'openai')
    expect(c.category).toBe('unknown')
    expect(c.is_blocking).toBe(false)
    expect(c.retryable_same_prompt).toBe(false)
    expect(c.retryable_after_rewrite).toBe(false)
  })

  it('includes the original message in the classification', () => {
    const err = new Error('Something completely unexpected')
    const c = classifyImageError(err, 'fal')
    expect(c.message).toContain('Something completely unexpected')
  })
})
