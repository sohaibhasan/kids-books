'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, X } from 'lucide-react'
import Button from '@/components/ui/Button'

export interface PaywallPack {
  id: string
  credits: number
  label: string
  price: string
}

interface Props {
  open: boolean
  packs: PaywallPack[]
  onClose: () => void
}

export default function PaywallModal({ open, packs, onClose }: Props) {
  const [pendingPack, setPendingPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const buy = async (pack: string) => {
    setError(null)
    setPendingPack(pack)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.url) throw new Error(body.error || `Checkout failed (${res.status})`)
      window.location.href = body.url
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPendingPack(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative bg-surface-raised rounded-xl shadow-xl max-w-md w-full p-6 sm:p-8"
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 size-8 rounded-md text-ink-soft hover:text-ink hover:bg-ink/5 inline-flex items-center justify-center"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand font-numeral mb-3">
              <Sparkles className="size-3.5" />
              You loved your first story
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-ink mb-2">Make more, anytime</h2>
            <p className="text-ink-soft text-sm mb-6">
              Pick a credit pack — no account, no subscription. We&apos;ll email you a recovery link
              so your credits move with you across devices.
            </p>

            <div className="grid gap-3">
              {packs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => buy(p.id)}
                  disabled={pendingPack !== null}
                  className="text-left rounded-lg border border-border hover:border-brand bg-surface px-4 py-4 flex items-center justify-between transition-all disabled:opacity-60"
                >
                  <div>
                    <div className="font-semibold text-ink">{p.label}</div>
                    <div className="text-xs text-ink-muted font-numeral">
                      {p.price} · {(parseFloat(p.price.replace(/[^0-9.]/g, '')) / p.credits).toFixed(2)} per story
                    </div>
                  </div>
                  <div className="text-brand font-semibold">
                    {pendingPack === p.id ? 'Loading…' : 'Buy →'}
                  </div>
                </button>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-danger">{error}</p>}

            <p className="mt-5 text-xs text-ink-soft text-center">
              Failed generations are automatically refunded — you only pay for stories you actually receive.
            </p>
            <p className="mt-2 text-xs text-ink-muted text-center">
              Secure checkout via Stripe.
            </p>
            <div className="mt-2 text-center">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Not now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
