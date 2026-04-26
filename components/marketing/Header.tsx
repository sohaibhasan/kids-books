'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-200',
        scrolled
          ? 'bg-surface/80 backdrop-blur-lg border-b border-border'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="size-8 rounded-pill bg-brand text-white inline-flex items-center justify-center text-base font-display font-semibold">
            S
          </span>
          <span className="font-display text-lg text-ink tracking-tight">
            Storybook<span className="text-brand">.</span>
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-ink-soft">
          <a href="#how" className="hover:text-ink transition-colors">How it works</a>
          <a href="#examples" className="hover:text-ink transition-colors">Examples</a>
          <Link
            href="/wizard"
            className="inline-flex items-center h-9 px-4 rounded-pill bg-ink text-white text-sm font-medium hover:bg-ink/85 transition-colors"
          >
            Create a story
          </Link>
        </nav>
        <Link
          href="/wizard"
          className="sm:hidden inline-flex items-center h-9 px-4 rounded-pill bg-ink text-white text-sm font-medium"
        >
          Start
        </Link>
      </div>
    </header>
  )
}
