'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import IconButton from '@/components/ui/IconButton'
import Button from '@/components/ui/Button'
import { readerPageVariants } from '@/lib/motion'
import ReaderChrome from './ReaderChrome'
import Scrubber from './Scrubber'
import SharePopover from './SharePopover'

interface Page {
  page_number: number
  type?: string
  text_content: string
  scene_description?: string
  illustration_url: string
}

interface Props {
  title: string
  pages: Page[]
  slug: string
}

export default function StoryReader({ title, pages }: Props) {
  const [current, setCurrent] = useState(0)
  const directionRef = useRef(1)
  const reduce = useReducedMotion()

  const goTo = (idx: number) => {
    const target = Math.max(0, Math.min(idx, pages.length - 1))
    directionRef.current = target > current ? 1 : -1
    setCurrent(target)
  }
  const next = () => goTo(current + 1)
  const prev = () => goTo(current - 1)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  const page = pages[current]
  if (!page) return null

  const isCover = page.type === 'cover'
  const isEnd = page.type === 'end'
  const storyPageCount = pages.filter((p) => !p.type).length
  const storyPageIndex = pages.slice(0, current + 1).filter((p) => !p.type).length

  const pageLabel = isCover ? 'Cover' : isEnd ? 'The End' : `Page ${storyPageIndex} of ${storyPageCount}`

  return (
    <div className="relative min-h-dvh bg-night text-white overflow-hidden">
      {/* Soft atmospheric blobs */}
      <div
        aria-hidden
        className="absolute -top-40 -left-40 size-[480px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-40 size-[480px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
      />

      <ReaderChrome pageLabel={pageLabel} share={<SharePopover title={title} />} />

      <main className="relative min-h-dvh flex items-center justify-center px-4 sm:px-8 py-20">
        {/* Prev / Next chevrons (desktop) */}
        <div className="hidden md:flex absolute left-4 inset-y-0 items-center z-20">
          <IconButton
            variant="glass"
            size="lg"
            label="Previous page"
            icon={<ChevronLeft />}
            onClick={prev}
            disabled={current === 0}
          />
        </div>
        <div className="hidden md:flex absolute right-4 inset-y-0 items-center z-20">
          <IconButton
            variant="glass"
            size="lg"
            label="Next page"
            icon={<ChevronRight />}
            onClick={next}
            disabled={current === pages.length - 1}
          />
        </div>

        {/* Page area */}
        <div className="relative w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={directionRef.current} initial={false}>
            <motion.div
              key={current}
              custom={directionRef.current}
              variants={readerPageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag={reduce ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) next()
                else if (info.offset.x > 80) prev()
              }}
              className="touch-pan-y"
            >
              {isCover ? (
                <CoverLayout title={title} url={page.illustration_url} alt={page.scene_description} />
              ) : isEnd ? (
                <EndLayout text={page.text_content} url={page.illustration_url} alt={page.scene_description} />
              ) : (
                <StoryLayout text={page.text_content} url={page.illustration_url} alt={page.scene_description} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile prev/next floats */}
        <div className="md:hidden fixed inset-x-4 bottom-20 flex justify-between z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <IconButton variant="glass" size="lg" label="Previous page" icon={<ChevronLeft />} onClick={prev} disabled={current === 0} />
          </div>
          <div className="pointer-events-auto">
            <IconButton variant="glass" size="lg" label="Next page" icon={<ChevronRight />} onClick={next} disabled={current === pages.length - 1} />
          </div>
        </div>
      </main>

      <Scrubber pages={pages} current={current} onSelect={goTo} />
    </div>
  )
}

function CoverLayout({ title, url, alt }: { title: string; url: string; alt?: string }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl bg-night-soft">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt || ''} className="w-full aspect-square object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 mb-3 px-3 h-7 rounded-pill bg-white/15 backdrop-blur text-white text-[11px] font-semibold uppercase tracking-widest">
            <Sparkles className="size-3.5" />
            A Storybook Studio Original
          </div>
          <h1 className="font-display text-3xl sm:text-5xl text-white leading-tight">{title}</h1>
        </div>
      </div>
    </div>
  )
}

function StoryLayout({ text, url, alt }: { text: string; url: string; alt?: string }) {
  return (
    <article className="rounded-xl overflow-hidden bg-surface-raised text-ink shadow-xl" aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt || ''} className="w-full aspect-square object-cover" />
      <div className="px-6 py-7 sm:px-10 sm:py-10 font-display text-[18px] sm:text-[19px] leading-[1.75] text-ink space-y-4 max-w-[60ch] mx-auto">
        {text.split('\n\n').map((para, i) => (
          <p key={i} className={i === 0 ? 'drop-cap' : ''}>{para}</p>
        ))}
      </div>
    </article>
  )
}

function EndLayout({ text, url, alt }: { text: string; url: string; alt?: string }) {
  const lines = text.split('\n').filter((l) => l.trim())
  return (
    <div className="rounded-xl overflow-hidden bg-night-soft text-white shadow-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt || ''} className="w-full aspect-square object-cover opacity-90" />
      <div className="px-6 py-10 text-center space-y-4">
        <p className="font-display text-4xl sm:text-5xl text-accent">{lines[0] || 'The End'}</p>
        {lines[1] && (
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{lines[1]}</p>
        )}
        {lines[2] && (
          <p className="font-display italic text-lg text-white/85 max-w-md mx-auto leading-relaxed">{lines[2]}</p>
        )}
        <div className="pt-4 flex gap-3 justify-center">
          <Link href="/wizard">
            <Button variant="accent" iconRight={<Sparkles className="size-4" />}>
              Write another
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
