'use client'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

const styles = {
  base: 'inline-flex items-center justify-center font-bold rounded-xl border-4 border-ink transition-all active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-accent text-ink hover:bg-accent-dark',
  ghost: 'bg-white text-ink hover:bg-gray-50 border-ink/40',
  sm: 'text-sm px-4 py-2 gap-1',
  md: 'text-base px-6 py-3 gap-2',
  lg: 'text-lg px-8 py-4 gap-2',
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
}: ButtonProps) {
  const shadow = disabled ? '' : variant === 'secondary'
    ? 'shadow-[4px_4px_0_#1a1a1a]'
    : 'shadow-[4px_4px_0_#ffd700]'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.base} ${styles[variant]} ${styles[size]} ${shadow} ${className}`}
    >
      {children}
    </button>
  )
}
