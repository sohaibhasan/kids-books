'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ImageOff, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import { readerPageVariants } from '@/lib/motion'
import ReaderChrome from './ReaderChrome'
import ReaderNav from './ReaderNav'
import SharePopover from './SharePopover'
import { useReadAloud } from './useReadAloud'

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
  const [direction, setDirection] = useState(1)
  const reduce = useReducedMotion()

  // Read-aloud "bedtime mode": while active, each finished utterance advances
  // to the next page and keeps reading. Manual navigation exits the mode.
  // Refs (not state) so goTo — captured in stale closures by the keyboard
  // effect and drag handlers — always sees the live values.
  const { supported: speechSupported, speaking, speak, stop } = useReadAloud()
  const readAloudRef = useRef(false)
  const autoAdvanceRef = useRef(false)

  const goTo = (idx: number) => {
    const target = Math.max(0, Math.min(idx, pages.length - 1))
    // Any human-initiated page turn stops read-aloud; auto-advance doesn't.
    if (!autoAdvanceRef.current && readAloudRef.current) {
      readAloudRef.current = false
      stop()
    }
    setDirection(target > current ? 1 : -1)
    setCurrent(target)
  }
  const next = () => goTo(current + 1)
  const prev = () => goTo(current - 1)

  const pageSpeechText = (p: Page) => (p.type === 'cover' ? title : p.text_content)

  const speakPage = (idx: number) => {
    const p = pages[idx]
    if (!p) return
    readAloudRef.current = true
    speak(pageSpeechText(p), () => {
      // Utterance finished naturally. Chain to the next page unless the mode
      // was exited (stop() cancels the utterance, so onEnd won't fire then —
      // this guard covers edge-ordering anyway).
      if (!readAloudRef.current) return
      const nextIdx = idx + 1
      if (nextIdx < pages.length) {
        autoAdvanceRef.current = true
        goTo(nextIdx)
        autoAdvanceRef.current = false
        speakPage(nextIdx)
      } else {
        readAloudRef.current = false
      }
    })
  }

  const handleSpeakToggle = () => {
    if (readAloudRef.current || speaking) {
      readAloudRef.current = false
      stop()
    } else {
      // iOS requires the first speak() inside a user gesture — this tap is it.
      speakPage(current)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  // Preload adjacent pages into the browser cache via the same /_next/image URLs
  // that next/image will request when the user turns the page. We construct the URL
  // manually so the browser cache warms the exact optimised variant (not the raw
  // Supabase URL, which is a different cache key). Width is computed from DPR so we
  // warm the correct srcset entry.
  useEffect(() => {
    const adjacent = [pages[current - 1], pages[current + 1]]
      .filter(Boolean)
      .filter((p) => p.illustration_url)
    if (!adjacent.length) return

    const dpr = window.devicePixelRatio || 1
    // The illustration renders at up to 672 CSS px (max-w-2xl container).
    const needed = Math.round(672 * dpr)
    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    const w = widths.find((b) => b >= needed) ?? 3840

    adjacent.forEach((p) => {
      const img = new window.Image()
      img.src = `/_next/image?url=${encodeURIComponent(p.illustration_url)}&w=${w}&q=75`
    })
  }, [current, pages])

  const page = pages[current]
  if (!page) return null

  const isCover = page.type === 'cover'
  const isEnd = page.type === 'end'
  const isStoryPage = (p: Page) => p.type !== 'cover' && p.type !== 'end'
  const storyPageCount = pages.filter(isStoryPage).length
  const storyPageIndex = pages.slice(0, current + 1).filter(isStoryPage).length

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

      <main className="relative min-h-dvh flex items-center justify-center px-4 sm:px-8 pt-20 pb-28">
        {/* Page area */}
        <div className="relative w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={current}
              custom={direction}
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
                <CoverLayout title={title} url={page.illustration_url} alt={`Cover illustration for “${title}”`} priority />
              ) : isEnd ? (
                <EndLayout text={page.text_content} url={page.illustration_url} alt={`Closing illustration for “${title}”`} priority />
              ) : (
                <StoryLayout text={page.text_content} url={page.illustration_url} alt={`Illustration for page ${page.page_number} of “${title}”`} priority />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ReaderNav
        pages={pages}
        current={current}
        pageLabel={pageLabel}
        onSelect={goTo}
        onPrev={prev}
        onNext={next}
        atStart={current === 0}
        atEnd={current === pages.length - 1}
        speaking={speaking}
        onSpeakToggle={speechSupported ? handleSpeakToggle : undefined}
      />
    </div>
  )
}

function PageIllustration({ url, alt, className, priority }: { url: string; alt: string; className?: string; priority?: boolean }) {
  const [errored, setErrored] = useState(false)
  if (errored || !url) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`w-full aspect-square bg-surface-sunken flex flex-col items-center justify-center text-ink-muted gap-2 ${className ?? ''}`}
      >
        <ImageOff className="size-8" aria-hidden />
        <span className="text-xs">Illustration missing</span>
      </div>
    )
  }
  // Wrapper gives next/image a positioned, aspect-square context for `fill`.
  // className (e.g. opacity-90 from EndLayout) is forwarded to the wrapper so
  // the visual effect is identical to applying it directly on the <img>.
  //
  // sizes: the illustration lives inside max-w-2xl (672px) with px-4 sm:px-8
  // padding on <main>. It hits the 672px cap at 672 + 2×32 = 736px viewport.
  return (
    <div className={`relative w-full aspect-square ${className ?? ''}`}>
      <Image
        src={url}
        alt={alt}
        fill
        priority={priority}
        onError={() => setErrored(true)}
        className="object-cover"
        sizes="(min-width: 736px) 672px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 32px)"
      />
    </div>
  )
}

function CoverLayout({ title, url, alt, priority }: { title: string; url: string; alt?: string; priority?: boolean }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl bg-night-soft">
      <div className="relative">
        <PageIllustration url={url} alt={alt || `Cover illustration for ${title}`} priority={priority} />
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

function StoryLayout({ text, url, alt, priority }: { text: string; url: string; alt?: string; priority?: boolean }) {
  return (
    <article className="rounded-xl overflow-hidden bg-surface-raised text-ink shadow-xl" aria-live="polite">
      <PageIllustration url={url} alt={alt || 'Story illustration'} priority={priority} />
      <div className="px-6 py-7 sm:px-10 sm:py-10 font-display text-[18px] sm:text-[19px] leading-[1.75] text-ink space-y-4 max-w-[60ch] mx-auto">
        {text.split('\n\n').map((para, i) => (
          <p key={i} className={i === 0 ? 'drop-cap' : ''}>{para}</p>
        ))}
      </div>
    </article>
  )
}

function EndLayout({ text, url, alt, priority }: { text: string; url: string; alt?: string; priority?: boolean }) {
  const lines = text.split('\n').filter((l) => l.trim())
  return (
    <div className="rounded-xl overflow-hidden bg-night-soft text-white shadow-xl">
      <PageIllustration url={url} alt={alt || 'Closing illustration'} className="opacity-90" priority={priority} />
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
