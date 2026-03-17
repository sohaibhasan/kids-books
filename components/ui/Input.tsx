'use client'

interface InputProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number'
  placeholder?: string
  hint?: string
  min?: number
  max?: number
}

export default function Input({ label, value, onChange, type = 'text', placeholder, hint, min, max }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-semibold text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-4 py-3 rounded-xl border-4 border-ink bg-white text-ink text-base font-medium
                   focus:outline-none focus:border-primary shadow-[3px_3px_0_#1a1a1a]
                   placeholder:text-ink/30"
      />
      {hint && <p className="text-sm text-ink/50">{hint}</p>}
    </div>
  )
}
