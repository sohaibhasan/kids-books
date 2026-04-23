'use client'

import { WizardFormData } from '@/types'
import { DEPTH_MODIFIERS, TONE_META, WRITING_STYLE_VOICES } from '@/lib/ai/writing-styles'

interface Props {
  data: WizardFormData
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b-2 border-ink/10 last:border-none">
      <span className="text-ink/50 font-medium text-sm">{label}</span>
      <span className="text-ink font-semibold text-sm text-right max-w-[60%]">{value || '—'}</span>
    </div>
  )
}

export default function StepReview({ data }: Props) {
  const name = data.child_name || 'Your child'
  const companions = data.supporting_characters
    ? data.supporting_characters.split(',').filter(Boolean).join(', ')
    : 'None'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink mb-1">Ready to create! 🎉</h2>
        <p className="text-ink/60">Here's {name}'s story at a glance.</p>
      </div>

      <div className="bg-white rounded-2xl border-4 border-ink shadow-[4px_4px_0_#ffd700] p-5">
        <Row label="Hero" value={`${name}, age ${data.child_age} (${data.child_pronouns})`} />
        <Row label="Appearance" value={[data.skin_tone && `${data.skin_tone} skin`, data.hair_color && `${data.hair_color} hair`, data.hair_style, data.eye_color && `${data.eye_color} eyes`, data.child_appearance].filter(Boolean).join(', ') || '—'} />
        {data.outfit && <Row label="Outfit" value={data.outfit} />}
        <Row label="Genre" value={data.genre} />
        <Row label="Lesson" value={data.lesson} />
        <Row label="Setting" value={data.setting} />
        <Row label="Companions" value={companions} />
        <Row label="Art style" value={data.art_style} />
        <Row label="Writing voice" value={data.writing_style ? WRITING_STYLE_VOICES[data.writing_style].label : '—'} />
        <Row label="Tone" value={data.tone ? TONE_META[data.tone].label : '—'} />
        {data.depth_modifiers && data.depth_modifiers.length > 0 && (
          <Row label="Depth" value={data.depth_modifiers.map(k => DEPTH_MODIFIERS[k].label).join(', ')} />
        )}
        <Row label="Length" value={data.length} />
      </div>

      <p className="text-sm text-ink/50 text-center">
        Once you hit <strong>Create My Story</strong>, we'll generate the full illustrated storybook — this takes about 2 minutes.
      </p>
    </div>
  )
}
