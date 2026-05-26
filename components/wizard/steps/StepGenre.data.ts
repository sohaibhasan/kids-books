// Server-safe data module — keep separate from StepGenre.tsx (a 'use client'
// component) so server consumers like lib/featured-stories.ts can import
// the option list without it being replaced by a client-reference proxy.
import type { Genre } from '@/types'
import type { SelectCardTone } from '@/components/ui/SelectCard'

export const GENRES: { value: Genre; icon: string; label: string; description: string; tone: SelectCardTone }[] = [
  { value: 'fantasy',    icon: '🐉', label: 'Fantasy',          description: 'Magic, creatures & quests',  tone: 'lavender' },
  { value: 'adventure',  icon: '🗺️', label: 'Adventure',        description: 'Exploration & treasure',     tone: 'apricot' },
  { value: 'sci-fi',     icon: '🚀', label: 'Sci-Fi',           description: 'Space, robots & future',     tone: 'sky' },
  { value: 'nature',     icon: '🌿', label: 'Nature & Animals', description: 'Wildlife & ecosystems',      tone: 'sage' },
  { value: 'fairy-tale', icon: '🏰', label: 'Fairy Tale',       description: 'Classic moral tales',        tone: 'rose' },
  { value: 'everyday',   icon: '🏠', label: 'Everyday Life',    description: 'Relatable moments',          tone: 'accent' },
  { value: 'mystery',    icon: '🔍', label: 'Mystery',          description: 'Clues & problem-solving',    tone: 'sky' },
  { value: 'humor',      icon: '😂', label: 'Humor',            description: 'Silly & absurd fun',         tone: 'apricot' },
]
