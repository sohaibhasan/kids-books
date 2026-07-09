/**
 * lib/wizard-options.ts
 *
 * Single source of truth for all wizard option arrays and their item types.
 * Step components and StoryPreview import from here; lib/featured-stories.ts
 * also imports from here (plain module, no 'use client' directive needed).
 */

import type { ArtStyle, Genre, WizardFormData } from '@/types'

// ---------------------------------------------------------------------------
// SelectCard Tone — used by StepGenre and SelectCard
// ---------------------------------------------------------------------------

export type SelectCardTone =
  | 'brand'
  | 'rose'
  | 'sage'
  | 'apricot'
  | 'sky'
  | 'lavender'
  | 'accent'

export const toneSelected: Record<SelectCardTone, string> = {
  brand:    'bg-brand-tint border-brand',
  rose:     'bg-[var(--story-rose)]/40 border-[var(--story-rose)]',
  sage:     'bg-[var(--story-sage)]/40 border-[var(--story-sage)]',
  apricot:  'bg-[var(--story-apricot)]/40 border-[var(--story-apricot)]',
  sky:      'bg-[var(--story-sky)]/40 border-[var(--story-sky)]',
  lavender: 'bg-[var(--story-lavender)]/40 border-[var(--story-lavender)]',
  accent:   'bg-accent-tint border-accent',
}

export const toneCheck: Record<SelectCardTone, string> = {
  brand:    'bg-brand text-white',
  rose:     'bg-ink text-white',
  sage:     'bg-ink text-white',
  apricot:  'bg-ink text-white',
  sky:      'bg-ink text-white',
  lavender: 'bg-ink text-white',
  accent:   'bg-ink text-white',
}

// ---------------------------------------------------------------------------
// Appearance — StepChild
// ---------------------------------------------------------------------------

export interface SkinToneOption {
  value: string
  label: string
  color: string
}

export const SKIN_TONES: SkinToneOption[] = [
  { value: 'light',      label: 'Light',      color: '#FDDCB5' },
  { value: 'fair',       label: 'Fair',       color: '#F5C5A3' },
  { value: 'medium',     label: 'Medium',     color: '#D4A373' },
  { value: 'tan',        label: 'Tan',        color: '#C68C53' },
  { value: 'brown',      label: 'Brown',      color: '#8D5524' },
  { value: 'dark brown', label: 'Dark Brown', color: '#5C3310' },
]

export const HAIR_COLORS: string[] = [
  'Black',
  'Dark Brown',
  'Brown',
  'Light Brown',
  'Blonde',
  'Red',
  'Auburn',
  'Strawberry Blonde',
]

export const HAIR_STYLES: string[] = [
  'Straight and short',
  'Straight and long',
  'Wavy and short',
  'Wavy and long',
  'Curly and short',
  'Curly and long',
  'Coily / afro',
  'Braids',
  'Ponytail',
  'Two puffs',
  'Pigtails',
  'Bun',
  'Buzz cut',
]

export interface EyeColorOption {
  value: string
  label: string
  color: string
}

export const EYE_COLORS: EyeColorOption[] = [
  { value: 'brown',      label: 'Brown',      color: '#5C3310' },
  { value: 'dark brown', label: 'Dark Brown', color: '#2B1A0C' },
  { value: 'hazel',      label: 'Hazel',      color: '#A47148' },
  { value: 'green',      label: 'Green',      color: '#3E7B4E' },
  { value: 'blue',       label: 'Blue',       color: '#3C7AB8' },
  { value: 'gray',       label: 'Gray',       color: '#8E9CA8' },
]

export interface OutfitOption {
  value: string
  label: string
  icon: string
}

