'use client'

import SelectCard from '@/components/ui/SelectCard'
import Chip from '@/components/ui/Chip'
import { DepthModifier, Tone, WizardFormData, WritingStyle } from '@/types'
import { DEPTH_MODIFIERS, TONE_META, WRITING_STYLE_VOICES } from '@/lib/ai/writing-styles'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const VOICE_KEYS = Object.keys(WRITING_STYLE_VOICES) as WritingStyle[]
const TONE_KEYS  = Object.keys(TONE_META) as Tone[]
const DEPTH_KEYS = Object.keys(DEPTH_MODIFIERS) as DepthModifier[]

export default function StepVoice({ data, onChange }: Props) {
  const toggleDepth = (key: DepthModifier) => {
    const current = data.depth_modifiers ?? []
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    onChange({ depth_modifiers: next })
  }

  return (
    <div>
      <StepHeader
        eyebrow="Voice & tone"
        title="How should it sound out loud?"
        description="The voice shapes craft. The tone shapes mood. Depth modifiers push toward richer technique — entirely optional."
      />

      <div className="space-y-10">
        <div>
          <p className="text-sm font-medium text-ink mb-3">Writing voice</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VOICE_KEYS.map((key) => {
              const voice = WRITING_STYLE_VOICES[key]
              return (
                <SelectCard
                  key={key}
                  icon={voice.icon}
                  label={voice.label}
                  description={voice.description}
                  tone="brand"
                  selected={data.writing_style === key}
                  onClick={() => onChange({ writing_style: key })}
                />
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-3">Tone</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TONE_KEYS.map((key) => {
              const meta = TONE_META[key]
              return (
                <SelectCard
                  key={key}
                  icon={meta.icon}
                  label={meta.label}
                  size="sm"
                  tone="accent"
                  selected={data.tone === key}
                  onClick={() => onChange({ tone: key })}
                />
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-1">
            Depth <span className="text-ink-muted font-normal">— optional, pick any</span>
          </p>
          <p className="text-sm text-ink-muted mb-3">Each adds a specific storytelling technique.</p>
          <div className="flex flex-wrap gap-2">
            {DEPTH_KEYS.map((key) => {
              const mod = DEPTH_MODIFIERS[key]
              const selected = (data.depth_modifiers ?? []).includes(key)
              return (
                <Chip
                  key={key}
                  label={mod.label}
                  selected={selected}
                  onClick={() => toggleDepth(key)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
