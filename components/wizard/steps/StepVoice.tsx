'use client'

import SelectCard from '@/components/ui/SelectCard'
import { DepthModifier, Tone, WizardFormData, WritingStyle } from '@/types'
import { DEPTH_MODIFIERS, TONE_META, WRITING_STYLE_VOICES } from '@/lib/ai/writing-styles'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const VOICE_KEYS = Object.keys(WRITING_STYLE_VOICES) as WritingStyle[]
const TONE_KEYS = Object.keys(TONE_META) as Tone[]
const DEPTH_KEYS = Object.keys(DEPTH_MODIFIERS) as DepthModifier[]

export default function StepVoice({ data, onChange }: Props) {
  const toggleDepth = (key: DepthModifier) => {
    const current = data.depth_modifiers ?? []
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key]
    onChange({ depth_modifiers: next })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-ink mb-1">Writing voice</h2>
        <p className="text-ink/60">How should the story sound when read aloud?</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">Voice</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VOICE_KEYS.map(key => {
            const voice = WRITING_STYLE_VOICES[key]
            return (
              <SelectCard
                key={key}
                icon={voice.icon}
                label={voice.label}
                description={voice.description}
                selected={data.writing_style === key}
                onClick={() => onChange({ writing_style: key })}
              />
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">Tone</label>
        <div className="grid grid-cols-3 gap-3">
          {TONE_KEYS.map(key => {
            const meta = TONE_META[key]
            return (
              <SelectCard
                key={key}
                icon={meta.icon}
                label={meta.label}
                selected={data.tone === key}
                onClick={() => onChange({ tone: key })}
              />
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">
          Depth
          <span className="ml-2 text-xs text-ink/50 font-normal">Optional — pick any that feel right</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {DEPTH_KEYS.map(key => {
            const mod = DEPTH_MODIFIERS[key]
            const selected = (data.depth_modifiers ?? []).includes(key)
            return (
              <SelectCard
                key={key}
                icon={mod.icon}
                label={mod.label}
                description={mod.description}
                selected={selected}
                onClick={() => toggleDepth(key)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
