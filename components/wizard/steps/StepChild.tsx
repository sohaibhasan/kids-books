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

const SKIN_TONES = [
  { value: 'light',       label: 'Light',       color: '#FDDCB5' },
  { value: 'fair',        label: 'Fair',         color: '#F5C5A3' },
  { value: 'medium',      label: 'Medium',       color: '#D4A373' },
  { value: 'tan',         label: 'Tan',          color: '#C68C53' },
  { value: 'brown',       label: 'Brown',        color: '#8D5524' },
  { value: 'dark brown',  label: 'Dark Brown',   color: '#5C3310' },
]

const HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Auburn', 'Strawberry Blonde']

const HAIR_STYLES = ['Straight and short', 'Straight and long', 'Wavy and short', 'Wavy and long', 'Curly and short', 'Curly and long', 'Coily / afro', 'Braids', 'Ponytail', 'Two puffs', 'Pigtails', 'Bun', 'Buzz cut']

const EYE_COLORS = ['Brown', 'Dark Brown', 'Hazel', 'Green', 'Blue', 'Gray']

const OUTFITS = [
  { value: 'a bright red hoodie with a yellow star on the chest, blue jeans, and white sneakers', label: 'Red Hoodie', icon: '🔴' },
  { value: 'a purple t-shirt with a rainbow on it, green shorts, and yellow rain boots', label: 'Rainbow Tee', icon: '🌈' },
  { value: 'a blue denim jacket over a striped white-and-navy shirt, khaki pants, and brown boots', label: 'Denim Jacket', icon: '🧥' },
  { value: 'a pink princess dress with sparkly silver stars, a small tiara, and silver slippers', label: 'Princess Dress', icon: '👗' },
  { value: 'a green dinosaur onesie with a hood that has little spikes, and orange sneakers', label: 'Dino Onesie', icon: '🦖' },
  { value: 'a yellow superhero cape over a blue t-shirt, red shorts, and black boots', label: 'Superhero Cape', icon: '🦸' },
  { value: 'a cozy orange sweater with a pumpkin on it, dark blue leggings, and brown ankle boots', label: 'Cozy Sweater', icon: '🎃' },
  { value: 'a white lab coat over a light blue shirt, gray pants, and big round goggles on their head', label: 'Scientist', icon: '🔬' },
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

      {/* Skin tone */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-semibold text-ink">Skin tone</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {SKIN_TONES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ skin_tone: s.value })}
              className={`
                flex flex-col items-center gap-1 rounded-xl border-4 px-2 py-3 transition-all
                ${data.skin_tone === s.value
                  ? 'border-ink shadow-[3px_3px_0_#1a1a1a] -translate-y-0.5'
                  : 'border-ink/20 hover:border-ink/50'}
              `}
            >
              <span className="w-8 h-8 rounded-full border-2 border-ink/20" style={{ backgroundColor: s.color }} />
              <span className="text-xs font-bold text-ink">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-ink">Hair color</label>
          <select
            value={data.hair_color}
            onChange={e => onChange({ hair_color: e.target.value })}
            className="rounded-xl border-4 border-ink/30 px-4 py-3 text-base font-semibold text-ink bg-white focus:border-ink focus:outline-none"
          >
            <option value="">Select...</option>
            {HAIR_COLORS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-ink">Hair style</label>
          <select
            value={data.hair_style}
            onChange={e => onChange({ hair_style: e.target.value })}
            className="rounded-xl border-4 border-ink/30 px-4 py-3 text-base font-semibold text-ink bg-white focus:border-ink focus:outline-none"
          >
            <option value="">Select...</option>
            {HAIR_STYLES.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Eye color */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-semibold text-ink">Eye color</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {EYE_COLORS.map(c => (
            <SelectCard
              key={c}
              label={c}
              selected={data.eye_color === c.toLowerCase()}
              onClick={() => onChange({ eye_color: c.toLowerCase() })}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Outfit */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-semibold text-ink">Outfit</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {OUTFITS.map(o => (
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
        onChange={v => onChange({ child_appearance: v })}
        placeholder="e.g. wears glasses, has freckles, missing front tooth"
        hint="Extra details to make the character unique."
      />
    </div>
  )
}
