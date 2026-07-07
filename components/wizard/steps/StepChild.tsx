'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import SelectCard from '@/components/ui/SelectCard'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { WizardFormData } from '@/types'
import { SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_COLORS, OUTFITS } from '@/lib/wizard-options'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const PRONOUNS = [
  { label: 'She / Her',   icon: '👧' },
  { label: 'He / Him',    icon: '👦' },
  { label: 'They / Them', icon: '🧒' },
]

function ColorSwatchButton({
  color, label, selected, onClick,
}: { color: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-md py-3 px-2',
        'border transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-tint',
        selected
          ? 'bg-brand-tint border-brand shadow-sm'
          : 'bg-surface-raised border-border hover:border-ink-muted',
      )}
    >
      <span
        className={cn(
          'size-9 rounded-pill border',
          selected ? 'border-brand ring-2 ring-brand/20' : 'border-border',
        )}
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] font-medium text-ink">{label}</span>
    </button>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="contents">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {hint && <p className="text-sm text-ink-muted">{hint}</p>}
        </div>
      </legend>
      {children}
    </fieldset>
  )
}

export default function StepChild({ data, onChange }: Props) {
  const [ageInput, setAgeInput] = useState(String(data.child_age))

  return (
    <div>
      <StepHeader
        eyebrow="About the hero"
        title="Who is this story for?"
        description="Tell us about the star of the story — the more detail, the more they'll feel like themselves on every page."
      />

      <div className="space-y-10">
        {/* About */}
        <Section title="About your child">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Child's name"
              value={data.child_name}
              onChange={(v) => onChange({ child_name: v })}
              placeholder="e.g. Aamilah"
            />
            <Input
              label="Age"
              type="number"
              value={ageInput}
              onChange={(v) => {
                setAgeInput(v)
                const n = parseInt(v, 10)
                if (!Number.isNaN(n)) onChange({ child_age: n })
              }}
              onBlur={() => {
                const n = parseInt(ageInput, 10)
                if (ageInput === '' || Number.isNaN(n)) {
                  setAgeInput(String(data.child_age))
                  return
                }
                const clamped = Math.max(2, Math.min(12, n))
                if (clamped !== n) {
                  setAgeInput(String(clamped))
                  onChange({ child_age: clamped })
                }
              }}
              min={2}
              max={12}
              hint="Ages 2–12"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-2">Pronouns</p>
            <div className="grid grid-cols-3 gap-3">
              {PRONOUNS.map((p) => (
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

          <div className="flex items-start gap-3 p-4 rounded-md bg-surface-sunken/70 border border-border">
            <Camera className="size-5 text-ink-muted mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink flex items-center gap-2">
                Upload a photo <Badge tone="soft">Coming soon</Badge>
              </p>
              <p className="text-sm text-ink-muted mt-0.5">
                Drop a snapshot to make the character look even more like your child.
              </p>
            </div>
          </div>
        </Section>

        {/* Looks */}
        <Section title="How they look" hint="A consistent look helps the illustrator keep them recognizable on every page.">
          <div>
            <p className="text-sm font-medium text-ink mb-2">Skin tone</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SKIN_TONES.map((s) => (
                <ColorSwatchButton
                  key={s.value}
                  color={s.color}
                  label={s.label}
                  selected={data.skin_tone === s.value}
                  onClick={() => onChange({ skin_tone: s.value })}
                />
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Hair color"
              value={data.hair_color}
              onChange={(v) => onChange({ hair_color: v })}
              placeholder="Select a color"
              options={HAIR_COLORS.map((c) => ({ value: c.toLowerCase(), label: c }))}
            />
            <Select
              label="Hair style"
              value={data.hair_style}
              onChange={(v) => onChange({ hair_style: v })}
              placeholder="Select a style"
              options={HAIR_STYLES.map((s) => ({ value: s.toLowerCase(), label: s }))}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-2">Eye color</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {EYE_COLORS.map((c) => (
                <ColorSwatchButton
                  key={c.value}
                  color={c.color}
                  label={c.label}
                  selected={data.eye_color === c.value}
                  onClick={() => onChange({ eye_color: c.value })}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-2">
              Outfit{' '}
              <span className="text-ink-muted font-normal">— the strongest visual anchor across pages</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {OUTFITS.map((o) => (
                <SelectCard
                  key={o.value}
                  icon={o.icon}
                  label={o.label}
                  selected={data.outfit === o.value}
                  onClick={() => onChange({ outfit: o.value })}
                  size="sm"
                />
              ))}
            </div>
          </div>

          <Input
            label="Anything else? (optional)"
            value={data.child_appearance}
            onChange={(v) => onChange({ child_appearance: v })}
            placeholder="e.g. wears glasses, has freckles, missing front tooth"
            hint="Extra details that make the character unique."
          />
        </Section>
      </div>
    </div>
  )
}
