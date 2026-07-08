'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReaderTheme } from './useReaderTheme'

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
  /** Whether read-aloud is currently active. Hidden when undefined (not supported). */
  speaking?: boolean
  /** Called when the user taps the read-aloud button. */
  onSpeakToggle?: () => void
  theme: ReaderTheme
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
  speaking,
  onSpeakToggle,
  theme,
}: Props) {
  const isDark = theme === 'night'

  // Chevron / speaker button base classes (text + hover + focus + disabled).
  const chevronCls = cn(
    'inline-flex size-10 items-center justify-center rounded-pill transition-colors',
    'focus-visible:outline-none focus-visible:ring-2',
    isDark
      ? 'text-white hover:bg-white/15 focus-visible:ring-white/60 disabled:text-white/25 disabled:hover:bg-transparent'
      : 'text-ink hover:bg-black/8 focus-visible:ring-ink/40 disabled:text-ink-muted disabled:hover:bg-transparent',
  )

  return (
    <nav
      aria-label="Story navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
    >
      <div className={cn(
        'flex items-center gap-1 rounded-pill backdrop-blur-md shadow-xl px-2 py-2',
        isDark
          ? 'bg-night-soft/95 border border-white/15'
          : 'bg-surface-raised/95 border border-border',
      )}>
        <button
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          disabled={atStart}
          className={chevronCls}
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
                  'focus-visible:outline-none focus-visible:ring-2',
                  isDark
                    ? 'focus-visible:ring-white/60'
                    : 'focus-visible:ring-ink/40',
                  active
                    ? isDark ? 'w-7 bg-white' : 'w-7 bg-ink'
                    : isDark ? 'w-2 bg-white/30 hover:bg-white/60' : 'w-2 bg-ink/30 hover:bg-ink/60',
                )}
              >
                {/* Hover thumbnail (desktop) */}
                {p.illustration_url && (
                  <span className="hidden sm:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* relative + explicit block size give next/image a positioned context for fill */}
                    <span className={cn(
                      'relative block size-16 rounded-md overflow-hidden shadow-lg',
                      isDark ? 'border border-white/20' : 'border border-border',
                    )}>
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
                    className={cn('absolute inset-0 rounded-pill', isDark ? 'bg-white' : 'bg-ink')}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Compact label (mobile) */}
        <span className={cn(
          'sm:hidden px-3 text-xs font-medium tabular-nums whitespace-nowrap',
          isDark ? 'text-white/80' : 'text-ink-soft',
        )}>
          {pageLabel}
        </span>

        <button
          type="button"
          aria-label="Next page"
          onClick={onNext}
          disabled={atEnd}
          className={chevronCls}
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Read aloud (hidden when speechSynthesis is unsupported) */}
        {onSpeakToggle && (
          <>
            <span
              aria-hidden
              className={cn('w-px h-5 mx-0.5', isDark ? 'bg-white/15' : 'bg-ink/15')}
            />
            <button
              type="button"
              aria-label={speaking ? 'Stop reading aloud' : 'Read this page aloud'}
              aria-pressed={speaking ? 'true' : 'false'}
              onClick={onSpeakToggle}
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-pill transition-colors',
                'focus-visible:outline-none focus-visible:ring-2',
                isDark
                  ? 'focus-visible:ring-white/60'
                  : 'focus-visible:ring-ink/40',
                speaking
                  ? isDark
                    ? 'text-accent bg-white/10 hover:bg-white/15'
                    : 'text-accent bg-black/10 hover:bg-black/15'
                  : isDark
                    ? 'text-white hover:bg-white/15'
                    : 'text-ink hover:bg-black/8',
              )}
            >
              {speaking ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
