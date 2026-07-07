import { describe, it, expect } from 'vitest'
import { WizardFormSchema, parsePagesLenient, parseFormLenient } from '@/lib/validation'

// A complete, realistic wizard payload that must pass.
const VALID_BASE = {
  child_name: 'Aamilah',
  child_age: 7,
  child_pronouns: 'she/her',
  skin_tone: 'medium brown',
  hair_color: 'black',
  hair_style: 'long braids',
  eye_color: 'dark brown',
  outfit: 'Red Hoodie',
  child_appearance: 'has freckles',
  genre: 'fantasy',
  theme: 'courage',
  lesson: 'be brave',
  setting: 'enchanted forest',
  supporting_characters: 'a talking fox',
  companion_name: 'Rusty',
  art_style: 'classic-watercolor',
  length: 'medium',
  writing_style: 'lyrical-imaginative',
  tone: 'adventurous',
  depth_modifiers: ['character-arc'],
  language: 'English',
}

// ── WizardFormSchema ─────────────────────────────────────────────────────────

describe('WizardFormSchema', () => {
  it('accepts a complete realistic wizard payload', () => {
    const result = WizardFormSchema.safeParse(VALID_BASE)
    expect(result.success).toBe(true)
  })

  it('trims leading/trailing whitespace from child_name', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, child_name: '  Aamilah  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.child_name).toBe('Aamilah')
    }
  })

  it('rejects a blank child_name', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, child_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown art_style', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, art_style: 'sketchy-doodle' })
    expect(result.success).toBe(false)
  })

  it('rejects child_age 1 (below minimum of 2)', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, child_age: 1 })
    expect(result.success).toBe(false)
  })

  it('rejects child_age 13 (above maximum of 12)', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, child_age: 13 })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed email', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid email', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, email: 'parent@example.com' })
    expect(result.success).toBe(true)
  })

  it('treats empty string email as absent (undefined)', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, email: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBeUndefined()
    }
  })

  it('clamps custom_plot_points to 600 chars', () => {
    const long = 'a'.repeat(700)
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, custom_plot_points: long })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.custom_plot_points!.length).toBe(600)
    }
  })

  it('whitespace-collapses custom_plot_points', () => {
    const result = WizardFormSchema.safeParse({
      ...VALID_BASE,
      custom_plot_points: '  dragon   finds   treasure  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.custom_plot_points).toBe('dragon finds treasure')
    }
  })

  it('strips unknown keys from the output', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, unknown_field: 'sneaky' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('unknown_field' in result.data).toBe(false)
    }
  })

  it('accepts payload with all optional fields absent', () => {
    // email, dedication, custom_*, feature_opt_in, surprise_me all absent
    const result = WizardFormSchema.safeParse(VALID_BASE)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBeUndefined()
      expect(result.data.dedication).toBeUndefined()
      expect(result.data.custom_plot_points).toBeUndefined()
    }
  })

  it('rejects an unknown genre', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, genre: 'romance' })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown depth_modifier in the array', () => {
    const result = WizardFormSchema.safeParse({ ...VALID_BASE, depth_modifiers: ['bad-modifier'] })
    expect(result.success).toBe(false)
  })

  it('defaults depth_modifiers to [] when absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { depth_modifiers: _dropped, ...rest } = VALID_BASE as typeof VALID_BASE & { depth_modifiers?: unknown }
    const result = WizardFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.depth_modifiers).toEqual([])
    }
  })
})

// ── parsePagesLenient ────────────────────────────────────────────────────────

describe('parsePagesLenient', () => {
  it('passes through a valid array of pages', () => {
    const input = [
      { page_number: 1, text_content: 'Once upon a time', scene_description: 'A forest.', type: 'cover' },
      { page_number: 2, text_content: 'The end.', scene_description: 'A sunset.', type: 'end' },
    ]
    const result = parsePagesLenient(input)
    expect(result).toHaveLength(2)
    expect(result[0].page_number).toBe(1)
    expect(result[1].text_content).toBe('The end.')
  })

  it('parses a JSON-string input into an array', () => {
    const input = JSON.stringify([{ page_number: 1, text_content: 'Hi', scene_description: 'Scene' }])
    const result = parsePagesLenient(input)
    expect(result).toHaveLength(1)
    expect(result[0].page_number).toBe(1)
  })

  it('skips invalid items instead of throwing', () => {
    const input = [
      { page_number: 1, text_content: 'Good page', scene_description: 'Scene' },
      { not_a_page: true }, // missing page_number → skipped
    ]
    // Should not throw; just returns the valid one
    const result = parsePagesLenient(input)
    expect(result).toHaveLength(1)
    expect(result[0].page_number).toBe(1)
  })

  it('returns [] for a non-array input', () => {
    expect(parsePagesLenient(null)).toEqual([])
    expect(parsePagesLenient(undefined)).toEqual([])
    expect(parsePagesLenient(42)).toEqual([])
    expect(parsePagesLenient({ page_number: 1 })).toEqual([])
  })

  it('returns [] for an invalid JSON string', () => {
    expect(parsePagesLenient('not json {')).toEqual([])
  })

  it('preserves extra (passthrough) fields on valid pages', () => {
    const input = [{ page_number: 1, text_content: 'Hi', scene_description: 'S', extra_field: 'preserved' }]
    const result = parsePagesLenient(input)
    expect((result[0] as Record<string, unknown>).extra_field).toBe('preserved')
  })
})

// ── parseFormLenient ─────────────────────────────────────────────────────────

describe('parseFormLenient', () => {
  it('passes through a plain object unchanged', () => {
    const input = { child_name: 'Minha', child_age: 5 }
    const result = parseFormLenient(input)
    expect(result).toEqual(input)
  })

  it('preserves extra keys like character_sheet (passthrough)', () => {
    const input = { child_name: 'Minha', character_sheet: 'She has black hair.', style_prefix: 'Watercolor.' }
    const result = parseFormLenient(input)
    expect((result as Record<string, unknown>).character_sheet).toBe('She has black hair.')
    expect((result as Record<string, unknown>).style_prefix).toBe('Watercolor.')
  })

  it('parses a JSON string to a form object', () => {
    const input = JSON.stringify({ child_name: 'Sora', child_age: 8 })
    const result = parseFormLenient(input)
    expect((result as Record<string, unknown>).child_name).toBe('Sora')
  })

  it('throws on null input', () => {
    expect(() => parseFormLenient(null)).toThrow()
  })

  it('throws on a plain number', () => {
    expect(() => parseFormLenient(42)).toThrow()
  })

  it('throws on an array', () => {
    expect(() => parseFormLenient([{ child_name: 'bad' }])).toThrow()
  })
})
