'use client'

import { Check, Mail, Pencil, Sparkles } from 'lucide-react'
import { WizardFormData } from '@/types'
import { DEPTH_MODIFIERS, TONE_META, WRITING_STYLE_VOICES } from '@/lib/ai/writing-styles'
import Input from '@/components/ui/Input'
import StepHeader from '../StepHeader'

interface Props {
  data: WizardFormData
  onJump: (step: number) => void
  onChange: (fields: Partial<WizardFormData>) => void
}

interface Row {
  label: string
  value: string
  step: number
}

function MetaRow({ row, onJump }: { row: Row; onJump: (step: number) => void }) {
  return (
    <div className="group flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-none">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-ink-muted font-semibold">{row.label}</p>
        <p className="mt-1 text-[15px] text-ink leading-snug break-words">{row.value || '—'}</p>
      </div>
      <button
        type="button"
        onClick={() => onJump(row.step)}
        className="shrink-0 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand opacity-60 group-hover:opacity-100 transition-all"
      >
        <Pencil className="size-3" />
        Edit
      </button>
    </div>
  )
}

export default function StepReview({ data, onJump, onChange }: Props) {
  const name = data.child_name || 'Your child'
  const companions = data.supporting_characters
    ? data.supporting_characters.split(',').filter(Boolean).join(', ')
    : 'None'

  const appearance = [
    data.skin_tone && `${data.skin_tone} skin`,
    data.hair_color && `${data.hair_color} hair`,
    data.hair_style,
    data.eye_color && `${data.eye_color} eyes`,
    data.child_appearance,
  ].filter(Boolean).join(', ') || '—'

  const rows: Row[] = [
    { step: 1, label: 'Hero',          value: `${name}, age ${data.child_age} (${data.child_pronouns})` },
    { step: 1, label: 'Appearance',    value: appearance },
    { step: 1, label: 'Outfit',        value: data.outfit || '—' },
    { step: 2, label: 'Genre',         value: data.genre },
    { step: 3, label: 'Lesson',        value: data.lesson },
    { step: 4, label: 'Setting',       value: data.setting },
    { step: 4, label: 'Companions',    value: companions },
    { step: 5, label: 'Art style',     value: data.art_style },
    { step: 5, label: 'Length',        value: data.length },
    { step: 6, label: 'Writing voice', value: data.writing_style ? WRITING_STYLE_VOICES[data.writing_style].label : '—' },
    { step: 6, label: 'Tone',          value: data.tone ? TONE_META[data.tone].label : '—' },
  ]

  if (data.depth_modifiers && data.depth_modifiers.length > 0) {
    rows.push({
      step: 6,
      label: 'Depth',
      value: data.depth_modifiers.map((k) => DEPTH_MODIFIERS[k].label).join(', '),
    })
  }

  const ideaBits = [
    data.custom_plot_points,
    data.custom_subjects,
    data.custom_world_details,
    data.custom_special_object && `object: ${data.custom_special_object}`,
    data.surprise_me && 'surprise me',
  ].filter(Boolean) as string[]

  if (ideaBits.length > 0) {
    rows.push({ step: 7, label: 'Your ideas', value: ideaBits.join(' · ') })
  }

  return (
    <div>
      <StepHeader
        eyebrow="Last look"
        title="Ready to bring it to life?"
        description={`Here's ${name}'s story at a glance — tap "Edit" on any row to tweak it.`}
      />

      {/* Cover preview */}
      <div
        className="rounded-xl overflow-hidden mb-5 p-8 sm:p-10"
        style={{
          background:
            'linear-gradient(135deg, var(--story-apricot) 0%, var(--brand-tint) 50%, var(--story-rose) 100%)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="size-10 rounded-pill bg-white/70 backdrop-blur inline-flex items-center justify-center">
            <Sparkles className="size-4 text-brand" />
          </span>
          <p className="text-[11px] uppercase tracking-widest text-ink/70 font-semibold">A Storybook Studio Original</p>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
          {name} &amp; the {data.setting}
        </h2>
        <p className="mt-1 text-ink-soft text-sm">
          A {data.tone} {data.genre} story about {data.lesson?.toLowerCase()}.
        </p>
      </div>

      {/* Meta rows */}
      <div className="rounded-xl bg-surface-sunken/60 border border-border px-5 sm:px-6">
        {rows.map((r) => (
          <MetaRow key={`${r.label}-${r.step}`} row={r} onJump={onJump} />
        ))}
      </div>

      {/* Where to send the finished book — required */}
      <div className="mt-5 p-4 rounded-xl border border-brand-tint bg-brand-tint/25">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          label="Where should we send the finished book?"
          hint="We illustrate every page in the background — about 5–10 minutes — then email you the link. One email about this story. No newsletter, no list."
          placeholder="you@example.com"
          iconLeft={<Mail className="size-4" />}
          value={data.email ?? ''}
          onChange={(value) => onChange({ email: value })}
          error={data.email && !isValidEmail(data.email) ? 'That doesn’t look like an email address.' : undefined}
        />
        <EmailWhyStrip email={data.email} />
      </div>

      {/* Showcase opt-in */}
      <label className="mt-3 flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-raised cursor-pointer hover:bg-surface-sunken/40 transition-colors">
        <input
          type="checkbox"
          checked={!!data.feature_opt_in}
          onChange={(e) => onChange({ feature_opt_in: e.target.checked })}
          className="mt-0.5 size-4 rounded border-border accent-[color:var(--brand)] cursor-pointer"
        />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] text-ink font-medium leading-snug">
            Feature this story as an example on our home page (optional)
          </span>
          <span className="mt-1 block text-sm text-ink-muted leading-snug">
            We&apos;ll occasionally rotate community-created stories into the landing-page showcase. Your story stays public either way.
          </span>
        </span>
      </label>

      <p className="mt-5 text-sm text-ink-muted text-center">
        Your book takes about 5–10 minutes to illustrate. We&apos;ll email it the moment it&apos;s ready — watching it come together is optional.
      </p>
    </div>
  )
}

function EmailWhyStrip({ email }: { email: string | undefined }) {
  const hasValid = !!email && isValidEmail(email)
  return (
    <div
      className={
        'mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors ' +
        (hasValid
          ? 'bg-[color:var(--story-sage)]/30 text-ink'
          : 'bg-[color:var(--story-apricot)]/30 text-ink')
      }
      role="status"
      aria-live="polite"
    >
      {hasValid ? (
        <>
          <Check className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span className="leading-snug">
            Your book will land in <strong className="font-semibold">{maskEmail(email!)}</strong> the moment it&apos;s ready — close the tab and go do something fun. You can still watch it come together if you like.
          </span>
        </>
      ) : (
        <>
          <Mail className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span className="leading-snug">
            We need this to deliver your book. Stories are built in the background and sent by email, so you don&apos;t have to wait with this tab open — handy, since a live render can stall the moment you navigate away.
          </span>
        </>
      )}
    </div>
  )
}

function maskEmail(email: string): string {
  const [user, domain] = email.trim().split('@')
  if (!user || !domain) return email
  if (user.length <= 1) return `${user}***@${domain}`
  return `${user[0]}***@${domain}`
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}
