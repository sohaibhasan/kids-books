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
  'dog-man': 'openai',
  watercolor: 'openai',
  'bold-bright': 'openai',
  'pencil-sketch': 'openai',
  'pixel-art': 'openai',
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
      return generateWithRecraft(prompt, quality)
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
// Recraft V4 — stub
// TODO: POST https://external.api.recraft.ai/v1/images/generations
//       Authorization: Bearer $RECRAFT_API_KEY, use `style` field for presets.
// ---------------------------------------------------------------------------

async function generateWithRecraft(_prompt: string, _quality: ImageQuality): Promise<Buffer> {
  throw new Error('recraft provider not yet implemented')
}

// ---------------------------------------------------------------------------
// fal.ai — FLUX.2 Pro / FLUX.1 Kontext — stub
// TODO: POST https://queue.fal.run/fal-ai/flux-pro/v1.1
//       Authorization: Key $FAL_KEY. Supports LoRA (Ghibli, anime, sketch).
// ---------------------------------------------------------------------------

async function generateWithFal(_prompt: string, _quality: ImageQuality): Promise<Buffer> {
  throw new Error('fal provider not yet implemented')
}

// ---------------------------------------------------------------------------
// Google Nano Banana 2 — stub (free tier ~500/day)
// TODO: POST https://generativelanguage.googleapis.com/v1beta/models/
//       gemini-3.1-flash-image-preview:generateContent
//       x-goog-api-key: $GOOGLE_AI_KEY.
// ---------------------------------------------------------------------------

async function generateWithGoogle(_prompt: string, _quality: ImageQuality): Promise<Buffer> {
  throw new Error('google provider not yet implemented')
}
