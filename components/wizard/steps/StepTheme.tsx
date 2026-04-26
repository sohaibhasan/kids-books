'use client'

import SelectCard from '@/components/ui/SelectCard'
import { WizardFormData } from '@/types'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const LESSONS: { value: string; icon: string; label: string }[] = [
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
