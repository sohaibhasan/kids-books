'use client'

import SelectCard from '@/components/ui/SelectCard'
import { ArtStyle, ImageQuality, WizardFormData } from '@/types'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const ART_STYLES: { value: ArtStyle; icon: string; label: string; description: string }[] = [
  { value: 'comic-book',         icon: '💥', label: 'Comic Book',         description: 'Bold outlines, flat colors, action energy' },
  { value: 'classic-watercolor', icon: '🎨', label: 'Classic Watercolor', description: 'Soft washes, delicate ink, warm tones' },
  { value: 'paper-collage',      icon: '✂️', label: 'Paper Collage',      description: 'Layered textures, bold cut-out shapes' },
  { value: 'whimsical-ink',      icon: '🖋️', label: 'Whimsical Ink',      description: 'Loose pen-and-ink, sketchy, expressive' },
  { value: 'bold-modern',        icon: '✨', label: 'Bold & Modern',      description: 'Flat colors, clean shapes, poster-like' },
  { value: 'soft-cozy',          icon: '🌙', label: 'Soft & Cozy',        description: 'Warm muted tones, gentle, calming' },
  { value: 'anime-ghibli',       icon: '🌸', label: 'Anime / Ghibli',     description: 'Soft anime, lush backgrounds, pastel' },
  { value: 'storybook-realism',  icon: '🎭', label: 'Storybook Realism',  description: 'Painterly detail, dramatic lighting' },
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

const QUALITIES: { value: ImageQuality; icon: string; label: string; description: string }[] = [
  { value: 'standard', icon: '🖼️', label: 'Standard', description: 'Fast & affordable (~$0.005/page)' },
  { value: 'high',     icon: '🌟', label: 'High',     description: 'Best quality (~$0.04/page)' },
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

      <div className="flex flex-col gap-3">
        <label className="text-base font-semibold text-ink">Image quality</label>
        <div className="grid grid-cols-2 gap-3">
          {QUALITIES.map(q => (
            <SelectCard
              key={q.value}
              icon={q.icon}
              label={q.label}
              description={q.description}
              selected={data.image_quality === q.value}
              onClick={() => onChange({ image_quality: q.value })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
