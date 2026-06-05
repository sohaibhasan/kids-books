'use client'

import { forwardRef, TextareaHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string
  hint?: string
  error?: string
  onChange?: (value: string) => void
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, onChange, className, id, rows = 3, ...rest },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'w-full bg-surface-raised text-ink text-[15px] resize-none',
          'rounded-md border border-border px-4 py-3',
          'placeholder:text-ink-muted',
          'transition-all duration-150 ease-out',
          'focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-tint',
          'disabled:opacity-50 disabled:bg-surface-sunken',
          error && 'border-danger focus:border-danger focus:ring-danger/15',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export default Textarea
