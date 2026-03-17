'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Page {
  page_number: number
  type?: string
  text_content: string
  illustration_url: string
}

interface Props {
  title: string
  pages: Page[]
  slug: string
}

function formatText(text: string, type?: string) {
  if (type === 'cover') {
    return <h1 className="text-2xl font-bold text-center text-white leading-tight">{text}</h1>
  }
  if (type === 'end') {
    const lines = text.split('\n').filter(l => l.trim())
    return (
      <div className="text-center space-y-3">
        <p className="text-3xl font-bold text-accent" style={{ textShadow: '2px 2px 0 #e63946' }}>{lines[0]}</p>
        {lines[1] && <p className="text-xs uppercase tracking-widest text-white/40">{lines[1]}</p>}
        {lines[2] && <p className="text-lg italic text-white/80 leading-relaxed">{lines[2]}</p>}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {text.split('\n\n').map((para, i) => (
        <p key={i} className="text-lg leading-relaxed text-ink font-medium">{para}</p>
      ))}
    </div>
  )
}

export default function StoryReader({ title, pages, slug }: Props) {
  const [current, setCurrent] = useState(0)
  const page = pages[current]
  const isEnd  = page?.type === 'end'
  const isCover = page?.type === 'cover'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setCurrent(c => Math.min(c + 1, pages.length - 1))
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   setCurrent(c => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pages.length])

  if (!page) return null

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-start px-4 py-8 gap-6">

      {/* Top bar */}
      <div className="flex w-full max-w-xl items-center justify-between">
        <Link href="/" className="text-white/40 hover:text-white text-sm font-medium transition-colors">← Home</Link>
        <span className="text-white/30 text-xs font-medium tracking-wider uppercase">
          {isCover ? 'Cover' : isEnd ? 'The End' : `Page ${current} of ${pages.length - 2}`}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="text-white/40 hover:text-accent text-sm font-medium transition-colors"
        >
          Share 🔗
        </button>
      </div>

      {/* Book card */}
      <div className="w-full max-w-xl bg-white rounded-3xl border-4 border-ink overflow-hidden shadow-[6px_6px_0_#ffd700]">

        {/* Illustration */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.illustration_url}
          alt={`Illustration for page ${page.page_number}`}
          className="w-full object-cover border-b-4 border-ink"
          style={{ aspectRatio: '1 / 1' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />

        {/* Text */}
        <div className={`p-6 ${isCover ? 'bg-navy' : isEnd ? 'bg-navy' : 'bg-cream'}`}>
          {formatText(page.text_content, page.type)}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 w-full max-w-xl justify-between">
        <button
          onClick={() => setCurrent(c => Math.max(c - 1, 0))}
          disabled={current === 0}
          className="bg-white text-ink font-bold px-5 py-3 rounded-xl border-4 border-ink shadow-[3px_3px_0_#1a1a1a]
                     disabled:opacity-30 disabled:shadow-none hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5 flex-wrap justify-center max-w-[60%]">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full border-2 border-white/20 transition-all duration-200 ${
                i === current ? 'bg-accent w-4 h-4 border-accent' : 'bg-white/20 w-2.5 h-2.5'
              }`}
            />
          ))}
        </div>

        {isEnd ? (
          <Link
            href="/wizard"
            className="bg-accent text-ink font-bold px-5 py-3 rounded-xl border-4 border-ink shadow-[3px_3px_0_#1a1a1a] text-sm whitespace-nowrap"
          >
            New Story ✨
          </Link>
        ) : (
          <button
            onClick={() => setCurrent(c => Math.min(c + 1, pages.length - 1))}
            disabled={current === pages.length - 1}
            className="bg-primary text-white font-bold px-5 py-3 rounded-xl border-4 border-ink shadow-[3px_3px_0_#ffd700]
                       disabled:opacity-30 disabled:shadow-none hover:bg-primary-dark transition-all"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
