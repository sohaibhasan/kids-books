'use client'

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  hint?: string
  error?: string
  iconLeft?: ReactNode
  onChange?: (value: string) => void
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, iconLeft, onChange, className, id, ...rest },
  ref,
) {
  const reactId = useId()
  const inputId = id ?? reactId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'w-full bg-surface-raised text-ink text-[15px]',
            'rounded-md border border-border',
            'px-4 py-3 min-h-12',
            'placeholder:text-ink-muted',
            'transition-all duration-150 ease-out',
            'focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-tint',
            'disabled:opacity-50 disabled:bg-surface-sunken',
            iconLeft && 'pl-10',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className,
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export default Input
