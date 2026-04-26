'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

interface ProgressState {
  done: boolean
  current: number
  total: number
  errors: number
  success: number
  errorMessage: string
  thumbs: PageThumb[]
}

const ROTATING_COPY = [
  'Sketching the cover…',
  'Mixing colors…',
  'Drawing the hero…',
  'Adding tiny details…',
  'Coloring this page in…',
  'Painting the background…',
  'A touch of magic…',
]

export default function GeneratingPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const [state, setState] = useState<ProgressState>({
    done: false, current: 0, total: 0, errors: 0, success: 0, errorMessage: '', thumbs: [],
  })
  const [storyTitle, setStoryTitle] = useState('')
  const [status, setStatus] = useState<'generating' | 'error'>('generating')
  const [copyIdx, setCopyIdx] = useState(0)
  const startRef = useRef<number>(Date.now())

  // Title
  useEffect(() => {
    fetch(`/generated/${slug}/story.json`)
      .then((r) => r.json())
      .then((d) => setStoryTitle(d.title))
      .catch(() => {})
  }, [slug])

  // Rotating copy
  useEffect(() => {
    const id = setInterval(() => setCopyIdx((i) => (i + 1) % ROTATING_COPY.length), 3500)
    return () => clearInterval(id)
  }, [])

  // SSE
  useEffect(() => {
    const es = new EventSource(`/api/stories/${slug}/images`)
    startRef.current = Date.now()

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'start') {
        setState((p) => ({
          ...p,
          total: data.total,
          thumbs: Array.from({ length: data.total }, (_, i) => ({ page: i })),
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
        const success = data.success ?? 0
        setState((p) => ({ ...p, done: true, success }))
        es.close()
        if (success > 0) setTimeout(() => router.push(`/read/${slug}`), 900)
      }
    }

    es.onerror = () => {
      setStatus('error')
      es.close()
    }

    return () => es.close()
  }, [slug, router])

  const pct = state.total > 0 ? Math.round((state.current / state.total) * 100) : 0
  const allFailed = state.done && state.success === 0 && state.total > 0

  const eta = useMemo(() => {
    if (state.current === 0 || state.total === 0) return null
    const elapsed = (Date.now() - startRef.current) / 1000
    const perPage = elapsed / state.current
    const remaining = Math.round(perPage * (state.total - state.current))
    if (remaining <= 0) return null
    if (remaining < 60) return `~${remaining}s left`
    return `~${Math.ceil(remaining / 60)} min left`
  }, [state.current, state.total])

  if (status === 'error' || allFailed) {
    return <ErrorState message={state.errorMessage} total={state.total} onRetry={() => {
      setStatus('generating')
      setState({ done: false, current: 0, total: 0, errors: 0, success: 0, errorMessage: '', thumbs: [] })
    }} />
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Top bar */}
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
            {state.done ? 'Story ready' : 'Creating your story'}
          </div>
          {storyTitle ? (
            <h1 className="font-display text-3xl sm:text-5xl text-ink leading-tight">{storyTitle}</h1>
          ) : (
            <h1 className="font-display text-3xl sm:text-5xl text-ink leading-tight">
              Your story, page by page.
            </h1>
          )}

          <div className="mt-6 h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={ROTATING_COPY[copyIdx]}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-ink-soft"
              >
                {state.done ? '✓ All illustrations are ready.' : ROTATING_COPY[copyIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-10 max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-ink-soft">
              {state.current} of {state.total || '…'} pages
            </span>
            <span className="text-ink-muted font-numeral">{pct}%{eta ? ` · ${eta}` : ''}</span>
          </div>
          <Progress value={pct} shimmer={!state.done} />
        </div>

        {/* Thumbnails */}
        {state.thumbs.length > 0 && (
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
            ? `All ${total} illustrations failed to generate. We can try again — usually it works on a retry.`
            : 'Image generation hit an error before any pages were drawn.'}
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
