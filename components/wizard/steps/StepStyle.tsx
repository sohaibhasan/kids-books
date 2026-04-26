'use client'

import SelectCard from '@/components/ui/SelectCard'
import { ArtStyle, ImageQuality, WizardFormData } from '@/types'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onChange: (fields: Partial<WizardFormData>) => void
}

const ART_STYLES: { value: ArtStyle; icon: string; label: string; description: string }[] = [
  { value: 'comic-book',         icon: '💥', label: 'Comic Book',         description: 'Bold outlines, flat colors, action energy' },
  { value: 'classic-watercolor', icon: '🎨', label: 'Classic Watercolor', description: 'Soft washes, delicate ink, warm tones' },
  { value: 'paper-collage',      icon: '✂️', label: 'Paper Collage',      description: 'Layered textures, bold cut-out shapes' },
  { value: 'whimsical-ink',      icon: '🖋️', label: 'Whimsical Ink',     description: 'Loose pen-and-ink, sketchy, expressive' },
  { value: 'bold-modern',        icon: '✨', label: 'Bold & Modern',      description: 'Flat colors, clean shapes, poster-like' },
  { value: 'soft-cozy',          icon: '🌙', label: 'Soft & Cozy',        description: 'Warm muted tones, gentle, calming' },
  { value: 'anime-ghibli',       icon: '🌸', label: 'Anime / Ghibli',     description: 'Soft anime, lush backgrounds, pastel' },
  { value: 'storybook-realism',  icon: '🎭', label: 'Storybook Realism',  description: 'Painterly detail, dramatic lighting' },
]

const LENGTHS: { value: WizardFormData['length']; icon: string; label: string; pages: string }[] = [
  { value: 'short',  icon: '📄', label: 'Short',  pages: '~5 pages' },
  { value: 'medium', icon: '📖', label: 'Medium', pages: '~10 pages' },
  { value: 'long',   icon: '📚', label: 'Long',   pages: '~15 pages' },
]

const QUALITIES: { value: ImageQuality; icon: string; label: string; description: string }[] = [
  { value: 'standard', icon: '🖼️', label: 'Standard', description: 'Fast & affordable' },
  { value: 'high',     icon: '🌟', label: 'High',     description: 'Best quality, slower' },
]

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

        <div>
          <p className="text-sm font-medium text-ink mb-3">Image quality</p>
          <div className="grid grid-cols-2 gap-3">
            {QUALITIES.map((q) => (
              <SelectCard
                key={q.value}
                icon={q.icon}
                label={q.label}
                description={q.description}
                tone="accent"
                selected={data.image_quality === q.value}
                onClick={() => onChange({ image_quality: q.value })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
