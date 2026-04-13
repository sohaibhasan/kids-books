import { NextRequest } from 'next/server'
import { generateImage } from '@/lib/ai/generate-image'
import { supabase } from '@/lib/supabase'
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
      .select('pages, form')
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
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

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
            send({ type: 'progress', page: page.page_number, total: pages.length, cached: true })
            continue
          }

          try {
            const buffer = await generateImage(page.scene_description, artStyle, imageQuality)

            const { error: uploadError } = await supabase.storage
              .from(BUCKET)
              .upload(filename, buffer, { contentType: 'image/png', upsert: true })

            if (uploadError) throw uploadError

            successCount++
            send({ type: 'progress', page: page.page_number, total: pages.length })
          } catch (err) {
            console.error(`[images ${slug} page ${page.page_number}]`, err)
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
        }

        send({ type: 'done', success: successCount, total: pages.length })
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection:      'keep-alive',
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
