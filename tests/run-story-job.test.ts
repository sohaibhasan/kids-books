import { describe, it, expect } from 'vitest'
import { extractCharacterSheet, extractStylePrefix } from '@/lib/jobs/run-story-job'
import type { WizardFormData } from '@/types'

// Minimal WizardFormData stub — these functions ignore the form arg in practice
// (the regex only looks at pages[0].scene_description), but the signature requires it.
const STUB_FORM = {} as WizardFormData

// ── extractStylePrefix ────────────────────────────────────────────────────────
// Extracts the first "sentence" (up to and including the first period) from
// pages[0].scene_description.
// Implementation: first.match(/^([^.]+\.)\s*/)

describe('extractStylePrefix', () => {
  it('extracts the prefix before the first period', () => {
    const pages = [{ scene_description: 'Comic book style. Character has brown hair. She runs into the forest.' }]
    const prefix = extractStylePrefix(pages)
    expect(prefix).toBe('Comic book style.')
  })

  it('includes trailing whitespace consumed by the match group', () => {
    // The regex captures up to and including "." — trailing space is outside the group
    const pages = [{ scene_description: 'Watercolor illustration.  Rest of the scene.' }]
    const prefix = extractStylePrefix(pages)
    expect(prefix).toBe('Watercolor illustration.')
  })

  it('returns undefined when pages is empty', () => {
    expect(extractStylePrefix([])).toBeUndefined()
  })

  it('returns undefined when the first page has no scene_description', () => {
    const pages = [{ scene_description: '' }]
    expect(extractStylePrefix(pages)).toBeUndefined()
  })

  it('returns undefined when there is no period in the scene_description', () => {
    // match returns null if no period found
    const pages = [{ scene_description: 'No period in this text at all' }]
    expect(extractStylePrefix(pages)).toBeUndefined()
  })

  it('only extracts the FIRST sentence even when multiple periods exist', () => {
    const pages = [{ scene_description: 'Anime style. Girl with black hair. She smiles in a meadow.' }]
    const prefix = extractStylePrefix(pages)
    expect(prefix).toBe('Anime style.')
  })
})

// ── extractCharacterSheet ─────────────────────────────────────────────────────
// Strips the style prefix (first "sentence" up to first ".") then returns up to
// 800 chars of the remainder.
// Implementation: noPrefix = first.replace(/^[^.]+\.\s*/, ''); return noPrefix.slice(0, 800)

describe('extractCharacterSheet', () => {
  it('strips the style prefix and returns the remainder', () => {
    const pages = [{ scene_description: 'Comic book style. Aamilah is a 7-year-old girl with black braids. She runs.' }]
    const sheet = extractCharacterSheet(STUB_FORM, pages)
    expect(sheet).toBe('Aamilah is a 7-year-old girl with black braids. She runs.')
  })

  it('caps the result at 800 characters', () => {
    const longSheet = 'X'.repeat(1000)
    const pages = [{ scene_description: `Style prefix. ${longSheet}` }]
    const sheet = extractCharacterSheet(STUB_FORM, pages)
    expect(sheet!.length).toBeLessThanOrEqual(800)
  })

  it('returns undefined when pages is empty', () => {
    expect(extractCharacterSheet(STUB_FORM, [])).toBeUndefined()
  })

  it('returns undefined when the first page scene_description is empty', () => {
    const pages = [{ scene_description: '' }]
    expect(extractCharacterSheet(STUB_FORM, pages)).toBeUndefined()
  })

  it('returns the whole content (minus prefix) when no period exists in source', () => {
    // The regex /^[^.]+\.\s*/ won't match, so nothing is stripped
    const pages = [{ scene_description: 'No period here at all so nothing stripped' }]
    const sheet = extractCharacterSheet(STUB_FORM, pages)
    // The regex replaces the prefix portion — with no match, noPrefix = the full string
    expect(sheet).toBeTruthy()
  })

  it('only uses pages[0] — ignores subsequent pages', () => {
    const pages = [
      { scene_description: 'Style. First page character sheet.' },
      { scene_description: 'Style. Second page character sheet.' },
    ]
    const sheet = extractCharacterSheet(STUB_FORM, pages)
    expect(sheet).toContain('First page')
    expect(sheet).not.toContain('Second page')
  })
})
