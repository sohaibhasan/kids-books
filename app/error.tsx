'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <main className="min-h-dvh bg-surface flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3">
          Something went wrong
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink leading-tight">
          We hit a snag rendering this page.
        </h1>
        <p className="mt-4 text-ink-soft">
          The error has been logged. You can try again, or head back to the home page.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-5 h-11 rounded-pill bg-brand text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 h-11 rounded-pill bg-surface-raised border border-border text-ink font-semibold hover:bg-surface-sunken transition-colors"
          >
            Go home
          </Link>
        </div>

        <details className="mt-8 text-left bg-surface-raised border border-border rounded-lg p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink-soft">
            Error details
          </summary>
          <dl className="mt-3 text-xs text-ink-muted space-y-2 font-mono">
            <div>
              <dt className="text-ink-soft font-semibold">Message</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">{error.message || '(no message)'}</dd>
            </div>
            {error.digest && (
              <div>
                <dt className="text-ink-soft font-semibold">Digest</dt>
                <dd className="mt-1 break-all">{error.digest}</dd>
              </div>
            )}
          </dl>
        </details>
      </div>
    </main>
  )
}
