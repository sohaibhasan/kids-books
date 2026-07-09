'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'

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
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="p-6 sm:p-8">
        {/* X close button — Radix DialogClose calls onOpenChange(false) automatically */}
        <DialogClose
          className="absolute top-4 right-4 size-8 rounded-md text-ink-soft hover:text-ink hover:bg-ink/5 inline-flex items-center justify-center"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogClose>

        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand font-numeral mb-3">
          <Sparkles className="size-3.5" />
          You loved your first story
        </div>

        <DialogTitle className="mb-2">Make more, anytime</DialogTitle>

        <DialogDescription className="mb-6">
          Pick a credit pack — no account, no subscription. We&apos;ll email you a recovery link
          so your credits move with you across devices.
        </DialogDescription>

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
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Not now
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
