import Header from '@/components/marketing/Header'
import Hero from '@/components/marketing/Hero'
import HowItWorks from '@/components/marketing/HowItWorks'
import SampleShowcase from '@/components/marketing/SampleShowcase'
import Pricing from '@/components/marketing/Pricing'
import BottomCTA from '@/components/marketing/BottomCTA'
import Footer from '@/components/marketing/Footer'
import { getShowcaseStories } from '@/lib/featured-stories'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let hero, samples
  try {
    const showcase = await getShowcaseStories()
    hero = showcase.hero
    samples = showcase.samples
  } catch (err) {
    return <HomeDebugError err={err} />
  }

  return (
    <main className="bg-surface min-h-screen">
      <Header />
      <Hero hero={hero} />
      <HowItWorks />
      <SampleShowcase samples={samples} />
      <Pricing />
      <BottomCTA />
      <Footer />
    </main>
  )
}

// TEMP DIAGNOSTIC: surfaces the real Server Component error to the page
// because React strips error.message when it crosses the error-boundary
// boundary in production. Remove once the homepage bug is fixed.
function HomeDebugError({ err }: { err: unknown }) {
  const e = err as Error & { digest?: string; cause?: unknown; code?: string }
  console.error('[home] getShowcaseStories threw:', e)
  return (
    <main className="min-h-dvh bg-surface flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3">
          Diagnostic
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink leading-tight">
          Homepage threw while rendering.
        </h1>
        <p className="mt-4 text-ink-soft">
          The real error message is being surfaced here directly (bypassing
          React&apos;s production redaction) so we can debug it.
        </p>

        <div className="mt-6 bg-surface-raised border border-border rounded-lg p-5 text-sm font-mono break-words">
          <div className="mb-3">
            <div className="text-ink-soft font-semibold text-xs uppercase tracking-wider">Name</div>
            <div className="text-ink mt-1">{e?.name ?? '(unknown)'}</div>
          </div>
          <div className="mb-3">
            <div className="text-ink-soft font-semibold text-xs uppercase tracking-wider">Message</div>
            <div className="text-ink mt-1 whitespace-pre-wrap">{e?.message ?? '(no message)'}</div>
          </div>
          {e?.code && (
            <div className="mb-3">
              <div className="text-ink-soft font-semibold text-xs uppercase tracking-wider">Code</div>
              <div className="text-ink mt-1">{String(e.code)}</div>
            </div>
          )}
          {e?.digest && (
            <div className="mb-3">
              <div className="text-ink-soft font-semibold text-xs uppercase tracking-wider">Digest</div>
              <div className="text-ink mt-1">{e.digest}</div>
            </div>
          )}
          {e?.cause !== undefined && (
            <div className="mb-3">
              <div className="text-ink-soft font-semibold text-xs uppercase tracking-wider">Cause</div>
              <div className="text-ink mt-1 whitespace-pre-wrap">{stringify(e.cause)}</div>
            </div>
          )}
          <div>
            <div className="text-ink-soft font-semibold text-xs uppercase tracking-wider">Stack</div>
            <pre className="text-ink mt-1 whitespace-pre-wrap text-xs leading-relaxed">{e?.stack ?? '(no stack)'}</pre>
          </div>
        </div>
      </div>
    </main>
  )
}

function stringify(v: unknown): string {
  if (v instanceof Error) return `${v.name}: ${v.message}\n${v.stack ?? ''}`
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}
