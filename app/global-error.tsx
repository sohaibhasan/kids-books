'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error('[app/global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          background: '#FBF7F2',
          color: '#1F1B16',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: '#9A9088',
              margin: '0 0 12px',
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              fontSize: 32,
              lineHeight: 1.1,
              margin: 0,
              color: '#1F1B16',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            The page couldn&apos;t load.
          </h1>
          <p style={{ marginTop: 16, color: '#5C544A', lineHeight: 1.55 }}>
            A server-side error prevented this page from rendering. The error
            has been logged.
          </p>

          <details
            style={{
              marginTop: 28,
              textAlign: 'left',
              background: '#FFFFFF',
              border: '1px solid #E8E1D7',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: '#5C544A',
              }}
            >
              Error details
            </summary>
            <dl
              style={{
                marginTop: 12,
                fontSize: 12,
                color: '#5C544A',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              <div style={{ marginTop: 8 }}>
                <dt style={{ fontWeight: 600, color: '#1F1B16' }}>Message</dt>
                <dd
                  style={{
                    marginTop: 4,
                    marginLeft: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message || '(no message)'}
                </dd>
              </div>
              {error.digest && (
                <div style={{ marginTop: 12 }}>
                  <dt style={{ fontWeight: 600, color: '#1F1B16' }}>Digest</dt>
                  <dd style={{ marginTop: 4, marginLeft: 0, wordBreak: 'break-all' }}>
                    {error.digest}
                  </dd>
                </div>
              )}
            </dl>
          </details>
        </div>
      </body>
    </html>
  )
}
