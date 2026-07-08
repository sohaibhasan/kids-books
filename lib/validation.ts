/**
 * lib/validation.ts
 *
 * Shared validation schemas for BUG-2 (strict API boundary) and
 * HARD-1 (lenient DB read boundary).
 *
 * BUG-2 — WizardFormSchema:
 *   Strict input validation at POST /api/stories/start.  Enum fields are
 *   constrained to the exact union values from types/index.ts; free-text
 *   fields are optional+bounded; custom_* fields fold in the whitespace-
 *   collapse and cap logic that lived ad-hoc in the route.  Unknown keys
 *   are stripped (Zod object default).
 *
 * HARD-1 — parsePagesLenient / parseFormLenient:
 *   Lenient parsing for JSONB columns.  Legacy DB rows predate current code
 *   and must keep rendering.  Invalid page items are skipped with a warning
 *   instead of throwing; form objects are passed through without re-validation
 *   because they may carry extra fields (character_sheet, style_prefix) stashed
 *   by the job pipeline.
 */

import { z } from 'zod'
import type { WizardFormData } from '@/types'
import { isValidEmail } from '@/lib/utils'

// ── Enum schemas (union values mirror types/index.ts exactly) ─────────────────

export const ArtStyleSchema = z.enum([
  'comic-book',
  'classic-watercolor',
  'paper-collage',
  'whimsical-ink',
  'bold-modern',
  'soft-cozy',
  'anime-ghibli',
  'storybook-realism',
])

export const GenreSchema = z.enum([
  'fantasy',
  'adventure',
  'sci-fi',
  'nature',
  'fairy-tale',
  'everyday',
  'mystery',
  'humor',
])

export const WritingStyleSchema = z.enum([
  'rhyming-playful',
  'gentle-pastoral',
  'deadpan-quirky',
  'lyrical-imaginative',
  'mischievous-bold',
  'warm-contemplative',
  'vocab-stretching',
  'sensory-repetitive',
])

export const ToneSchema = z.enum([
  'silly',
  'heartfelt',
  'adventurous',
  'spooky-but-safe',
  'bittersweet',
  'hopeful',
])

export const DepthModifierSchema = z.enum([
  'plot-twist',
  'sensory-rich',
  'vocab-stretch',
  'character-arc',
])

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Optional free-text field with whitespace collapse + char cap.
 * Mirrors the clampText() helper that lived in app/api/stories/start/route.ts:
 *   - non-string input → undefined
 *   - empty result after collapse+trim → undefined
 * Used for custom_* fields so the route can drop its manual clampText calls.
 */
function optClamp(max: number) {
  return z.preprocess(
    (v): string | undefined => {
      if (typeof v !== 'string') return undefined
      const t = v.replace(/\s+/g, ' ').trim().slice(0, max)
      return t.length ? t : undefined
    },
    z.string().optional(),
  )
}

/**
 * Required-ish string: accepts an absent/undefined input (defaults to ''),
 * ensuring WizardFormData compatibility for fields that are `string` (not
 * `string | undefined`) but may be omitted by edge-case callers.
 * Bounded at max chars.
 */
function reqStr(max: number) {
  return z.string().max(max).default('')
}

/** Optional string, bounded at max chars, no whitespace transform. */
function optStr(max: number) {
  return z.string().max(max).optional()
}

// ── BUG-2: Wizard form schema ─────────────────────────────────────────────────

/**
 * Validates the JSON body that POST /api/stories/start receives from the
 * wizard.  On failure callers return { error: issues[0].message } 400.
 *
 * Design choices:
 *   - Enum fields (art_style, length, tone, writing_style, genre,
 *     depth_modifiers) are strict so unknown values are rejected — these flow
 *     directly into the provider router and Claude prompts.
 *   - child_name is trimmed+non-empty (max 100).
 *   - child_age is coerced to a number and range-checked (2–12).
 *   - Free-text appearance/story fields use reqStr() — they accept absent
 *     inputs (default '') so the wizard can omit optional appearance fields.
 *   - email is preprocessed (trim → empty→undefined) then regex-validated
 *     with the same pattern as the previous isValidEmail() guard.
 *   - custom_* fields fold in the whitespace-collapse + clamp transforms so
 *     the route's manual clampText() calls can be removed.
 *   - feature_opt_in and surprise_me are coerced booleans.
 *   - Unknown keys are stripped (Zod object default behaviour).
 */
