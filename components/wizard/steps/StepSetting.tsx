'use client'

import SelectCard from '@/components/ui/SelectCard'
import { WizardFormData } from '@/types'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const SETTINGS = [
  { value: 'Enchanted Forest',   icon: '🌲', label: 'Enchanted Forest' },
  { value: 'Outer Space',        icon: '🌌', label: 'Outer Space' },
  { value: 'Underwater Kingdom', icon: '🐠', label: 'Underwater' },
  { value: 'Neighborhood',       icon: '🏘️', label: 'Neighborhood' },
  { value: 'School',             icon: '📚', label: 'School' },
  { value: 'Farm',               icon: '🐄', label: 'Farm' },
  { value: 'Jungle',             icon: '🌴', label: 'Jungle' },
  { value: 'Snowy Mountains',    icon: '⛰️', label: 'Snowy Mountains' },
]

const COMPANIONS = [
  { value: 'Best Friend',      icon: '👫', label: 'Best Friend' },
  { value: 'Sibling',          icon: '👧', label: 'Sibling' },
  { value: 'Pet',              icon: '🐕', label: 'Pet' },
  { value: 'Magical Creature', icon: '✨', label: 'Magical Creature' },
  { value: 'Talking Animal',   icon: '🦊', label: 'Talking Animal' },
  { value: 'Wise Elder',       icon: '👴', label: 'Wise Elder' },
]

export default function StepSetting({ data, onChange }: Props) {
  const companions: string[] = data.supporting_characters
    ? data.supporting_characters.split(',').filter(Boolean)
    : []

  const toggleCompanion = (value: string) => {
    const updated = companions.includes(value)
      ? companions.filter(c => c !== value)
      : [...companions, value]
    onChange({ supporting_characters: updated.join(',') })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-ink mb-1">Build the world</h2>
        <p className="text-ink/60">Where does the story take place, and who comes along?</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">Setting</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SETTINGS.map(s => (
            <SelectCard
              key={s.value}
              icon={s.icon}
              label={s.label}
              selected={data.setting === s.value}
              onClick={() => onChange({ setting: s.value })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">
          Supporting characters <span className="text-ink/40 font-normal">(pick any)</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {COMPANIONS.map(c => (
            <SelectCard
              key={c.value}
              icon={c.icon}
              label={c.label}
              selected={companions.includes(c.value)}
              onClick={() => toggleCompanion(c.value)}
              size="sm"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
