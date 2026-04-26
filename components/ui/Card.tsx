import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'flat' | 'raised' | 'bordered'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantClasses: Record<Variant, string> = {
  flat:     'bg-surface-sunken',
  raised:   'bg-surface-raised shadow-md',
  bordered: 'bg-surface-raised border border-border',
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-6 md:p-8',
  lg:   'p-6 md:p-10',
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'raised', padding = 'md', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-xl', variantClasses[variant], paddingClasses[padding], className)}
      {...rest}
    >
      {children}
    </div>
  )
})

export default Card
