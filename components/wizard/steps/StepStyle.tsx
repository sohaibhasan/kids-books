'use client'

import SelectCard from '@/components/ui/SelectCard'
import { ArtStyle, WizardFormData } from '@/types'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const ART_STYLES: { value: ArtStyle; icon: string; label: string; description: string }[] = [
  { value: 'dog-man',     icon: '💥', label: 'Dog Man',      description: 'Bold outlines, flat colors' },
  { value: 'watercolor',  icon: '🎨', label: 'Watercolor',   description: 'Soft, dreamy, classic' },
  { value: 'bold-bright', icon: '✨', label: 'Bold & Bright', description: 'Modern, playful colors' },
  { value: 'pencil-sketch', icon: '✏️', label: 'Pencil Sketch', description: 'Hand-drawn, cozy' },
]

const TONES: { value: WizardFormData['tone']; icon: string; label: string }[] = [
  { value: 'silly',       icon: '😂', label: 'Silly' },
  { value: 'heartfelt',   icon: '🥰', label: 'Heartfelt' },
  { value: 'adventurous', icon: '⚡', label: 'Adventurous' },
]

const LENGTHS: { value: WizardFormData['length']; icon: string; label: string; pages: string }[] = [
  { value: 'short',  icon: '📄', label: 'Short',  pages: '~5 pages' },
  { value: 'medium', icon: '📖', label: 'Medium', pages: '~10 pages' },
  { value: 'long',   icon: '📚', label: 'Long',   pages: '~15 pages' },
]

export default function StepStyle({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-ink mb-1">Style & length</h2>
        <p className="text-ink/60">How should the story look and feel?</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">Art style</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ART_STYLES.map(s => (
            <SelectCard
              key={s.value}
              icon={s.icon}
              label={s.label}
              description={s.description}
              selected={data.art_style === s.value}
              onClick={() => onChange({ art_style: s.value })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">Tone</label>
        <div className="grid grid-cols-3 gap-3">
          {TONES.map(t => (
            <SelectCard
              key={t.value}
              icon={t.icon}
              label={t.label}
              selected={data.tone === t.value}
              onClick={() => onChange({ tone: t.value })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">Length</label>
        <div className="grid grid-cols-3 gap-3">
          {LENGTHS.map(l => (
            <SelectCard
              key={l.value}
              icon={l.icon}
              label={l.label}
              description={l.pages}
              selected={data.length === l.value}
              onClick={() => onChange({ length: l.value })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
