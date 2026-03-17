'use client'

interface SelectCardProps {
  icon?: string
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

export default function SelectCard({ icon, label, description, selected, onClick, size = 'md' }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center text-center rounded-2xl border-4 transition-all
        ${size === 'sm' ? 'px-3 py-3 gap-1' : 'px-4 py-4 gap-2'}
        ${selected
          ? 'bg-accent border-ink shadow-[4px_4px_0_#1a1a1a] -translate-y-0.5'
          : 'bg-white border-ink/30 hover:border-ink hover:shadow-[3px_3px_0_#1a1a1a] hover:-translate-y-0.5'
        }
      `}
    >
      {selected && (
        <span className="absolute top-2 right-2 text-xs bg-ink text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
          ✓
        </span>
      )}
      {icon && <span className={size === 'sm' ? 'text-2xl' : 'text-3xl'}>{icon}</span>}
      <span className={`font-bold text-ink ${size === 'sm' ? 'text-sm' : 'text-base'}`}>{label}</span>
      {description && <span className="text-xs text-ink/60 leading-tight">{description}</span>}
    </button>
  )
}
