'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, BookMarked, Sun, Moon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { ReaderTheme } from './useReaderTheme'
import { glassPillClasses } from './useReaderTheme'

interface Props {
  pageLabel: string
  share: React.ReactNode
  theme: ReaderTheme
  onToggleTheme: () => void
}

export default function ReaderChrome({ pageLabel, share, theme, onToggleTheme }: Props) {
  const [visible, setVisible] = useState(true)
  const isDark = theme === 'night'

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const reset = () => {
      setVisible(true)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setVisible(false), 3500)
    }
    reset()
    window.addEventListener('mousemove', reset)
    window.addEventListener('touchstart', reset)
    window.addEventListener('keydown', reset)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('touchstart', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [])

  // Glass pill classes vary between night and day modes.
  const pillCls = glassPillClasses(theme)

  return (
    <motion.header
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -8 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-30',
        'pointer-events-none',
      )}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-8 pt-4 flex items-center justify-between gap-3">
        <div className={cn('flex items-center gap-2 pointer-events-auto', !visible && 'pointer-events-none')}>
          <Link
            href="/"
            className={cn('inline-flex items-center gap-1.5 px-3 h-9 rounded-pill text-sm transition-colors', pillCls)}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/stories"
            aria-label="My stories"
            className={cn('inline-flex items-center gap-1.5 px-3 h-9 rounded-pill text-sm transition-colors', pillCls)}
          >
            <BookMarked className="size-4" />
            <span className="hidden sm:inline">My stories</span>
          </Link>
        </div>
        <p className={cn('text-xs uppercase tracking-widest font-numeral pointer-events-none', isDark ? 'text-white/70' : 'text-ink-muted')}>
          {pageLabel}
        </p>
        <div className={cn('flex items-center gap-2 pointer-events-auto', !visible && 'pointer-events-none')}>
          {/* Night/day toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to day mode' : 'Switch to night mode'}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-pill text-sm transition-colors',
              pillCls,
            )}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {share}
        </div>
      </div>
    </motion.header>
  )
}
