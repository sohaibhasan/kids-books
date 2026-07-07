'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Page {
  page_number: number
  type?: string
  illustration_url: string
}

interface Props {
  pages: Page[]
  current: number
  pageLabel: string
  onSelect: (i: number) => void
  onPrev: () => void
  onNext: () => void
  atStart: boolean
  atEnd: boolean
}

export default function ReaderNav({
  pages,
  current,
  pageLabel,
  onSelect,
  onPrev,
  onNext,
  atStart,
  atEnd,
}: Props) {
  return (
    <nav
      aria-label="Story navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
    >
      <div className="flex items-center gap-1 rounded-pill bg-night-soft/95 backdrop-blur-md border border-white/15 shadow-xl px-2 py-2">
        <button
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          disabled={atStart}
          className={cn(
            'inline-flex size-10 items-center justify-center rounded-pill text-white transition-colors',
            'hover:bg-white/15',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
            'disabled:text-white/25 disabled:hover:bg-transparent',
          )}
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Dots (sm+) */}
        <div className="hidden sm:flex items-center gap-1.5 px-1">
          {pages.map((p, i) => {
            const active = i === current
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'group relative h-2 rounded-pill transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                  active ? 'w-7 bg-white' : 'w-2 bg-white/30 hover:bg-white/60',
                )}
              >
                {/* Hover thumbnail (desktop) */}
                {p.illustration_url && (
                  <span className="hidden sm:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* relative + explicit block size give next/image a positioned context for fill */}
                    <span className="relative block size-16 rounded-md overflow-hidden border border-white/20 shadow-lg">
                      <Image
                        src={p.illustration_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
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

        {/* Compact label (mobile) */}
        <span className="sm:hidden px-3 text-xs font-medium text-white/80 tabular-nums whitespace-nowrap">
          {pageLabel}
        </span>

        <button
          type="button"
          aria-label="Next page"
          onClick={onNext}
          disabled={atEnd}
          className={cn(
            'inline-flex size-10 items-center justify-center rounded-pill text-white transition-colors',
            'hover:bg-white/15',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
            'disabled:text-white/25 disabled:hover:bg-transparent',
          )}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </nav>
  )
}
