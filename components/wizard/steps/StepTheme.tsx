'use client'

import SelectCard from '@/components/ui/SelectCard'
import { WizardFormData } from '@/types'
import StepHeader from '../StepHeader'
import { LESSONS } from '@/lib/wizard-options'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

export default function StepTheme({ data, onChange }: Props) {
  const name = data.child_name || 'your child'
  return (
    <div>
      <StepHeader
        eyebrow="The lesson"
        title={`What will ${name} learn?`}
        description="One quiet idea at the heart of the story."
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LESSONS.map((l) => (
          <SelectCard
            key={l.value}
            icon={l.icon}
            label={l.label}
            tone="rose"
            size="sm"
            selected={data.lesson === l.value}
            onClick={() => onChange({ lesson: l.value, theme: l.value })}
          />
        ))}
      </div>
    </div>
  )
}
