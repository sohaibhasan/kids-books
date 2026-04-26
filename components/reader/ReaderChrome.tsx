'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Props {
  pageLabel: string
  share: React.ReactNode
}

export default function ReaderChrome({ pageLabel, share }: Props) {
  const [visible, setVisible] = useState(true)

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
        <div className={cn('pointer-events-auto', !visible && 'pointer-events-none')}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-pill bg-white/12 backdrop-blur-md text-white/90 text-sm hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
        <p className="text-xs uppercase tracking-widest text-white/70 font-numeral pointer-events-none">
          {pageLabel}
        </p>
        <div className={cn('pointer-events-auto', !visible && 'pointer-events-none')}>{share}</div>
      </div>
    </motion.header>
  )
}
