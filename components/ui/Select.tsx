'use client'

import { useId } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label?: string
  hint?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  disabled?: boolean
  id?: string
}

export default function Select({
  label,
  hint,
  placeholder = 'Select…',
  value,
  onChange,
  options,
  disabled,
  id,
}: SelectProps) {
  const reactId = useId()
  const selectId = id ?? reactId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <SelectPrimitive.Root value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={selectId}
          className={cn(
            'inline-flex items-center justify-between gap-2 w-full',
            'min-h-12 px-4 text-[15px] text-ink',
            'bg-surface-raised border border-border rounded-md',
            'transition-all duration-150 ease-out',
            'focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-tint',
            'data-[placeholder]:text-ink-muted',
            'disabled:opacity-50',
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="size-4 text-ink-muted" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className={cn(
              'z-50 min-w-[var(--radix-select-trigger-width)] max-h-72',
              'bg-surface-raised border border-border rounded-md shadow-lg',
              'overflow-hidden',
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2 text-[14px] text-ink rounded-sm',
                    'cursor-pointer select-none outline-none',
                    'data-[highlighted]:bg-brand-tint data-[highlighted]:text-brand-deep',
                    'data-[state=checked]:font-semibold',
                  )}
                >
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" strokeWidth={3} />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </div>
  )
}
