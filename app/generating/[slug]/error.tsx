'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Generating page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-12">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl text-ink leading-tight mb-4">We hit a bump</h1>
        <p className="text-ink-soft text-base leading-relaxed mb-8">
          Something went wrong, but your story is still being created in the background. You can refresh this page
          to check the progress, or come back to it later using your story link.
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