export const OUTFITS: OutfitOption[] = [
  { value: 'a bright red hoodie with a yellow star on the chest, blue jeans, and white sneakers',               label: 'Red Hoodie',    icon: '🔴' },
  { value: 'a purple t-shirt with a rainbow on it, green shorts, and yellow rain boots',                        label: 'Rainbow Tee',   icon: '🌈' },
  { value: 'a blue denim jacket over a striped white-and-navy shirt, khaki pants, and brown boots',             label: 'Denim Jacket',  icon: '🧥' },
  { value: 'a pink princess dress with sparkly silver stars, a small tiara, and silver slippers',               label: 'Princess Dress', icon: '👗' },
  { value: 'a green dinosaur onesie with a hood that has little spikes, and orange sneakers',                   label: 'Dino Onesie',   icon: '🦖' },
  { value: 'a yellow superhero cape over a blue t-shirt, red shorts, and black boots',                          label: 'Superhero Cape', icon: '🦸' },
  { value: 'a cozy orange sweater with a pumpkin on it, dark blue leggings, and brown ankle boots',             label: 'Cozy Sweater',  icon: '🎃' },
  { value: 'a white lab coat over a light blue shirt, gray pants, and big round goggles on their head',         label: 'Scientist',     icon: '🔬' },
  { value: 'a puffy navy winter coat with a fuzzy hood, a red knit scarf, gray snow pants, and warm brown boots', label: 'Winter Coat', icon: '🧣' },
  { value: 'a bright yellow tank top with a sun print, turquoise swim shorts, and blue flip-flops',             label: 'Summer Fun',    icon: '🏖️' },
  { value: 'a shiny yellow rain jacket with big buttons, dark green rain pants, and red rubber rain boots',     label: 'Rainy Day',     icon: '🌧️' },
  { value: 'a red-and-black plaid flannel shirt, olive cargo pants, and tan hiking boots with thick soles',    label: 'Fall Flannel',  icon: '🍂' },
]

// ---------------------------------------------------------------------------
// Genre — StepGenre
// ---------------------------------------------------------------------------

export interface GenreOption {
  value: Genre
  icon: string
  label: string
  description: string
  tone: SelectCardTone
}

export const GENRES: GenreOption[] = [
  { value: 'fantasy',    icon: '🐉', label: 'Fantasy',          description: 'Magic, creatures & quests',  tone: 'lavender' },
  { value: 'adventure',  icon: '🗺️', label: 'Adventure',        description: 'Exploration & treasure',     tone: 'apricot' },
  { value: 'sci-fi',     icon: '🚀', label: 'Sci-Fi',           description: 'Space, robots & future',     tone: 'sky' },
  { value: 'nature',     icon: '🌿', label: 'Nature & Animals', description: 'Wildlife & ecosystems',      tone: 'sage' },
  { value: 'fairy-tale', icon: '🏰', label: 'Fairy Tale',       description: 'Classic moral tales',        tone: 'rose' },
  { value: 'everyday',   icon: '🏠', label: 'Everyday Life',    description: 'Relatable moments',          tone: 'accent' },
  { value: 'mystery',    icon: '🔍', label: 'Mystery',          description: 'Clues & problem-solving',    tone: 'sky' },
  { value: 'humor',      icon: '😂', label: 'Humor',            description: 'Silly & absurd fun',         tone: 'apricot' },
]

// ---------------------------------------------------------------------------
// Lessons / Theme — StepTheme
// ---------------------------------------------------------------------------

export interface LessonOption {
  value: string
  icon: string
  label: string
}

export const LESSONS: LessonOption[] = [
  { value: 'Kindness',           icon: '❤️',  label: 'Kindness' },
  { value: 'Bravery',            icon: '🦁',  label: 'Bravery' },
  { value: 'Honesty',            icon: '💎',  label: 'Honesty' },
  { value: 'Sharing',            icon: '🤝',  label: 'Sharing' },
  { value: 'Managing Emotions',  icon: '🌈',  label: 'Emotions' },
  { value: 'Trying New Things',  icon: '🌱',  label: 'Try New Things' },
  { value: 'Inclusivity',        icon: '🌍',  label: 'Inclusivity' },
  { value: 'Environmental Care', icon: '🌳',  label: 'Nature Care' },
  { value: 'Resilience',         icon: '💪',  label: 'Resilience' },
  { value: 'Friendship',         icon: '👫',  label: 'Friendship' },
  { value: 'Gratitude',          icon: '🙏',  label: 'Gratitude' },
  { value: 'Generosity',         icon: '🎁',  label: 'Generosity' },
]

