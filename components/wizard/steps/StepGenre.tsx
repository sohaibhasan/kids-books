'use client'

import SelectCard from '@/components/ui/SelectCard'
import { WizardFormData } from '@/types'
import StepHeader from '../StepHeader'
import { GENRES } from './StepGenre.data'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

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
