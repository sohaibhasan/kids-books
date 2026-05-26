'use client'

import { AnimatePresence, motion } from 'motion/react'
import { ArtStyle, WizardFormData, WritingStyle } from '@/types'
import { fadeUp, springs } from '@/lib/motion'
import { SKIN_TONES, OUTFITS } from './steps/StepChild'
import { GENRES } from './steps/StepGenre.data'
import { LESSONS } from './steps/StepTheme.data'
import { SETTINGS, COMPANIONS } from './steps/StepSetting'
import { ART_STYLES, LENGTHS } from './steps/StepStyle'
import { WRITING_STYLE_VOICES, TONE_META, DEPTH_MODIFIERS } from '@/lib/ai/writing-styles'

interface Props {
  data: WizardFormData
  step: number
}

// Gradient swatch for each art style — keyed to STYLE_PREFIXES vibe in lib/ai/index.ts
const STYLE_SWATCHES: Record<ArtStyle, string> = {
  'comic-book':         'from-yellow-300 via-red-500 to-blue-600',
  'classic-watercolor': 'from-sky-200 via-rose-200 to-amber-200',
  'paper-collage':      'from-emerald-300 via-amber-300 to-fuchsia-300',
  'whimsical-ink':      'from-stone-100 via-stone-300 to-stone-700',
  'bold-modern':        'from-cyan-400 via-fuchsia-500 to-amber-400',
  'soft-cozy':          'from-amber-100 via-orange-200 to-rose-200',
  'anime-ghibli':       'from-emerald-200 via-sky-200 to-rose-200',
  'storybook-realism':  'from-amber-700 via-rose-400 to-indigo-700',
}

// One short sample sentence per voice — written to match each voice's craft
const VOICE_SAMPLES: Record<WritingStyle, string> = {
  'rhyming-playful':
    '"Up the hill and over the moon, the little fox sang a wobbly tune."',
  'gentle-pastoral':
    'Presently, she fetched a mitten from the hedgerow and tucked it neatly into her pocket, quite pleased with the find.',
  'deadpan-quirky':
    '"That," said the duck, "is definitely a hat." Nobody disagreed. Mostly because they were busy.',
  'lyrical-imaginative':
    'The worry sat in her chest like a stone — heavy, smooth, and somehow patient, as if it were waiting to be set down.',
  'mischievous-bold':
    'She grinned the grin of a kid with a plan. A perfectly silly, perfectly clever plan.',
  'warm-contemplative':
    '"I wonder," said Theo, "if the moon ever gets tired of being so round." Mabel thought about this for a long, soft minute.',
  'vocab-stretching':
    'She was utterly flummoxed — which, dear reader, is a very fancy word for confused with a question mark on top.',
  'sensory-repetitive':
    'On Monday she found one red leaf. On Tuesday she found two crinkly, crackly leaves. On Wednesday — well, you can guess.',
}

const toneSwatch: Record<string, string> = {
  lavender: 'bg-[var(--story-lavender)]/40 border-[var(--story-lavender)]',
  apricot:  'bg-[var(--story-apricot)]/40 border-[var(--story-apricot)]',
  sky:      'bg-[var(--story-sky)]/40 border-[var(--story-sky)]',
  sage:     'bg-[var(--story-sage)]/40 border-[var(--story-sage)]',
  rose:     'bg-[var(--story-rose)]/40 border-[var(--story-rose)]',
  accent:   'bg-accent-tint border-accent',
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      variants={fadeUp}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={springs.gentle}
      className="space-y-2"
    >
      <p className="text-[10px] uppercase tracking-widest text-ink-muted font-semibold">{title}</p>
      {children}
    </motion.div>
  )
}

function PillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs bg-surface-sunken text-ink-soft border border-border">
      {children}
    </span>
  )
}

