'use client'

import SelectCard from '@/components/ui/SelectCard'
import { Genre, WizardFormData } from '@/types'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const GENRES: { value: Genre; icon: string; label: string; description: string }[] = [
  { value: 'fantasy',    icon: '🐉', label: 'Fantasy',         description: 'Magic, creatures & quests' },
  { value: 'adventure',  icon: '🗺️', label: 'Adventure',       description: 'Exploration & treasure' },
  { value: 'sci-fi',     icon: '🚀', label: 'Sci-Fi',          description: 'Space, robots & future' },
  { value: 'nature',     icon: '🌿', label: 'Nature & Animals', description: 'Wildlife & ecosystems' },
  { value: 'fairy-tale', icon: '🏰', label: 'Fairy Tale',       description: 'Classic moral tales' },
  { value: 'everyday',   icon: '🏠', label: 'Everyday Life',    description: 'Relatable moments' },
  { value: 'mystery',    icon: '🔍', label: 'Mystery',          description: 'Clues & problem-solving' },
  { value: 'humor',      icon: '😂', label: 'Humor',            description: 'Silly & absurd fun' },
]

export default function StepGenre({ data, onChange }: Props) {
  const name = data.child_name || 'your child'
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink mb-1">Pick a genre</h2>
        <p className="text-ink/60">What kind of story will {name} go on?</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GENRES.map(g => (
          <SelectCard
            key={g.value}
            icon={g.icon}
            label={g.label}
            description={g.description}
            selected={data.genre === g.value}
            onClick={() => onChange({ genre: g.value })}
          />
        ))}
      </div>
    </div>
  )
}
