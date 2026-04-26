'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface ProgressProps {
  value: number
  max?: number
  shimmer?: boolean
  className?: string
  tone?: 'brand' | 'accent' | 'success'
  ariaLabel?: string
}

export default function Progress({
  value,
  max = 100,
  shimmer = false,
  className,
  tone = 'brand',
  ariaLabel,
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const fill = tone === 'brand' ? 'bg-brand' : tone === 'accent' ? 'bg-accent' : 'bg-success'

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={ariaLabel}
      className={cn('relative w-full h-1.5 bg-border rounded-pill overflow-hidden', className)}
    >
      <motion.div
        className={cn('absolute inset-y-0 left-0 rounded-pill', fill)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        {shimmer && pct > 0 && pct < 100 && (
          <span className="absolute inset-0 shimmer rounded-pill" />
        )}
      </motion.div>
    </div>
  )
}
