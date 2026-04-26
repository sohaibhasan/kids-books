'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectCardTone =
  | 'brand'
  | 'rose'
  | 'sage'
  | 'apricot'
  | 'sky'
  | 'lavender'
  | 'accent'

export interface SelectCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  icon?: ReactNode
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  tone?: SelectCardTone
  multi?: boolean
}

const toneSelected: Record<SelectCardTone, string> = {
  brand:    'bg-brand-tint border-brand',
  rose:     'bg-[var(--story-rose)]/40 border-[var(--story-rose)]',
  sage:     'bg-[var(--story-sage)]/40 border-[var(--story-sage)]',
  apricot:  'bg-[var(--story-apricot)]/40 border-[var(--story-apricot)]',
  sky:      'bg-[var(--story-sky)]/40 border-[var(--story-sky)]',
  lavender: 'bg-[var(--story-lavender)]/40 border-[var(--story-lavender)]',
  accent:   'bg-accent-tint border-accent',
}

const toneCheck: Record<SelectCardTone, string> = {
  brand:    'bg-brand text-white',
  rose:     'bg-ink text-white',
  sage:     'bg-ink text-white',
  apricot:  'bg-ink text-white',
  sky:      'bg-ink text-white',
  lavender: 'bg-ink text-white',
  accent:   'bg-ink text-white',
}

export default function SelectCard({
  icon,
  label,
  description,
  selected,
  onClick,
  size = 'md',
  tone = 'brand',
  multi = false,
  className,
  ...rest
}: SelectCardProps) {
  const isSm = size === 'sm'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={multi ? selected : undefined}
      className={cn(
        'group relative flex flex-col items-center text-center',
        'rounded-lg border bg-surface-raised',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-tint',
        isSm ? 'px-3 py-3 gap-1.5 min-h-[88px]' : 'px-4 py-5 gap-2.5 min-h-[120px]',
        selected
          ? cn(toneSelected[tone], 'shadow-md border-2')
          : 'border-border shadow-sm hover:shadow-md hover:border-ink-muted hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    >
      {selected && (
        <span
          className={cn(
            'absolute top-2 right-2 size-5 rounded-full flex items-center justify-center',
            'shadow-sm',
            toneCheck[tone],
          )}
          aria-hidden
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      {icon && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full',
            isSm ? 'size-9 text-xl' : 'size-12 text-2xl',
            selected ? 'bg-white/70' : 'bg-surface-sunken group-hover:bg-surface',
            'transition-colors duration-200',
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <span className={cn('font-semibold text-ink leading-tight', isSm ? 'text-[13px]' : 'text-[15px]')}>
        {label}
      </span>
      {description && (
        <span className={cn('text-ink-soft leading-snug', isSm ? 'text-[11px]' : 'text-xs')}>
          {description}
        </span>
      )}
    </button>
  )
}
