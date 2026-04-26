'use client'

import SelectCard, { SelectCardTone } from '@/components/ui/SelectCard'
import { Genre, WizardFormData } from '@/types'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const GENRES: { value: Genre; icon: string; label: string; description: string; tone: SelectCardTone }[] = [
  { value: 'fantasy',    icon: '🐉', label: 'Fantasy',          description: 'Magic, creatures & quests',  tone: 'lavender' },
  { value: 'adventure',  icon: '🗺️', label: 'Adventure',        description: 'Exploration & treasure',     tone: 'apricot' },
  { value: 'sci-fi',     icon: '🚀', label: 'Sci-Fi',           description: 'Space, robots & future',     tone: 'sky' },
  { value: 'nature',     icon: '🌿', label: 'Nature & Animals', description: 'Wildlife & ecosystems',      tone: 'sage' },
  { value: 'fairy-tale', icon: '🏰', label: 'Fairy Tale',       description: 'Classic moral tales',        tone: 'rose' },
  { value: 'everyday',   icon: '🏠', label: 'Everyday Life',    description: 'Relatable moments',          tone: 'accent' },
  { value: 'mystery',    icon: '🔍', label: 'Mystery',          description: 'Clues & problem-solving',    tone: 'sky' },
  { value: 'humor',      icon: '😂', label: 'Humor',            description: 'Silly & absurd fun',         tone: 'apricot' },
]

export default function StepGenre({ data, onChange }: Props) {
  const name = data.child_name || 'your child'
  return (
    <div>
      <StepHeader
        eyebrow="Pick a genre"
        title={`What kind of story will ${name} go on?`}
        description="The genre shapes the world and the kinds of moments you'll meet inside it."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GENRES.map((g) => (
          <SelectCard
            key={g.value}
            icon={g.icon}
            label={g.label}
            description={g.description}
            tone={g.tone}
            selected={data.genre === g.value}
            onClick={() => onChange({ genre: g.value })}
          />
        ))}
      </div>
    </div>
  )
}
