import { NextRequest } from 'next/server'
import { generateImage } from '@/lib/ai/generate-image'
import { supabase } from '@/lib/supabase'
import { maybeAlertProviderQuota } from '@/lib/alerts'
import { refundFailedGen } from '@/lib/credits'
import { ArtStyle, ImageQuality } from '@/types'

export const maxDuration = 300

const BUCKET = 'story-images'

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

    const imageQuality: ImageQuality = form?.image_quality || 'standard'
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

          try {
            const buffer = await generateImage(page.scene_description, artStyle, imageQuality)

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
          } catch (err) {
            console.error(`[images ${slug} page ${page.page_number}]`, err)
            void maybeAlertProviderQuota(err, `images ${slug} page ${page.page_number}`)
            const message =
              err instanceof Error
                ? err.message
                : typeof err === 'string'
                ? err
                : (() => {
                    try { return JSON.stringify(err) } catch { return 'Unknown error' }
                  })()
            send({ type: 'error', page: page.page_number, message })
          }

          await new Promise(r => setTimeout(r, 500))
        }

        // Only mark done if all images succeeded
        if (successCount === pages.length) {
          await supabase.from('stories').update({ images_done: true }).eq('slug', slug)
        } else if (story.credit_event_id && story.device_id) {
          // Paid story that didn't fully complete — refund the credit so the
          // user can try again without losing their money. Idempotent.
          try {
            await refundFailedGen(story.device_id as string, slug)
          } catch (refundErr) {
            console.error(`[images ${slug}] refund failed`, refundErr)
          }
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
