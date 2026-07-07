import { describe, it, expect } from 'vitest'
import { PACKS } from '@/lib/credits'

// Tests for the pure shape of PACKS — no Supabase calls needed.
// The DB-touching functions (getEntitlement, consumeOne, grant, etc.) are
// integration-only and are NOT tested here.

describe('PACKS shape invariants', () => {
  it('has the expected pack keys: solo, small, large', () => {
    expect(Object.keys(PACKS).sort()).toEqual(['large', 'small', 'solo'])
  })

  it('every pack has a credits value greater than zero', () => {
    for (const [key, pack] of Object.entries(PACKS)) {
      expect(pack.credits, `${key}.credits should be > 0`).toBeGreaterThan(0)
    }
  })

  it('every pack has a non-empty price string', () => {
    for (const [key, pack] of Object.entries(PACKS)) {
      expect(pack.price, `${key}.price should be a non-empty string`).toBeTruthy()
      expect(typeof pack.price).toBe('string')
    }
  })

  it('every pack has a non-empty label', () => {
    for (const [key, pack] of Object.entries(PACKS)) {
      expect(pack.label, `${key}.label should be a non-empty string`).toBeTruthy()
      expect(typeof pack.label).toBe('string')
    }
  })

  it('every pack has a non-empty priceEnv string', () => {
    for (const [key, pack] of Object.entries(PACKS)) {
      expect(pack.priceEnv, `${key}.priceEnv should be a non-empty string`).toBeTruthy()
      expect(typeof pack.priceEnv).toBe('string')
    }
  })

  it('solo pack has exactly 1 credit', () => {
    expect(PACKS.solo.credits).toBe(1)
  })

  it('small pack has more credits than solo', () => {
    expect(PACKS.small.credits).toBeGreaterThan(PACKS.solo.credits)
  })

  it('large pack has more credits than small', () => {
    expect(PACKS.large.credits).toBeGreaterThan(PACKS.small.credits)
  })

  it('price strings start with a dollar sign', () => {
    for (const [key, pack] of Object.entries(PACKS)) {
      expect(pack.price, `${key}.price should start with $`).toMatch(/^\$/)
    }
  })

  it('priceEnv values follow the STRIPE_PRICE_PACK_* naming convention', () => {
    for (const [key, pack] of Object.entries(PACKS)) {
      expect(pack.priceEnv, `${key}.priceEnv should start with STRIPE_PRICE_PACK_`).toMatch(
        /^STRIPE_PRICE_PACK_/,
      )
    }
  })
})