export const WizardFormSchema = z.object({
  // ── Step 1: child identity ────────────────────────────────────────────────
  child_name: z.string().trim().min(1, 'child_name is required').max(100),
  child_age:  z.coerce.number().min(2, 'child_age must be between 2 and 12').max(12, 'child_age must be between 2 and 12'),

  // Not an enum in the type system — accept any string the wizard sends.
  child_pronouns: reqStr(100),

  // Appearance — all optional from the wizard's perspective (may be '').
  skin_tone:        reqStr(300),
  hair_color:       reqStr(300),
  hair_style:       reqStr(300),
  eye_color:        reqStr(300),
  outfit:           reqStr(300),
  child_appearance: reqStr(300),

  // ── Step 2: story setup ───────────────────────────────────────────────────
  genre:                 GenreSchema,
  theme:                 reqStr(300),
  lesson:                reqStr(300),
  setting:               reqStr(300),
  supporting_characters: reqStr(300),
  companion_name:        reqStr(300),

  // ── Step 3: style — strict enums; provider router + prompts depend on them ─
  art_style:      ArtStyleSchema,
  length:         z.enum(['short', 'medium', 'long']),
  writing_style:  WritingStyleSchema,
  tone:           ToneSchema,
  depth_modifiers: z.array(DepthModifierSchema).default([]),

  // ── Locale / extras ───────────────────────────────────────────────────────
  language:   reqStr(100),
  dedication: optStr(300),

  // ── Opt-ins ───────────────────────────────────────────────────────────────
  feature_opt_in: z.coerce.boolean().optional(),

  // email: trim first; treat empty string as absent; validate non-empty
  // values with isValidEmail() so client and server agree exactly.
  email: z.preprocess(
    (v): string | undefined => {
      if (typeof v !== 'string') return undefined
      const t = v.trim()
      return t.length ? t : undefined
    },
    z
      .string()
      .refine(
        isValidEmail,
        { message: 'invalid email' },
      )
      .optional(),
  ),

  // ── Step 7: user-injected story ideas ────────────────────────────────────
  // Caps mirror the maxLength attributes on the wizard's Textarea/Input and
  // the former clampText() calls in the route.
  custom_plot_points:    optClamp(600),
  custom_subjects:       optClamp(300),
  custom_world_details:  optClamp(300),
  custom_special_object: optClamp(120),
  surprise_me:           z.coerce.boolean().optional(),
})

// ── HARD-1: typed parsing at the DB read boundary ────────────────────────────

/**
 * Per-page DB shape.  Lenient on purpose:
 *   - text_content / scene_description default to '' so legacy rows that
 *     predate these fields still render (callers get a string, never undefined).
 *   - .passthrough() preserves unknown fields so callers that spread `...page`
 *     (e.g. read/[slug]/page.tsx) don't lose data.
 *   - type is optional (only cover/end pages set it).
 *   - page_number is the only field that must be a number — items missing it
 *     are skipped by parsePagesLenient.
 */
export const StoryPageSchema = z
  .object({
    page_number:       z.number(),
    text_content:      z.string().default(''),
    scene_description: z.string().default(''),
    type:              z.string().optional(),
  })
  .passthrough()

export type StoryPage = z.infer<typeof StoryPageSchema>

/**
 * Parse the `pages` JSONB column leniently.
 *
 * - JSON.parses strings (Supabase sometimes returns JSONB as a string).
 * - Validates each array item individually; skips items that fail with a
 *   console.warn rather than throwing — corrupt items in a legacy row must
 *   not block the whole story from rendering.
 * - Returns [] for non-array or fully-unparseable inputs; never throws.
 */
export function parsePagesLenient(raw: unknown): StoryPage[] {
  let data: unknown
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      console.warn('[parsePagesLenient] JSON.parse failed; returning []')
      return []
    }
  } else {
    data = raw
  }

  if (!Array.isArray(data)) return []

  const result: StoryPage[] = []
  for (const item of data) {
    const parsed = StoryPageSchema.safeParse(item)
    if (parsed.success) {
      result.push(parsed.data as StoryPage)
    } else {
      console.warn(
        '[parsePagesLenient] invalid page item skipped:',
        parsed.error.issues[0]?.message ?? 'unknown issue',
        item,
      )
    }
  }
  return result
}

/**
 * Parse the `form` JSONB column leniently.
 *
 * - JSON.parses strings.
 * - If the result is a non-null plain object, returns it as WizardFormData
 *   WITHOUT re-running WizardFormSchema — legacy rows may have extra fields
 *   (character_sheet, style_prefix) stashed by the job pipeline and must not
 *   be stripped.
 * - Throws a typed error only when the parsed value is not an object at all
 *   (null, array, or primitive) — these are corrupt rows; let the job's outer
 *   catch hand off to the cron sweeper.
 */
export function parseFormLenient(raw: unknown): WizardFormData {
  const data = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(
      `form JSONB is not an object (got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data})`,
    )
  }
  return data as WizardFormData
}
