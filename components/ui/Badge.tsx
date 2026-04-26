import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'info' | 'soft'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink/8 text-ink',
  brand:   'bg-brand-tint text-brand-deep',
  accent:  'bg-accent-tint text-ink',
  success: 'bg-success/15 text-success',
  info:    'bg-info/15 text-info',
  soft:    'bg-surface-sunken text-ink-soft',
}

export default function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
