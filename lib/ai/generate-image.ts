import { ArtStyle, ImageQuality } from '@/types'

// ---------------------------------------------------------------------------
// Multi-provider image generation router
//
// Each art style routes to the provider that produces the best results for
// that aesthetic. Today every existing ArtStyle still points at OpenAI to
// preserve current behavior — the three other providers are stubbed and will
// be filled in as Phase 2a proceeds.
//
// Planned 8-aesthetic routing (see docs/image-gen-options.md):
//   Comic Book          → openai
//   Classic Watercolor  → recraft
//   Collage / Cutout    → recraft
//   Whimsical Ink       → openai
//   Bold & Modern       → recraft
//   Soft & Cozy         → openai
//   Anime / Ghibli      → fal (FLUX.2 + Ghibli LoRA)
//   Storybook Realism   → fal (FLUX.2 Pro)
//   (Google Nano Banana 2 is the free-tier fallback for any style)
// ---------------------------------------------------------------------------

type ImageProvider = 'openai' | 'recraft' | 'fal' | 'google'

const STYLE_PROVIDER_MAP: Record<ArtStyle, ImageProvider> = {
  'comic-book': 'openai',
  'classic-watercolor': 'recraft',
  'paper-collage': 'recraft',
  'whimsical-ink': 'openai',
  'bold-modern': 'recraft',
  'soft-cozy': 'openai',
  'anime-ghibli': 'fal',
  'storybook-realism': 'fal',
}

function selectProvider(style: ArtStyle): ImageProvider {
  return STYLE_PROVIDER_MAP[style] ?? 'openai'
}

export async function generateImage(
  prompt: string,
  style: ArtStyle,
  quality: ImageQuality = 'standard'
): Promise<Buffer> {
  const provider = selectProvider(style)

  switch (provider) {
    case 'openai':
      return generateWithOpenAI(prompt, quality)
    case 'recraft':
      return generateWithRecraft(prompt, style, quality)
    case 'fal':
      return generateWithFal(prompt, quality)
    case 'google':
      return generateWithGoogle(prompt, quality)
  }
}

// ---------------------------------------------------------------------------
// OpenAI — gpt-image-1 (live)
// ---------------------------------------------------------------------------

const OPENAI_URL = 'https://api.openai.com/v1/images/generations'

async function generateWithOpenAI(prompt: string, quality: ImageQuality): Promise<Buffer> {
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

// ---------------------------------------------------------------------------
// Recraft V4 — digital_illustration style with substyle per aesthetic
// Endpoint: POST https://external.api.recraft.ai/v1/images/generations
// Styles tested: digital_illustration + substyle "watercolor" (confirmed),
// collage and bold/modern driven by prompt (no matching substyle in V4).
// ---------------------------------------------------------------------------

const RECRAFT_URL = 'https://external.api.recraft.ai/v1/images/generations'

const RECRAFT_SUBSTYLE_MAP: Partial<Record<ArtStyle, string>> = {
  'classic-watercolor': 'watercolor',
  // paper-collage and bold-modern don't have matching V4 substyles — prompt-driven
}

async function generateWithRecraft(prompt: string, style: ArtStyle, _quality: ImageQuality): Promise<Buffer> {
  const body: Record<string, unknown> = {
    prompt,
    style: 'digital_illustration',
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  }

  const substyle = RECRAFT_SUBSTYLE_MAP[style]
  if (substyle) body.substyle = substyle

  const res = await fetch(RECRAFT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RECRAFT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Recraft image generation failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const imageData = data.data?.[0]
  if (!imageData) throw new Error('No image data returned from Recraft')

  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, 'base64')
  }

  if (imageData.url) {
    const imgRes = await fetch(imageData.url)
    if (!imgRes.ok) throw new Error(`Failed to download Recraft image: ${imgRes.status}`)
    const arrayBuffer = await imgRes.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  throw new Error('No image URL or base64 data in Recraft response')
}

// ---------------------------------------------------------------------------
// fal.ai — FLUX.2 Pro (queue-based)
// Submit → poll status → fetch result URL → download image buffer.
// Storybook Realism uses FLUX.2 Pro directly.
// Anime/Ghibli would use a LoRA model (future — currently uses base FLUX Pro).
// ---------------------------------------------------------------------------

const FAL_FLUX_PRO_URL = 'https://queue.fal.run/fal-ai/flux-pro/v1.1'

async function generateWithFal(prompt: string, _quality: ImageQuality): Promise<Buffer> {
  const falKey = process.env.FAL_KEY
  if (!falKey) throw new Error('FAL_KEY not set')

  // Submit to queue
  const submitRes = await fetch(FAL_FLUX_PRO_URL, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: 'square_hd',
      num_images: 1,
    }),
  })

  if (!submitRes.ok) {
    const text = await submitRes.text()
    throw new Error(`fal.ai submit failed (${submitRes.status}): ${text.slice(0, 200)}`)
  }

  const queue = await submitRes.json()
  const responseUrl: string = queue.response_url
  const statusUrl: string = queue.status_url

  if (!responseUrl) throw new Error('fal.ai: no response_url in queue response')

  // Poll until complete (max ~120s)
  const maxAttempts = 60
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${falKey}` },
    })
    if (!statusRes.ok) continue

    const status = await statusRes.json()
    if (status.status === 'COMPLETED') break
    if (status.status === 'FAILED') {
      throw new Error(`fal.ai generation failed: ${JSON.stringify(status).slice(0, 200)}`)
    }
  }

  // Fetch result
  const resultRes = await fetch(responseUrl, {
    headers: { Authorization: `Key ${falKey}` },
  })
  if (!resultRes.ok) {
    const text = await resultRes.text()
    throw new Error(`fal.ai result fetch failed (${resultRes.status}): ${text.slice(0, 200)}`)
  }

  const result = await resultRes.json()
  const imageUrl = result.images?.[0]?.url
  if (!imageUrl) throw new Error('No image URL in fal.ai response')

  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Failed to download fal.ai image: ${imgRes.status}`)
  const arrayBuffer = await imgRes.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ---------------------------------------------------------------------------
// Google Gemini — free-tier image generation (~500/day, no billing)
// Uses gemini-2.5-flash-image (or gemini-3.1-flash-image-preview as fallback).
// Response contains inline base64 image data.
// ---------------------------------------------------------------------------

const GOOGLE_IMAGE_MODEL = 'gemini-3.1-flash-image-preview'
const GOOGLE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_IMAGE_MODEL}:generateContent`

async function generateWithGoogle(prompt: string, _quality: ImageQuality): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_AI_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_KEY not set')

  const res = await fetch(`${GOOGLE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google image generation failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []

  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64')
    }
  }

  throw new Error('No image data in Google response')
}
