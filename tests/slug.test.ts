import { describe, it, expect } from 'vitest'
import { makeSlug } from '@/lib/utils/slug'

// Tests pin the CURRENT behavior of makeSlug by reading the implementation:
//
//   base = name.toLowerCase().trim()
//              .replace(/[^a-z0-9\s]/g, '')   // strip non-alphanumeric-non-space
//              .replace(/\s+/g, '-')           // spaces → hyphens
//              .slice(0, 30)                   // cap base at 30 chars
//   suffix = Math.random().toString(36).slice(2, 7)   // 5-char base36 random
//   return `${base}-${suffix}`

describe('makeSlug', () => {
  it('lowercases the input', () => {
    const slug = makeSlug('Aamilah')
    // suffix is after the last '-', base is 'aamilah'
    expect(slug.startsWith('aamilah-')).toBe(true)
  })

  it('trims surrounding whitespace before processing', () => {
    const slug = makeSlug('  Minha  ')
    expect(slug.startsWith('minha-')).toBe(true)
  })

  it('replaces spaces with hyphens', () => {
    const slug = makeSlug('Hello World')
    expect(slug.startsWith('hello-world-')).toBe(true)
  })

  it('collapses multiple spaces into a single hyphen', () => {
    const slug = makeSlug('Big   Blue   Dragon')
    expect(slug.startsWith('big-blue-dragon-')).toBe(true)
  })

  it('strips punctuation characters', () => {
    // Punctuation like ! and , and . are stripped (not in [a-z0-9\s])
    const slug = makeSlug("Hello, World!")
    expect(slug.startsWith('hello-world-')).toBe(true)
  })

  it('strips diacritic characters (they are not in [a-z0-9\\s])', () => {
    // 'é' is not a-z after toLowerCase, so it is stripped
    const slug = makeSlug('Café')
    expect(slug.startsWith('caf-')).toBe(true)
  })

  it('strips apostrophes and quotes', () => {
    const slug = makeSlug("Dragon's Treasure")
    // apostrophe stripped → "dragons treasure" → "dragons-treasure"
    expect(slug.startsWith('dragons-treasure-')).toBe(true)
  })

  it('caps the base at 30 characters', () => {
    const long = 'a'.repeat(50)
    const slug = makeSlug(long)
    // base is 'a'.repeat(30), then '-', then suffix
    expect(slug.startsWith('a'.repeat(30) + '-')).toBe(true)
  })

  it('appends a hyphen-separated random suffix', () => {
    const slug = makeSlug('test')
    // Format: "test-<suffix>" where suffix is non-empty
    const parts = slug.split('-')
    // last element is the suffix
    expect(parts.length).toBeGreaterThanOrEqual(2)
    const suffix = parts[parts.length - 1]
    expect(suffix.length).toBeGreaterThan(0)
  })

  it('generates different slugs for repeated calls (unique suffix)', () => {
    const slug1 = makeSlug('same name')
    const slug2 = makeSlug('same name')
    // Extremely unlikely to collide (1/36^5 chance)
    expect(slug1).not.toBe(slug2)
  })

  it('returns only lowercase alphanumeric chars and hyphens', () => {
    const slug = makeSlug('Hello, World! 123')
    expect(slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('handles a name that is entirely punctuation', () => {
    const slug = makeSlug('!!!---...')
    // All stripped → base is '' → result is just '-<suffix>'
    expect(slug).toMatch(/^-[a-z0-9]+$/)
  })
})
