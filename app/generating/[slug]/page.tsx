'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowRight, Info, Mail, RefreshCcw, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import Progress from '@/components/ui/Progress'
import { thumbReveal } from '@/lib/motion'

interface StatusPage {
  page_number: number
  state: 'pending' | 'in_progress' | 'done' | 'failed'
  image_url: string | null
  attempt: number
  rewrites: number
}

interface StatusResponse {
  slug: string
  title: string | null
  status: 'pending' | 'generating_text' | 'generating_images' | 'complete' | 'failed'
  total_pages: number
  pages: StatusPage[]
  text_progress: { completed: number; total: number } | null
  email_will_be_sent: boolean
  email_address_masked: string | null
  last_progress_at: string | null
  failure_reason: string | null
  refunded: boolean
  images_done: boolean
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

const POLL_MS = 3000

export default function GeneratingPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const [snapshot, setSnapshot] = useState<StatusResponse | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)

  // 1s ticker drives both the rotating copy and the ETA estimate. We track
  // elapsed time (not absolute Date.now) so eta is derivable without any
  // ref access or impure call during render.
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      setElapsedMs(Date.now() - start)
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Polling loop. Stops the moment we land on a terminal state (complete /
  // failed / refunded) and redirects on success.
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const tick = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/stories/${slug}/status`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 404) {
            setFatal('We can\'t find this story. Try starting a new one.')
            return false
          }
          return true
        }
        const body = (await res.json()) as StatusResponse
        if (cancelled) return false
        setSnapshot(body)
        if (body.images_done || body.status === 'complete') {
          setTimeout(() => router.push(`/read/${slug}`), 900)
          return false
        }
        if (body.status === 'failed' || body.refunded) {
          return false
        }
        return true
      } catch {
        return true
      }
    }

    void (async () => {
      const keepGoing = await tick()
      if (!keepGoing || cancelled) return
      timer = setInterval(async () => {
        const cont = await tick()
        if (!cont && timer) {
          clearInterval(timer)
          timer = null
        }
      }, POLL_MS)
    })()

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [slug, router])

  // Rotating copy
  const phase: 'text' | 'images' =
    snapshot?.status === 'generating_images' || snapshot?.status === 'complete'
      ? 'images'
      : 'text'
  const rotating = phase === 'text' ? ROTATING_COPY_TEXT : ROTATING_COPY_IMAGES
  // Cycle every ~3.5s by sampling the 1s tick at /3.5 cadence. Phase swap
  // makes rotating.length change, which auto-rotates back into bounds.
  const copyIdx = Math.floor(tick / 3.5) % rotating.length

  // Derived progress
  const done = snapshot?.pages.filter(p => p.state === 'done').length ?? 0
  const total = snapshot?.total_pages ?? 0
  const imagePct = total > 0 ? Math.round((done / total) * 100) : 0
  const textPct = snapshot?.text_progress
    ? Math.round(
        (snapshot.text_progress.completed / Math.max(1, snapshot.text_progress.total)) * 100,
      )
    : phase === 'images'
      ? 100
      : 0
  const phasePct = phase === 'text' ? textPct : imagePct

  const eta = (() => {
    if (phase !== 'images' || done === 0 || total === 0) return null
    const elapsed = elapsedMs / 1000
    if (elapsed <= 0) return null
    const perPage = elapsed / done
    const remaining = Math.round(perPage * (total - done))
    if (remaining <= 0) return null
    if (remaining < 60) return `~${remaining}s left`
    return `~${Math.ceil(remaining / 60)} min left`
  })()

  if (fatal) {
    return <ErrorState message={fatal} onRetry={() => router.push('/wizard')} />
  }

  if (snapshot?.status === 'failed' || snapshot?.refunded) {
    return (
      <RefundedState
        title={snapshot.title ?? ''}
        failureReason={snapshot.failure_reason}
        refunded={snapshot.refunded}
      />
    )
  }

  // Build a thumbnail array even before pages exist so the grid doesn't pop in.
  const thumbs: StatusPage[] = snapshot?.pages.length
    ? snapshot.pages
    : Array.from({ length: 0 }, (_, i) => ({
        page_number: i,
        state: 'pending' as const,
        image_url: null,
        attempt: 0,
        rewrites: 0,
      }))

  const eyebrow = phase === 'text'
    ? 'Writing your story'
    : (snapshot?.images_done ? 'Story ready' : 'Creating your story')

  const headline = snapshot?.title || 'Your story, page by page.'

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
                {snapshot?.images_done ? '✓ All illustrations are ready.' : rotating[copyIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Email reassurance banner */}
        {snapshot?.email_will_be_sent && snapshot.email_address_masked && (
          <div className="mt-8 mx-auto max-w-xl rounded-xl bg-brand-tint/60 border border-brand-tint px-4 py-3 flex items-start gap-3">
            <Mail className="size-4 text-brand-deep shrink-0 mt-0.5" />
            <p className="text-sm text-brand-deep leading-snug">
              <span className="font-semibold">Safe to close this tab.</span>{' '}
              We&apos;ll email <span className="font-mono">{snapshot.email_address_masked}</span> when the book is ready.{' '}
              Can&apos;t find it? Check your spam or junk folder and add{' '}
              <span className="font-mono">hello@support.storybookstudio.org</span> to your contacts.
            </p>
          </div>
        )}

        {/* Two-stage bar: text fills 0→100%, then image-gen starts fresh at 0→100% */}
        <div className="mt-10 max-w-xl mx-auto" key={phase}>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-ink-soft">
              {phase === 'text'
                ? 'Writing the story…'
                : `${done} of ${total || '…'} pages illustrated`}
            </span>
            <span className="text-ink-muted font-numeral">
              {phasePct}%{phase === 'images' && eta ? ` · ${eta}` : ''}
            </span>
          </div>
          <Progress value={phasePct} shimmer={!snapshot?.images_done} />
        </div>

        {/* Thumbnails — once we know how many pages there are */}
        {phase === 'images' && thumbs.length > 0 && (
          <div className="mt-12 grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
            {thumbs.map((t) => (
              <div
                key={t.page_number}
                className="relative aspect-square rounded-lg bg-surface-sunken border border-border overflow-hidden"
              >
                <AnimatePresence>
                  {t.image_url && (
                    <motion.img
                      key={t.image_url}
                      src={t.image_url}
                      alt=""
                      variants={thumbReveal}
                      initial="hidden"
                      animate="show"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </AnimatePresence>
                {!t.image_url && (
                  <div className="absolute inset-0 shimmer" aria-hidden />
                )}
                {!t.image_url && t.rewrites > 0 && (
                  <span className="absolute top-1 left-1 text-[10px] font-numeral text-ink-soft bg-white/85 backdrop-blur rounded-pill px-1.5 py-0.5">
                    rewrite {t.rewrites}
                  </span>
                )}
                {!t.image_url && t.attempt > 1 && t.rewrites === 0 && (
                  <span className="absolute top-1 left-1 text-[10px] font-numeral text-ink-soft bg-white/85 backdrop-blur rounded-pill px-1.5 py-0.5">
                    retry {t.attempt}
                  </span>
                )}
                <span className="absolute bottom-1 right-1.5 text-[10px] font-numeral text-ink-muted bg-white/70 backdrop-blur rounded-pill px-1.5">
                  {t.page_number + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {snapshot?.images_done && (
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
            {snapshot?.email_will_be_sent
              ? 'Each page is illustrated individually. We\'ll email you when it\'s ready.'
              : 'Each page is illustrated individually. You can come back anytime.'}
          </p>
        </div>
      </main>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const router = useRouter()
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-pill bg-danger/10 text-danger mb-5">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="font-display text-3xl text-ink leading-tight">Something went sideways.</h1>
        <p className="mt-3 text-ink-soft">{message}</p>
        <div className="mt-7 flex gap-3 justify-center">
          <Button variant="primary" onClick={onRetry} iconLeft={<RefreshCcw className="size-4" />}>
            Start over
          </Button>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}

function RefundedState({
  title,
  failureReason,
  refunded,
}: {
  title: string
  failureReason: string | null
  refunded: boolean
}) {
  const router = useRouter()
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-pill bg-brand-tint text-brand-deep mb-5">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="font-display text-3xl text-ink leading-tight">
          We couldn&apos;t finish {title ? `“${title}”` : 'this story'}.
        </h1>
        <p className="mt-3 text-ink-soft">
          {refunded
            ? <>One of our illustration providers kept hiccupping. Rather than ship you a half-finished book, we&apos;ve <span className="font-semibold text-ink">refunded the credit</span> to your account.</>
            : <>One of our illustration providers kept hiccupping and we couldn&apos;t deliver every page.</>}
        </p>
        {failureReason && (
          <details className="mt-5 text-left mx-auto inline-block">
            <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink">What went wrong</summary>
            <pre className="mt-2 p-3 rounded-md bg-surface-sunken text-xs text-ink-soft whitespace-pre-wrap break-words max-w-md">
              {failureReason.slice(0, 400)}
            </pre>
          </details>
        )}
        <p className="mt-4 text-ink-muted text-sm">
          Tip: a different art style is often a clean workaround when one provider is having a rough day.
        </p>
        <div className="mt-7 flex justify-center">
          <Button variant="primary" size="lg" onClick={() => router.push('/wizard')} iconLeft={<RefreshCcw className="size-4" />}>
            Start over
          </Button>
        </div>
      </div>
    </div>
  )
}
