'use client'

import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'

type Status = 'loading' | 'ready' | 'printing'

export default function AutoPrint() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // Collect all <img> elements present in the server-rendered HTML.
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'))

      // Build a promise for each image that resolves when it loads (or errors).
      const imagePromises = imgs.map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>(resolve => {
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        })
      })

      // Race: wait for all images OR a 10-second safety cap.
      const cap = new Promise<void>(resolve => setTimeout(resolve, 10_000))
      await Promise.race([Promise.all(imagePromises), cap])

      if (cancelled) return

      setStatus('ready')
      // Small yield so React can flush the status update before the dialog
      // freezes the tab.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      if (cancelled) return

      setStatus('printing')
      window.print()
    }

    run().catch(() => {
      if (!cancelled) setStatus('ready')
    })

    return () => {
      cancelled = true
    }
  }, [])

  const handlePrint = () => window.print()

  // This bar is hidden in @media print via the Tailwind print:hidden variant.
  return (
    <div className="print:hidden sticky top-0 z-50 flex items-center justify-between gap-4 bg-surface-raised border-b border-border px-6 py-3 shadow-sm">
      <p className="text-sm text-ink-soft">
        {status === 'loading'
          ? 'Preparing your storybook for print…'
          : 'If the dialog did not open, press Cmd+P (Mac) or Ctrl+P (Windows).'}
      </p>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep transition-colors"
      >
        <Printer className="size-4" />
        Print / Save as PDF
      </button>
    </div>
  )
}
