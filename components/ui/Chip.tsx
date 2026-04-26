'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  label: string
  selected: boolean
  onClick: () => void
  icon?: ReactNode
}

export default function Chip({ label, selected, onClick, icon, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-2 px-4 h-10 rounded-pill',
        'text-sm font-medium select-none',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-tint',
        selected
          ? 'bg-brand text-white shadow-sm'
          : 'bg-surface-raised text-ink border border-border hover:border-ink-muted',
        className,
      )}
      {...rest}
    >
      {selected ? (
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      ) : (
        icon && <span className="inline-flex">{icon}</span>
      )}
      {label}
    </button>
  )
}
