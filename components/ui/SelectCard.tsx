'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toneSelected, toneCheck, type SelectCardTone } from '@/lib/wizard-options'

// Re-export for backward compatibility
export type { SelectCardTone }

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
