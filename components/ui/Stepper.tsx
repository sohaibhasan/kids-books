'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface StepperProps {
  current: number
  total: number
  labels?: string[]
  className?: string
}

export default function Stepper({ current, total, labels, className }: StepperProps) {
  const pct = (current / total) * 100

  return (
    <div className={cn('w-full', className)}>
      {labels && (
        <div className="hidden sm:flex justify-between mb-2">
          {labels.slice(0, total).map((label, i) => {
            const step = i + 1
            const isActive = step === current
            const isDone   = step < current
            return (
              <span
                key={label}
                className={cn(
                  'text-[11px] uppercase tracking-wide font-semibold transition-colors',
                  isActive ? 'text-brand' : isDone ? 'text-ink-soft' : 'text-ink-muted',
                )}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}
      <div className="relative h-1.5 bg-border rounded-pill overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-brand rounded-pill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        />
      </div>
      <p className="sm:hidden mt-2 text-xs font-numeral text-ink-muted">
        Step {current} of {total}
      </p>
    </div>
  )
}
