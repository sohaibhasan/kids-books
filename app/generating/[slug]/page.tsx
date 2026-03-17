'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ProgressState {
  done: boolean
  current: number
  total: number
  errors: number
}

export default function GeneratingPage() {
  const { slug } = useParams<{ slug: string }>()
  const router    = useRouter()

  const [progress, setProgress] = useState<ProgressState>({ done: false, current: 0, total: 0, errors: 0 })
  const [storyTitle, setStoryTitle] = useState('')
  const [status, setStatus] = useState<'generating' | 'error'>('generating')

  // Load story title
  useEffect(() => {
    fetch(`/generated/${slug}/story.json`)
      .then(r => r.json())
      .then(d => setStoryTitle(d.title))
      .catch(() => {})
  }, [slug])

  // Stream image generation progress
  useEffect(() => {
    const es = new EventSource(`/api/stories/${slug}/images`)

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'start') {
        setProgress(p => ({ ...p, total: data.total }))
      } else if (data.type === 'progress') {
        setProgress(p => ({ ...p, current: data.page + 1 }))
      } else if (data.type === 'error') {
        setProgress(p => ({ ...p, errors: p.errors + 1, current: data.page + 1 }))
      } else if (data.type === 'done') {
        setProgress(p => ({ ...p, done: true }))
        es.close()
        setTimeout(() => router.push(`/read/${slug}`), 800)
      }
    }

    es.onerror = () => {
      setStatus('error')
      es.close()
    }

    return () => es.close()
  }, [slug, router])

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-white gap-4 px-6 text-center">
        <span className="text-5xl">😔</span>
        <h1 className="text-2xl font-bold text-accent">Something went wrong</h1>
        <p className="text-white/60 max-w-sm">Image generation hit an error. Check the server logs.</p>
        <button onClick={() => router.push('/wizard')} className="mt-4 bg-primary text-white font-bold px-6 py-3 rounded-xl border-4 border-white">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center gap-6">

      {/* Animated icon */}
      <div className="text-6xl animate-bounce">🎨</div>

      <div>
        <h1 className="text-3xl font-bold text-accent mb-2" style={{ textShadow: '3px 3px 0 #e63946' }}>
          {progress.done ? '✅ Story Ready!' : 'Creating Your Story…'}
        </h1>
        {storyTitle && (
          <p className="text-white/70 text-lg font-medium">"{storyTitle}"</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-white/50 text-sm mb-2">
          <span>Illustrating pages…</span>
          <span>{progress.current} / {progress.total}</span>
        </div>
        <div className="w-full h-4 bg-white/10 rounded-full border-2 border-white/20 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-white/40 text-xs mt-2">{pct}% complete</p>
      </div>

      {/* Page dots */}
      {progress.total > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 border-white/20 transition-all duration-300 ${
                i < progress.current ? 'bg-accent border-accent' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      )}

      <p className="text-white/30 text-sm max-w-xs">
        Each page is illustrated individually — this takes about 2 minutes. Don't close this tab!
      </p>
    </div>
  )
}