export default function StoryPreview({ data, step }: Props) {
  const hasHero = data.child_name.trim().length > 0
  const skin = SKIN_TONES.find((s) => s.value === data.skin_tone)
  const outfit = OUTFITS.find((o) => o.value === data.outfit)
  const genre = GENRES.find((g) => g.value === data.genre)
  const lesson = LESSONS.find((l) => l.value === data.lesson)
  const setting = SETTINGS.find((s) => s.value === data.setting)
  const companionValues = data.supporting_characters
    ? data.supporting_characters.split(',').filter(Boolean)
    : []
  const companions = COMPANIONS.filter((c) => companionValues.includes(c.value))
  const artStyle = ART_STYLES.find((s) => s.value === data.art_style)
  const length = LENGTHS.find((l) => l.value === data.length)
  const voice = data.writing_style ? WRITING_STYLE_VOICES[data.writing_style] : null
  const sample = data.writing_style ? VOICE_SAMPLES[data.writing_style] : null
  const tone = data.tone ? TONE_META[data.tone] : null
  const showHero = step >= 1 && hasHero
  const showGenre = step >= 2 && !!genre
  const showLesson = step >= 3 && !!lesson
  const showSetting = step >= 4 && !!setting
  const showStyle = step >= 5 && !!artStyle
  const showVoice = step >= 6 && !!voice

  const isEmpty = !showHero && !showGenre && !showLesson && !showSetting && !showStyle && !showVoice

  return (
    <aside
      aria-label="Your story so far"
      className="bg-surface-raised rounded-xl border border-border shadow-sm p-5 lg:p-6"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-lg text-ink">Your story so far</h2>
      </div>

      {isEmpty ? (
        <p className="text-sm text-ink-muted leading-relaxed">
          Pick choices on the left — your story will take shape here as you go.
        </p>
      ) : (
        <div className="space-y-5">
          <AnimatePresence mode="popLayout" initial={false}>
            {showHero && (
              <SectionShell key="hero" title="Hero">
                <div className="flex items-center gap-3">
                  <span
                    className="size-12 rounded-pill border border-border shrink-0 shadow-inner"
                    style={{ backgroundColor: skin?.color ?? '#E8D5C4' }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-display text-base text-ink leading-tight truncate">
                      {data.child_name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {data.child_age ? `${data.child_age} years old` : null}
                      {data.child_age && data.child_pronouns ? ' · ' : null}
                      {data.child_pronouns}
                    </p>
                  </div>
                </div>
                {(outfit || data.child_appearance) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {outfit && (
                      <PillTag>
                        <span aria-hidden>{outfit.icon}</span>
                        {outfit.label}
                      </PillTag>
                    )}
                    {data.child_appearance && (
                      <PillTag>{data.child_appearance}</PillTag>
                    )}
                  </div>
                )}
              </SectionShell>
            )}

            {showGenre && (
              <SectionShell key="genre" title="Genre">
                <div
                  className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm text-ink ${toneSwatch[genre!.tone] ?? toneSwatch.lavender}`}
                >
                  <span aria-hidden>{genre!.icon}</span>
                  <span className="font-medium">{genre!.label}</span>
                </div>
                <p className="text-xs text-ink-muted">{genre!.description}</p>
              </SectionShell>
            )}

            {showLesson && (
              <SectionShell key="lesson" title="Lesson">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>{lesson!.icon}</span>
                  <span className="text-sm font-medium text-ink">{lesson!.value}</span>
                </div>
              </SectionShell>
            )}

            {showSetting && (
              <SectionShell key="setting" title="Setting">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>{setting!.icon}</span>
                  <span className="text-sm font-medium text-ink">{setting!.value}</span>
                </div>
                {companions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {companions.map((c) => (
                      <PillTag key={c.value}>
                        <span aria-hidden>{c.icon}</span>
                        {c.label}
                      </PillTag>
                    ))}
                  </div>
                )}
                {data.companion_name && companions.length > 0 && (
                  <p className="text-xs text-ink-muted">
                    Named <span className="font-medium text-ink-soft">{data.companion_name}</span>
                  </p>
                )}
              </SectionShell>
            )}

            {showStyle && (
              <SectionShell key="style" title="Art style">
                <div className="flex items-center gap-3">
                  <span
                    className={`block size-12 rounded-md bg-gradient-to-br shrink-0 border border-border ${STYLE_SWATCHES[artStyle!.value]}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink leading-tight">{artStyle!.label}</p>
                    <p className="text-xs text-ink-muted">
                      {length ? length.pages : artStyle!.description}
                    </p>
                  </div>
                </div>
              </SectionShell>
            )}

            {showVoice && (
              <SectionShell key="voice" title="Voice & tone">
                <div className="rounded-md bg-surface-sunken/70 border border-border px-3 py-2.5">
                  <p className="font-display italic text-sm text-ink leading-snug">
                    {sample}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-ink-muted font-semibold mt-2">
                    {voice!.icon} {voice!.label}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tone && (
                    <PillTag>
                      <span aria-hidden>{tone.icon}</span>
                      {tone.label}
                    </PillTag>
                  )}
                  {data.depth_modifiers?.map((m) => {
                    const meta = DEPTH_MODIFIERS[m]
                    return (
                      <PillTag key={m}>
                        <span aria-hidden>{meta.icon}</span>
                        {meta.label}
                      </PillTag>
                    )
                  })}
                </div>
              </SectionShell>
            )}
          </AnimatePresence>
        </div>
      )}
    </aside>
  )
}
