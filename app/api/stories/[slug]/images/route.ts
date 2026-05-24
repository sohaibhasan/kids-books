import { NextRequest } from 'next/server'
import { generateImage } from '@/lib/ai/generate-image'
import { supabase } from '@/lib/supabase'
import { maybeAlertProviderQuota } from '@/lib/alerts'
import { ArtStyle } from '@/types'

export const maxDuration = 300

const BUCKET = 'story-images'
const PER_PAGE_ATTEMPTS = 5

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data: story, error } = await supabase
      .from('stories')
      .select('pages, form, device_id, credit_event_id')
      .eq('slug', slug)
      .single()

    if (error || !story) {
      console.error(`[images ${slug}] story lookup failed:`, error)
      return new Response(`Story not found: ${error?.message ?? 'no data'}`, { status: 404 })
    }

    // Supabase returns jsonb columns as parsed objects, but if the column was
    // created as text (or double-encoded on insert), it comes back as a string.
    const rawPages = story.pages
    const rawForm  = story.form
    const pages: { page_number: number; scene_description: string }[] =
      typeof rawPages === 'string' ? JSON.parse(rawPages) : rawPages
    const form = typeof rawForm === 'string' ? JSON.parse(rawForm) : rawForm
    console.log(`[images ${slug}] pages type=${typeof rawPages} count=${pages.length}`)

    const artStyle: ArtStyle = form?.art_style || 'comic-book'

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false
        const send = (data: object) => {
          if (closed) return
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
        // SSE keepalive: send a comment line every 15s so idle proxies/browsers
        // don't close the connection during long generateImage() calls. The
        // EventSource client silently ignores comment-only lines.
        const keepalive = setInterval(() => {
          if (closed) return
          try { controller.enqueue(encoder.encode(`: keepalive\n\n`)) } catch { /* stream gone */ }
        }, 15_000)

        send({ type: 'start', total: pages.length })

        let successCount = 0

        for (const page of pages) {
          const filename = `${slug}/page-${String(page.page_number).padStart(2, '0')}.png`

          // Check if already uploaded
          const { data: existing } = await supabase.storage
            .from(BUCKET)
            .list(slug, { search: `page-${String(page.page_number).padStart(2, '0')}.png` })

          if (existing && existing.length > 0) {
            successCount++
            const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename)
            send({
              type: 'progress',
              page: page.page_number,
              total: pages.length,
              cached: true,
              url: pub.publicUrl,
            })
            continue
          }

          // Per-page retry loop. The client (generating page) handles
          // cross-run retries; this loop covers transient provider blips
          // within a single SSE run.
          let lastError: unknown = null
          for (let attempt = 1; attempt <= PER_PAGE_ATTEMPTS; attempt++) {
            if (attempt > 1) {
              send({
                type: 'progress',
                page: page.page_number,
                total: pages.length,
                attempt,
              })
              const delayMs = Math.round(500 * Math.pow(1.6, attempt - 2))
              await new Promise(r => setTimeout(r, delayMs))
            }
            try {
              const buffer = await generateImage(page.scene_description, artStyle)
              const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(filename, buffer, { contentType: 'image/png', upsert: true })
              if (uploadError) throw uploadError

              successCount++
              const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename)
              send({
                type: 'progress',
                page: page.page_number,
                total: pages.length,
                url: pub.publicUrl,
              })
              lastError = null
              break
            } catch (err) {
              lastError = err
              console.error(`[images ${slug} page ${page.page_number} attempt ${attempt}]`, err)
              void maybeAlertProviderQuota(err, `images ${slug} page ${page.page_number}`)
            }
          }
          if (lastError) {
            const message =
              lastError instanceof Error
                ? lastError.message
                : typeof lastError === 'string'
                ? lastError
                : (() => {
                    try { return JSON.stringify(lastError) } catch { return 'Unknown error' }
                  })()
            send({
              type: 'error',
              page: page.page_number,
              message,
              attempts_used: PER_PAGE_ATTEMPTS,
            })
          }

          await new Promise(r => setTimeout(r, 500))
        }

        // Only mark done if all images succeeded.
        // Partial runs no longer refund here — the client retries the SSE
        // (skip-cached lets it re-attempt only the missing pages), and once
        // the retry budget is exhausted it POSTs /api/stories/[slug]/abandon
        // to trigger the refund.
        if (successCount === pages.length) {
          await supabase.from('stories').update({ images_done: true }).eq('slug', slug)
        }

        send({ type: 'done', success: successCount, total: pages.length })
        clearInterval(keepalive)
        closed = true
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':       'text/event-stream',
        'Cache-Control':      'no-cache, no-transform',
        Connection:           'keep-alive',
        // Hint to Vercel's edge / any upstream proxy: do not buffer this stream.
        'X-Accel-Buffering':  'no',
      },
    })
  } catch (err) {
    console.error('[images route] unhandled error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