// ---------------------------------------------------------------------------
// Settings & Companions — StepSetting
// ---------------------------------------------------------------------------

export interface SettingOption {
  value: string
  icon: string
  label: string
}

export const SETTINGS: SettingOption[] = [
  { value: 'Enchanted Forest',   icon: '🌲', label: 'Enchanted Forest' },
  { value: 'Outer Space',        icon: '🌌', label: 'Outer Space' },
  { value: 'Underwater Kingdom', icon: '🐠', label: 'Underwater' },
  { value: 'Neighborhood',       icon: '🏘️', label: 'Neighborhood' },
  { value: 'School',             icon: '📚', label: 'School' },
  { value: 'Farm',               icon: '🐄', label: 'Farm' },
  { value: 'Jungle',             icon: '🌴', label: 'Jungle' },
  { value: 'Snowy Mountains',    icon: '⛰️', label: 'Snowy Mountains' },
]

export interface CompanionOption {
  value: string
  icon: string
  label: string
}

export const COMPANIONS: CompanionOption[] = [
  { value: 'Best Friend',      icon: '👫', label: 'Best Friend' },
  { value: 'Sibling',          icon: '👧', label: 'Sibling' },
  { value: 'Pet',              icon: '🐕', label: 'Pet' },
  { value: 'Magical Creature', icon: '✨', label: 'Magical Creature' },
  { value: 'Talking Animal',   icon: '🦊', label: 'Talking Animal' },
  { value: 'Wise Elder',       icon: '👴', label: 'Wise Elder' },
]

// ---------------------------------------------------------------------------
// Art styles & Length — StepStyle
// ---------------------------------------------------------------------------

export interface ArtStyleOption {
  value: ArtStyle
  icon: string
  label: string
  description: string
}

export const ART_STYLES: ArtStyleOption[] = [
  { value: 'comic-book',         icon: '💥', label: 'Comic Book',         description: 'Bold outlines, flat colors, action energy' },
  { value: 'classic-watercolor', icon: '🎨', label: 'Classic Watercolor', description: 'Soft washes, delicate ink, warm tones' },
  { value: 'paper-collage',      icon: '✂️', label: 'Paper Collage',      description: 'Layered textures, bold cut-out shapes' },
  { value: 'whimsical-ink',      icon: '🖋️', label: 'Whimsical Ink',     description: 'Loose pen-and-ink, sketchy, expressive' },
  { value: 'bold-modern',        icon: '✨', label: 'Bold & Modern',      description: 'Flat colors, clean shapes, poster-like' },
  { value: 'soft-cozy',          icon: '🌙', label: 'Soft & Cozy',        description: 'Warm muted tones, gentle, calming' },
  { value: 'anime-ghibli',       icon: '🌸', label: 'Anime / Ghibli',     description: 'Soft anime, lush backgrounds, pastel' },
  { value: 'storybook-realism',  icon: '🎭', label: 'Storybook Realism',  description: 'Painterly detail, dramatic lighting' },
]

export interface LengthOption {
  value: WizardFormData['length']
  icon: string
  label: string
  pages: string
}

export const LENGTHS: LengthOption[] = [
  { value: 'short',  icon: '📄', label: 'Short',  pages: '10 pages' },
  { value: 'medium', icon: '📖', label: 'Medium', pages: '15 pages' },
  { value: 'long',   icon: '📚', label: 'Long',   pages: '20 pages' },
]
