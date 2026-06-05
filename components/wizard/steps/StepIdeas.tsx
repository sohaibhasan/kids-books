'use client'

import Textarea from '@/components/ui/Textarea'
import Input from '@/components/ui/Input'
import Chip from '@/components/ui/Chip'
import { WizardFormData } from '@/types'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

// Field caps mirror the server-side clamps in app/api/stories/start/route.ts.
const PLOT_CAP = 600
const SUBJECTS_CAP = 300
const WORLD_CAP = 300
const OBJECT_CAP = 120

// Suggestion chips prefill the must-happen-moment field (append, comma-joined).
const PLOT_SUGGESTIONS = [
  'a surprise birthday',
  'finding a hidden door',
  'a friend who needs help',
  'a wish that comes true',
  'getting a little lost, then found',
  'a brave first try',
]

export default function StepIdeas({ data, onChange }: Props) {
  const appendPlot = (s: string) => {
    const current = (data.custom_plot_points ?? '').trim()
    const next = current ? `${current}, ${s}` : s
    onChange({ custom_plot_points: next.slice(0, PLOT_CAP) })
  }

  return (
    <div>
      <StepHeader
        eyebrow="Your ideas — optional"
        title="Anything you'd love woven in?"
        description="Sprinkle in details that make it personal. Our author treats these as gentle inspiration and only uses what fits the story — leave any blank to skip."
      />

      <div className="space-y-8">
        <div>
          <Textarea
            label="A moment you'd love to happen"
            hint="A little plot beat or scene. Keep it light — the author shapes it to fit the story."
            placeholder="e.g. She shares her last cookie with a lonely robot."
            rows={3}
            maxLength={PLOT_CAP}
            value={data.custom_plot_points ?? ''}
            onChange={(value) => onChange({ custom_plot_points: value })}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {PLOT_SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} selected={false} onClick={() => appendPlot(s)} />
            ))}
          </div>
        </div>

        <Textarea
          label="Interests to feature"
          hint="Hobbies, animals, topics they love — dinosaurs, space, baking…"
          placeholder="e.g. loves trains, the ocean, and counting stars"
          rows={2}
          maxLength={SUBJECTS_CAP}
          value={data.custom_subjects ?? ''}
          onChange={(value) => onChange({ custom_subjects: value })}
        />

        <Textarea
          label="World or setting details"
          hint="Small flourishes about the world — a floating market, candy-colored fog…"
          placeholder="e.g. a village built inside a giant tree"
          rows={2}
          maxLength={WORLD_CAP}
          value={data.custom_world_details ?? ''}
          onChange={(value) => onChange({ custom_world_details: value })}
        />

        <Input
          label="A special object"
          hint="One meaningful item to appear in the story."
          placeholder="e.g. a glowing blue compass"
          maxLength={OBJECT_CAP}
          value={data.custom_special_object ?? ''}
          onChange={(value) => onChange({ custom_special_object: value })}
        />

        <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-raised cursor-pointer hover:bg-surface-sunken/40 transition-colors">
          <input
            type="checkbox"
            checked={!!data.surprise_me}
            onChange={(e) => onChange({ surprise_me: e.target.checked })}
            className="mt-0.5 size-4 rounded border-border accent-[color:var(--brand)] cursor-pointer"
          />
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] text-ink font-medium leading-snug">Surprise me</span>
            <span className="mt-1 block text-sm text-ink-muted leading-snug">
              Let the author invent one extra age-appropriate delight you didn&apos;t ask for.
            </span>
          </span>
        </label>
      </div>
    </div>
  )
}
