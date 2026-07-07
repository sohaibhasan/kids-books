'use client'

import SelectCard from '@/components/ui/SelectCard'
import { WizardFormData } from '@/types'
import { ART_STYLES, LENGTHS } from '@/lib/wizard-options'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

export default function StepStyle({ data, onChange }: Props) {
  return (
    <div>
      <StepHeader
        eyebrow="Look & feel"
        title="Choose an art style."
        description="Each aesthetic was tuned to a different family of children's books."
      />

      <div className="space-y-10">
        <div>
          <p className="text-sm font-medium text-ink mb-3">Art style</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ART_STYLES.map((s) => (
              <SelectCard
                key={s.value}
                icon={s.icon}
                label={s.label}
                description={s.description}
                tone="lavender"
                selected={data.art_style === s.value}
                onClick={() => onChange({ art_style: s.value })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-3">Length</p>
          <div className="grid grid-cols-3 gap-3">
            {LENGTHS.map((l) => (
              <SelectCard
                key={l.value}
                icon={l.icon}
                label={l.label}
                description={l.pages}
                tone="apricot"
                selected={data.length === l.value}
                onClick={() => onChange({ length: l.value })}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
