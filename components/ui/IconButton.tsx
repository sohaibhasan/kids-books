'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'solid' | 'soft' | 'ghost' | 'glass'
type Size = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  label: string
  icon: ReactNode
}

const variantClasses: Record<Variant, string> = {
  solid: 'bg-ink text-white hover:bg-ink/85',
  soft:  'bg-surface-sunken text-ink hover:bg-border',
  ghost: 'bg-transparent text-ink-soft hover:bg-ink/5 hover:text-ink',
  glass: 'bg-white/12 text-white backdrop-blur-md hover:bg-white/20',
}

const sizeClasses: Record<Size, { box: string; icon: string }> = {
  sm: { box: 'size-9',  icon: '[&>svg]:size-4' },
  md: { box: 'size-11', icon: '[&>svg]:size-5' },
  lg: { box: 'size-12', icon: '[&>svg]:size-5' },
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'soft', size = 'md', label, icon, className, type = 'button', ...rest },
  ref,
) {
  const s = sizeClasses[size]
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-pill',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-tint',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        s.box,
        s.icon,
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
})

export default IconButton
