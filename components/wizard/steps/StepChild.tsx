'use client'

import Input from '@/components/ui/Input'
import SelectCard from '@/components/ui/SelectCard'
import { WizardFormData } from '@/types'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const PRONOUNS = [
  { label: 'She / Her', icon: '👧' },
  { label: 'He / Him', icon: '👦' },
  { label: 'They / Them', icon: '🧒' },
]

export default function StepChild({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink mb-1">Who is this story for?</h2>
        <p className="text-ink/60">Tell us about the star of the story.</p>
      </div>

      <Input
        label="Child's name"
        value={data.child_name}
        onChange={v => onChange({ child_name: v })}
        placeholder="e.g. Aamilah"
      />

      <Input
        label="Age"
        value={data.child_age}
        onChange={v => onChange({ child_age: parseInt(v) || 5 })}
        type="number"
        min={2}
        max={12}
        hint="Ages 2–12"
      />

      <div className="flex flex-col gap-2">
        <label className="text-base font-semibold text-ink">Pronouns</label>
        <div className="grid grid-cols-3 gap-3">
          {PRONOUNS.map(p => (
            <SelectCard
              key={p.label}
              icon={p.icon}
              label={p.label}
              selected={data.child_pronouns === p.label}
              onClick={() => onChange({ child_pronouns: p.label })}
              size="sm"
            />
          ))}
        </div>
      </div>

      <Input
        label="What do they look like? (optional)"
        value={data.child_appearance}
        onChange={v => onChange({ child_appearance: v })}
        placeholder="e.g. curly red hair, freckles, always wears a hat"
        hint="This helps us describe the character consistently across illustrations."
      />
    </div>
  )
}
