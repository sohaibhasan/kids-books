'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, Copy, Printer, Share2 } from 'lucide-react'
import IconButton from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'

interface Props {
  title: string
}

export default function SharePopover({ title }: Props) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, url })
      } catch {}
    }
  }

  const print = () => window.print()

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <IconButton variant="glass" label="Share" icon={<Share2 />} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={10}
          className={cn(
            'z-40 w-64 p-1.5 rounded-md bg-surface-raised border border-border shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          )}
        >
          <button
            onClick={copy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink hover:bg-brand-tint hover:text-brand-deep transition-colors"
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={nativeShare}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink hover:bg-brand-tint hover:text-brand-deep transition-colors"
            >
              <Share2 className="size-4" />
              Share via…
            </button>
          )}
          <button
            onClick={print}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink hover:bg-brand-tint hover:text-brand-deep transition-colors"
          >
            <Printer className="size-4" />
            Print
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
