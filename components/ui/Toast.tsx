'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'info' | 'success' | 'error'

interface ToastItem {
  id: string
  title?: string
  description: string
  tone: ToastTone
  duration?: number
}

interface ToastContextValue {
  toast: (input: { title?: string; description: string; tone?: ToastTone; duration?: number }) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, { row: string; icon: ReactNode }> = {
  info:    { row: 'border-info/30',    icon: <Info className="size-5 text-info" /> },
  success: { row: 'border-success/30', icon: <CheckCircle2 className="size-5 text-success" /> },
  error:   { row: 'border-danger/30',  icon: <AlertCircle className="size-5 text-danger" /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastContextValue['toast']>((input) => {
    const id = Math.random().toString(36).slice(2)
    setItems((cur) => [...cur, { id, tone: 'info', ...input }])
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((t) => {
          const tone = toneStyles[t.tone]
          return (
            <ToastPrimitive.Root
              key={t.id}
              duration={t.duration}
              onOpenChange={(open) => { if (!open) dismiss(t.id) }}
              className={cn(
                'group pointer-events-auto relative flex items-start gap-3',
                'w-[calc(100vw-2rem)] sm:w-96 p-4 pr-10 rounded-lg',
                'bg-surface-raised shadow-lg border',
                'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-6',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-6',
                tone.row,
              )}
            >
              <span className="shrink-0 mt-0.5">{tone.icon}</span>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <ToastPrimitive.Title className="text-sm font-semibold text-ink">
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                <ToastPrimitive.Description className="text-sm text-ink-soft break-words">
                  {t.description}
                </ToastPrimitive.Description>
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss"
                className="absolute top-2.5 right-2.5 inline-flex items-center justify-center size-7 rounded-pill text-ink-muted hover:bg-ink/5 hover:text-ink"
              >
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport
          className="fixed top-4 right-4 z-50 flex flex-col gap-2 outline-none"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
