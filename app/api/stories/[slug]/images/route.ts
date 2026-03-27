import { NextRequest } from 'next/server'
import { generateImage } from '@/lib/ai/generate-image'
import { supabase } from '@/lib/supabase'

const BUCKET = 'story-images'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: story, error } = await supabase
    .from('stories')
    .select('pages')
    .eq('slug', slug)
    .single()

  if (error || !story) {
    return new Response('Story not found', { status: 404 })
  }

  const pages: { page_number: number; scene_description: string }[] = story.pages

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({ type: 'start', total: pages.length })

      for (const page of pages) {
        const filename = `${slug}/page-${String(page.page_number).padStart(2, '0')}.png`

        // Check if already uploaded
        const { data: existing } = await supabase.storage
          .from(BUCKET)
          .list(slug, { search: `page-${String(page.page_number).padStart(2, '0')}.png` })

        if (existing && existing.length > 0) {
          send({ type: 'progress', page: page.page_number, total: pages.length, cached: true })
          continue
        }

        try {
          const buffer = await generateImage(page.scene_description)

          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filename, buffer, { contentType: 'image/png', upsert: true })

          if (uploadError) throw uploadError

          send({ type: 'progress', page: page.page_number, total: pages.length })
        } catch (err) {
          send({ type: 'error', page: page.page_number, message: String(err) })
        }

        await new Promise(r => setTimeout(r, 500))
      }

      await supabase.from('stories').update({ images_done: true }).eq('slug', slug)

      send({ type: 'done' })
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
}
