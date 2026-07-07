'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Story reader error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-12">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl text-ink leading-tight mb-4">This page hit a snag</h1>
        <p className="text-ink-soft text-base leading-relaxed mb-8">
          Something went wrong loading this story. Your storybook is safe — try again in a moment.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="md">
            Try again
          </Button>
          <Link href="/">
            <Button variant="secondary" size="md">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
