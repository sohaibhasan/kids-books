'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowRight, Info, RefreshCcw, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import Progress from '@/components/ui/Progress'
import { thumbReveal } from '@/lib/motion'

interface PageThumb {
  page: number
  url?: string
}

type Phase = 'text' | 'images'

interface ProgressState {
  done: boolean
  current: number
  total: number
  errors: number
  success: number
  errorMessage: string
  thumbs: PageThumb[]
}

interface TextProgressState {
  completed: number
  total: number
}

const ROTATING_COPY_TEXT = [
  'Outlining the arc…',
  'Choosing the opening line…',
  'Writing the next page…',
  'Polishing the ending…',
  'Naming the lesson…',
]

const ROTATING_COPY_IMAGES = [
  'Sketching the cover…',
  'Mixing colors…',
  'Drawing the hero…',
  'Adding tiny details…',
  'Coloring this page in…',
  'Painting the background…',
  'A touch of magic…',
]

const MAX_AUTO_RETRIES = 2
const TEXT_PHASE_WEIGHT = 0.30
const FORM_STASH_PREFIX = 'kb_wizard_form_'

export default function GeneratingPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const startsInTextPhase = searchParams.get('phase') === 'text'

  const [phase, setPhase] = useState<Phase>(startsInTextPhase ? 'text' : 'images')
  const [textProgress, setTextProgress] = useState<TextProgressState>({ completed: 0, total: 0 })
  const [state, setState] = useState<ProgressState>({
    done: false, current: 0, total: 0, errors: 0, success: 0, errorMessage: '', thumbs: [],
  })
  const [storyTitle, setStoryTitle] = useState('')
  const [status, setStatus] = useState<'generating' | 'error'>('generating')
  const [copyIdx, setCopyIdx] = useState(0)
  const [imagesRetryKey, setImagesRetryKey] = useState(0)
  const startRef = useRef<number>(Date.now())
  const autoRetryRef = useRef(0)

  const rotating = phase === 'text' ? ROTATING_COPY_TEXT : ROTATING_COPY_IMAGES

  // Title (available once the text-gen has inserted the row, OR from sessionStorage / fallback)
  useEffect(() => {
    if (storyTitle) return
    fetch(`/generated/${slug}/story.json`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.title) setStoryTitle(d.title) })
      .catch(() => {})
  }, [slug, storyTitle, phase])

  // Rotating copy
  useEffect(() => {
    const id = setInterval(() => setCopyIdx((i) => (i + 1) % rotating.length), 3500)
    return () => clearInterval(id)
  }, [rotating.length])
  useEffect(() => { setCopyIdx(0) }, [phase])

  // === TEXT PHASE: POST the form to /api/stories and consume SSE from the body ===
  useEffect(() => {
    if (phase !== 'text') return
    let cancelled = false
    const stashKey = `${FORM_STASH_PREFIX}${slug}`
    const raw = sessionStorage.getItem(stashKey)
    if (!raw) {
      // No form in session — likely a direct visit or refresh. Fall through to image phase
      // (server may already have created the row on a previous attempt).
      setPhase('images')
      return
    }

    const run = async () => {
      try {
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: JSON.parse(raw), slug }),
        })
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || `Story write failed (${res.status})`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!cancelled) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // Parse SSE frames (data: ...\n\n)
          let frameEnd
          while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, frameEnd)
            buffer = buffer.slice(frameEnd + 2)
            for (const line of frame.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const data = JSON.parse(line.slice(6))
              if (data.type === 'text-progress') {
                setTextProgress({ completed: data.completed, total: data.total })
              } else if (data.type === 'text-done') {
                if (data.title) setStoryTitle(data.title)
                sessionStorage.removeItem(stashKey)
                setPhase('images')
                return
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Story writer error')
              }
            }
          }
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setState((p) => ({ ...p, errorMessage: message }))
        setStatus('error')
      }
    }

    void run()
    return () => { cancelled = true }
  }, [phase, slug])

  // === IMAGES PHASE: existing SSE EventSource flow, unchanged behavior ===
  useEffect(() => {
    if (phase !== 'images') return
    let cancelled = false
    let currentEs: EventSource | null = null
    let doneArrived = false
    startRef.current = Date.now()

    const open = () => {
      if (cancelled) return
      const es = new EventSource(`/api/stories/${slug}/images`)
      currentEs = es

      es.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'start') {
          setState((p) => ({
            ...p,
            total: data.total,
            thumbs: p.thumbs.length === data.total
              ? p.thumbs
              : Array.from({ length: data.total }, (_, i) => ({ page: i })),
          }))
        } else if (data.type === 'progress') {
          setState((p) => {
            const thumbs = p.thumbs.map((t) =>
              t.page === data.page ? { ...t, url: data.url as string | undefined } : t,
            )
            return { ...p, current: p.current + 1, thumbs }
          })
        } else if (data.type === 'error') {
          setState((p) => ({
            ...p,
            errors: p.errors + 1,
            current: p.current + 1,
            errorMessage: p.errorMessage || data.message || 'Unknown error',
          }))
        } else if (data.type === 'done') {
          doneArrived = true
          const success = data.success ?? 0
          setState((p) => ({ ...p, done: true, success }))
          es.close()
          if (success > 0) setTimeout(() => router.push(`/read/${slug}`), 900)
        }
      }

      es.onerror = async () => {
        if (doneArrived || cancelled) {
          es.close()
          return
        }
        es.close()

        try {
          const res = await fetch(`/api/stories/${slug}/status`, { cache: 'no-store' })
          if (res.ok) {
            const body = await res.json()
            if (body.images_done) {
              router.push(`/read/${slug}`)
              return
            }
          }
        } catch { /* fall through to retry */ }

        if (autoRetryRef.current < MAX_AUTO_RETRIES) {
          autoRetryRef.current += 1
          setTimeout(() => { if (!cancelled) open() }, 800)
        } else {
          setStatus('error')
        }
      }
    }

    open()
    return () => {
      cancelled = true
      currentEs?.close()
    }
  }, [phase, slug, router, imagesRetryKey])

  const imagePct = state.total > 0 ? Math.round((state.current / state.total) * 100) : 0
  const textPct = textProgress.total > 0
    ? Math.round((textProgress.completed / textProgress.total) * 100)
    : 0
  // Combined bar: text phase fills 0→30%, image phase fills 30→100%.
  const combinedPct = phase === 'text'
    ? Math.round(textPct * TEXT_PHASE_WEIGHT)
    : Math.round(TEXT_PHASE_WEIGHT * 100 + imagePct * (1 - TEXT_PHASE_WEIGHT))

  const allFailed = phase === 'images' && state.done && state.success === 0 && state.total > 0

  const eta = useMemo(() => {
    if (phase !== 'images' || state.current === 0 || state.total === 0) return null
    const elapsed = (Date.now() - startRef.current) / 1000
    const perPage = elapsed / state.current
    const remaining = Math.round(perPage * (state.total - state.current))
    if (remaining <= 0) return null
    if (remaining < 60) return `~${remaining}s left`
    return `~${Math.ceil(remaining / 60)} min left`
  }, [phase, state.current, state.total])

  if (status === 'error' || allFailed) {
    return <ErrorState message={state.errorMessage} total={state.total} onRetry={() => {
      autoRetryRef.current = 0
      setStatus('generating')
      setState({ done: false, current: 0, total: 0, errors: 0, success: 0, errorMessage: '', thumbs: [] })
      // Text-phase failure has no row to recover; jump straight to images so a manual recovery
      // can pick up if the row exists from a prior partial attempt.
      setPhase('images')
      setImagesRetryKey((k) => k + 1)
    }} />
  }

  const eyebrow = phase === 'text' ? 'Writing your story' : (state.done ? 'Story ready' : 'Creating your story')
  const headline = phase === 'text'
    ? (storyTitle || 'Your story, page by page.')
    : (storyTitle || 'Your story, page by page.')

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 h-14 flex items-center">
          <Link href="/" className="font-display text-lg text-ink tracking-tight">
            Storybook<span className="text-brand">.</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-5 sm:px-8 py-10 md:py-16">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-3 h-7 rounded-pill bg-brand-tint text-brand-deep text-xs font-semibold uppercase tracking-wide">
            <Sparkles className="size-3.5" />
            {eyebrow}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl text-ink leading-tight">{headline}</h1>

          <div className="mt-6 h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${phase}-${rotating[copyIdx]}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-ink-soft"
              >
                {state.done ? '✓ All illustrations are ready.' : rotating[copyIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Single combined progress bar — text phase fills 0-30%, image phase 30-100% */}
        <div className="mt-10 max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-ink-soft">
              {phase === 'text'
                ? 'Writing the story…'
                : `${state.current} of ${state.total || '…'} pages illustrated`}
            </span>
            <span className="text-ink-muted font-numeral">{combinedPct}%{eta ? ` · ${eta}` : ''}</span>
          </div>
          <Progress value={combinedPct} shimmer={!state.done} />
        </div>

        {/* Thumbnails — only after text phase finishes */}
        {phase === 'images' && state.thumbs.length > 0 && (
          <div className="mt-12 grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
            {state.thumbs.map((t) => (
              <div
                key={t.page}
                className="relative aspect-square rounded-lg bg-surface-sunken border border-border overflow-hidden"
              >
                <AnimatePresence>
                  {t.url && (
                    <motion.img
                      key={t.url}
                      src={t.url}
                      alt=""
                      variants={thumbReveal}
                      initial="hidden"
                      animate="show"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </AnimatePresence>
                {!t.url && (
                  <div className="absolute inset-0 shimmer" aria-hidden />
                )}
                <span className="absolute bottom-1 right-1.5 text-[10px] font-numeral text-ink-muted bg-white/70 backdrop-blur rounded-pill px-1.5">
                  {t.page + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {state.done && state.success > 0 && (
          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={() => router.push(`/read/${slug}`)}
              iconRight={<ArrowRight className="size-4" />}
            >
              Open the book
            </Button>
          </div>
        )}

        <div className="mt-12 mx-auto max-w-md text-center">
          <p className="inline-flex items-center gap-2 text-xs text-ink-muted">
            <Info className="size-3.5" />
            Each page is illustrated individually. Keep this tab open.
          </p>
        </div>
      </main>
    </div>
  )
}

function ErrorState({ message, total, onRetry }: { message: string; total: number; onRetry: () => void }) {
  const router = useRouter()
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-pill bg-danger/10 text-danger mb-5">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="font-display text-3xl text-ink leading-tight">Something went sideways.</h1>
        <p className="mt-3 text-ink-soft">
          {total > 0
            ? `We lost the connection while drawing your ${total}-page story. A retry usually picks up where we left off.`
            : 'We hit an error before any pages were drawn. Tap retry to try again.'}
        </p>
        <p className="mt-3 inline-block rounded-md bg-brand-tint/60 px-3 py-1.5 text-sm text-brand-deep">
          No worries — failed attempts don&apos;t count against your quota.
        </p>
        {message && (
          <details className="mt-5 text-left">
            <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink">Show details</summary>
            <pre className="mt-2 p-3 rounded-md bg-surface-sunken text-xs text-ink-soft whitespace-pre-wrap break-words">
              {message.slice(0, 400)}
            </pre>
          </details>
        )}
        <div className="mt-7 flex gap-3 justify-center">
          <Button variant="primary" onClick={onRetry} iconLeft={<RefreshCcw className="size-4" />}>
            Retry
          </Button>
          <Button variant="secondary" onClick={() => router.push('/wizard')}>
            Start over
          </Button>
        </div>
      </div>
    </div>
  )
}
