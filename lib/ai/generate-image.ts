import { ImageQuality } from '@/types'

const OPENAI_URL = 'https://api.openai.com/v1/images/generations'

export async function generateImage(prompt: string, quality: ImageQuality = 'standard'): Promise<Buffer> {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: quality === 'high' ? 'high' : 'low',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI image generation failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()

  // gpt-image-1 returns base64 data, dall-e-3 returns URLs
  const imageData = data.data?.[0]
  if (!imageData) throw new Error('No image data returned from OpenAI')

  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, 'base64')
  }

  if (imageData.url) {
    const imgRes = await fetch(imageData.url)
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`)
    const arrayBuffer = await imgRes.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  throw new Error('No image URL or base64 data in response')
}
