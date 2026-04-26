'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline-brand' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand text-white shadow-md hover:bg-brand-deep hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
  secondary:
    'bg-surface-raised text-ink border border-border shadow-sm hover:border-ink-muted hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
  accent:
    'bg-accent text-ink shadow-md hover:brightness-95 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
  ghost:
    'bg-transparent text-ink-soft hover:text-ink hover:bg-ink/5',
  'outline-brand':
    'bg-transparent text-brand border-2 border-brand hover:bg-brand-tint',
  danger:
    'bg-danger text-white shadow-md hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-md',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-md',
  lg: 'h-12 px-6 text-base gap-2 rounded-lg',
  xl: 'h-14 px-8 text-lg gap-2.5 rounded-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    disabled,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-semibold tracking-tight whitespace-nowrap select-none',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-tint',
        'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
    </button>
  )
})

export default Button
