/**
 * Unit tests for the pure shouldProcessEvent guard in the Stripe webhook route.
 *
 * These tests import only the exported pure function — no Stripe mocking needed,
 * no I/O, no network. The vi.mock calls below exist solely to prevent Next.js
 * internals (next/headers, next/server) from throwing when the route module is
 * imported in the Vitest node environment.
 */
import { vi, describe, it, expect } from 'vitest'

// next/headers uses Next.js AsyncLocalStorage context that only exists during
// an actual request. Mock it so the route module loads cleanly in Vitest.
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

import { shouldProcessEvent } from '@/app/api/stripe/webhook/route'

describe('shouldProcessEvent', () => {
  it('live event in production → process', () => {
    const result = shouldProcessEvent({
      livemode: true,
      vercelEnv: 'production',
      allowTestWebhooks: false,
    })
    expect(result.process).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('test-mode event in production without override → blocked', () => {
    const result = shouldProcessEvent({
      livemode: false,
      vercelEnv: 'production',
      allowTestWebhooks: false,
    })
    expect(result.process).toBe(false)
    expect(typeof result.reason).toBe('string')
    expect(result.reason!.length).toBeGreaterThan(0)
  })

  it('test-mode event in production with ALLOW_TEST_WEBHOOKS=1 → process', () => {
    const result = shouldProcessEvent({
      livemode: false,
      vercelEnv: 'production',
      allowTestWebhooks: true,
    })
    expect(result.process).toBe(true)
  })

  it('test-mode event in preview environment → process', () => {
    const result = shouldProcessEvent({
      livemode: false,
      vercelEnv: 'preview',
      allowTestWebhooks: false,
    })
    expect(result.process).toBe(true)
  })

  it('live event in preview environment → process', () => {
    const result = shouldProcessEvent({
      livemode: true,
      vercelEnv: 'preview',
      allowTestWebhooks: false,
    })
    expect(result.process).toBe(true)
  })
})
