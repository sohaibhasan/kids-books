import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { generateImage } from '@/lib/ai/generate-image'

// Server-Sent Events stream: generates images one-by-one and streams progress to the client
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const dir = path.join(process.cwd(), 'public', 'generated', slug)
  const storyPath = path.join(dir, 'story.json')

  if (!fs.existsSync(storyPath)) {
    return new Response('Story not found', { status: 404 })
  }

  const story = JSON.parse(fs.readFileSync(storyPath, 'utf-8'))
  const pages: { page_number: number; scene_description: string }[] = story.pages

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({ type: 'start', total: pages.length })

      for (const page of pages) {
        const filename = `page-${String(page.page_number).padStart(2, '0')}.png`
        const imgPath  = path.join(dir, filename)

        // Skip if already generated
        if (fs.existsSync(imgPath)) {
          send({ type: 'progress', page: page.page_number, total: pages.length, cached: true })
          continue
        }

        try {
          const buffer = await generateImage(page.scene_description)
          fs.writeFileSync(imgPath, buffer)
          send({ type: 'progress', page: page.page_number, total: pages.length })
        } catch (err) {
          send({ type: 'error', page: page.page_number, message: String(err) })
        }

        // Brief pause to avoid hammering the API
        await new Promise(r => setTimeout(r, 500))
      }

      // Mark story as fully generated
      story.images_done = true
      fs.writeFileSync(storyPath, JSON.stringify(story, null, 2))

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
