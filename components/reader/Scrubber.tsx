'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Page {
  page_number: number
  type?: string
  illustration_url: string
}

interface Props {
  pages: Page[]
  current: number
  onSelect: (i: number) => void
}

export default function Scrubber({ pages, current, onSelect }: Props) {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white/12 backdrop-blur-md rounded-pill px-3 py-2.5 flex items-center gap-1.5 border border-white/10">
        {pages.map((p, i) => {
          const active = i === current
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              aria-label={`Page ${i + 1}`}
              className={cn(
                'group relative h-2 rounded-pill transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                active ? 'w-7 bg-white' : 'w-2 bg-white/30 hover:bg-white/60',
              )}
            >
              {/* Hover thumbnail (desktop) */}
              {p.illustration_url && (
                <span className="hidden sm:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="block size-16 rounded-md overflow-hidden border border-white/20 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.illustration_url} alt="" className="w-full h-full object-cover" />
                  </span>
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="scrubber-active"
                  className="absolute inset-0 rounded-pill bg-white"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
