import { ArtStyle } from '@/types'
import { STYLE_PREFIXES } from './index'

// ---------------------------------------------------------------------------
// Multi-provider image generation router
//
// Each art style routes to the provider that produces the best results for
// that aesthetic.
//
// 8-aesthetic routing (see docs/image-gen-options.md):
//   Comic Book          → openai
//   Classic Watercolor  → recraft
//   Collage / Cutout    → recraft
//   Whimsical Ink       → openai
//   Bold & Modern       → recraft
//   Soft & Cozy         → openai
//   Anime / Ghibli      → fal (FLUX.2 + Ghibli LoRA)
//   Storybook Realism   → fal (FLUX.2 Pro)
// ---------------------------------------------------------------------------

export type ImageProvider = 'openai' | 'recraft' | 'fal'

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

export function selectProviderForStyle(style: ArtStyle): ImageProvider {
  return STYLE_PROVIDER_MAP[style] ?? 'openai'
}

/**
 * Single-shot image generation. The retry / rewrite / refund policy lives in
 * lib/jobs/run-story-job.ts so this stays a pure provider primitive and the
 * policy is testable in isolation. Provider is fixed per story by the
 * caller — never swap mid-story (aesthetic consistency).
 */
function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 90_000): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

export async function generateImage(
  prompt: string,
  style: ArtStyle,
  providerOverride?: ImageProvider,
): Promise<Buffer> {
  const provider = providerOverride ?? selectProviderForStyle(style)
  switch (provider) {
    case 'openai':  return generateWithOpenAI(prompt)
    case 'recraft': return generateWithRecraft(prompt, style)
    case 'fal':     return generateWithFal(prompt)
  }
}

// ---------------------------------------------------------------------------
// OpenAI — gpt-image-1 (live)
// ---------------------------------------------------------------------------

const OPENAI_URL = 'https://api.openai.com/v1/images/generations'

async function generateWithOpenAI(prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const res = await fetchWithTimeout(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
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
    const imgRes = await fetchWithTimeout(imageData.url, {})
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
const RECRAFT_MAX_PROMPT = 1000

// Condense a prompt to fit Recraft's 1000-char limit by trimming throughout
// while preserving the essence (character description + scene action).
function condenseForRecraft(prompt: string): string {
  let text = prompt

  // 1. Strip style prefix — Recraft gets style from style/substyle API params
  for (const prefix of Object.values(STYLE_PREFIXES)) {
    if (text.startsWith(prefix)) {
      text = text.slice(prefix.length).trim()
      break
    }
  }

  // 2. Remove "no text" instructions — Recraft doesn't render text
  text = text.replace(/,?\s*[Nn]o text or words in the image\.?/g, '')
  text = text.replace(/,?\s*[Nn]o text in the image\.?/g, '')

  // 3. Remove filler adverbs
  text = text.replace(/\b(very|really|extremely|quite|absolutely|incredibly)\s+/gi, '')

  // 4. Shorten verbose phrases
  text = text
    .replace(/\bstanding in a\b/g, 'in a')
    .replace(/\ba pair of\b/g, '')
    .replace(/\bwith a sense of\b/g, 'with')
    .replace(/\bthat hints at the adventure\b/g, '')
    .replace(/\bthat is happening\b/g, '')
    .replace(/\bin the background\b/g, 'behind')
    .replace(/\bin the foreground\b/g, 'in front')
    .replace(/\bcan be seen\b/g, '')
    .replace(/\bthere is a\b/g, 'a')
    .replace(/\bthere are\b/g, '')

  // 5. Remove parenthetical asides
  text = text.replace(/\s*\([^)]{0,80}\)/g, '')

  // 6. Collapse whitespace
  text = text.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').replace(/,\s*,/g, ',').trim()

  // 7. If still over limit, preserve both ends (character desc + scene action)
  if (text.length > RECRAFT_MAX_PROMPT) {
    const half = Math.floor((RECRAFT_MAX_PROMPT - 1) / 2)
    text = text.slice(0, half) + ' ' + text.slice(text.length - half)
  }

  return text.slice(0, RECRAFT_MAX_PROMPT)
}

const RECRAFT_SUBSTYLE_MAP: Partial<Record<ArtStyle, string>> = {
  'classic-watercolor': 'watercolor',
  // paper-collage and bold-modern don't have matching V4 substyles — prompt-driven
}

async function generateWithRecraft(prompt: string, style: ArtStyle): Promise<Buffer> {
  const apiKey = process.env.RECRAFT_API_KEY
  if (!apiKey) throw new Error('RECRAFT_API_KEY not set')

  const condensedPrompt = condenseForRecraft(prompt)
  const body: Record<string, unknown> = {
    prompt: condensedPrompt,
    style: 'digital_illustration',
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  }

  const substyle = RECRAFT_SUBSTYLE_MAP[style]
  if (substyle) body.substyle = substyle

  const res = await fetchWithTimeout(RECRAFT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    const imgRes = await fetchWithTimeout(imageData.url, {})
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

async function generateWithFal(prompt: string): Promise<Buffer> {
  const falKey = process.env.FAL_KEY
  if (!falKey) throw new Error('FAL_KEY not set')

  // Submit to queue
  const submitRes = await fetchWithTimeout(FAL_FLUX_PRO_URL, {
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
  let completed = false
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))

    const statusRes = await fetchWithTimeout(statusUrl, {
      headers: { Authorization: `Key ${falKey}` },
    }, 10_000)
    if (!statusRes.ok) continue

    const status = await statusRes.json()
    if (status.status === 'COMPLETED') { completed = true; break }
    if (status.status === 'FAILED') {
      throw new Error(`fal.ai generation failed: ${JSON.stringify(status).slice(0, 200)}`)
    }
  }
  if (!completed) {
    throw new Error('fal.ai polling timeout: job did not complete within 120s')
  }

  // Fetch result
  const resultRes = await fetchWithTimeout(responseUrl, {
    headers: { Authorization: `Key ${falKey}` },
  })
  if (!resultRes.ok) {
    const text = await resultRes.text()
    throw new Error(`fal.ai result fetch failed (${resultRes.status}): ${text.slice(0, 200)}`)
  }

  const result = await resultRes.json()
  const imageUrl = result.images?.[0]?.url
  if (!imageUrl) throw new Error('No image URL in fal.ai response')

  const imgRes = await fetchWithTimeout(imageUrl, {})
  if (!imgRes.ok) throw new Error(`Failed to download fal.ai image: ${imgRes.status}`)
  const arrayBuffer = await imgRes.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

