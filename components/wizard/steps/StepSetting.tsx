'use client'

import SelectCard from '@/components/ui/SelectCard'
import Input from '@/components/ui/Input'
import { WizardFormData } from '@/types'
import { SETTINGS, COMPANIONS } from '@/lib/wizard-options'
import { parseCompanions } from '@/lib/utils'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

export default function StepSetting({ data, onChange }: Props) {
  const companions = parseCompanions(data.supporting_characters)

  const toggleCompanion = (value: string) => {
    const updated = companions.includes(value)
      ? companions.filter((c) => c !== value)
      : [...companions, value]
    const newSupportingCharacters = updated.join(',')
    // When deselecting the last companion, also clear companion_name
    const updates: Partial<WizardFormData> = { supporting_characters: newSupportingCharacters }
    if (updated.length === 0) {
      updates.companion_name = ''
    }
    onChange(updates)
  }

  return (
    <div>
      <StepHeader
        eyebrow="Build the world"
        title="Where does it all happen?"
        description="Pick the setting and any companions along for the ride."
      />

      <div className="space-y-10">
        <div>
          <p className="text-sm font-medium text-ink mb-3">Setting</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SETTINGS.map((s) => (
              <SelectCard
                key={s.value}
                icon={s.icon}
                label={s.label}
                tone="sage"
                selected={data.setting === s.value}
                onClick={() => onChange({ setting: s.value })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-1">
            Supporting characters{' '}
            <span className="text-ink-muted font-normal">— pick any</span>
          </p>
          <p className="text-sm text-ink-muted mb-3">Optional company for your hero.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COMPANIONS.map((c) => (
              <SelectCard
                key={c.value}
                icon={c.icon}
                label={c.label}
                tone="sky"
                multi
                size="sm"
                selected={companions.includes(c.value)}
                onClick={() => toggleCompanion(c.value)}
              />
            ))}
          </div>
          {companions.length > 0 && (
            <div className="mt-5">
              <Input
                label="Give them a name (optional)"
                placeholder="e.g. Luna, Captain Whiskers"
                value={data.companion_name}
                onChange={(v) => onChange({ companion_name: v })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
