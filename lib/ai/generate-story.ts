import Anthropic from '@anthropic-ai/sdk'
import { WizardFormData } from '@/types'
import { STYLE_PREFIXES } from './index'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getAgeTier(age: number) {
  if (age <= 4) return { name: 'Tiny Readers',        style: '1 very short sentence per page. Extremely simple words, repetition encouraged.' }
  if (age <= 6) return { name: 'Early Readers',       style: '2–3 short sentences per page. Simple, familiar words.' }
  if (age <= 9) return { name: 'Growing Readers',     style: 'A short paragraph (3–5 sentences) per page. Richer vocabulary with some new words.' }
  return        { name: 'Independent Readers',        style: 'A full paragraph (4–6 sentences) per page. Complex narrative and dialogue.' }
}

function getPageCount(length: string) {
  if (length === 'short') return 6
  if (length === 'long')  return 14
  return 10
}

export async function generateStory(form: WizardFormData): Promise<{ title: string; pages: StoryPage[] }> {
  const tier      = getAgeTier(form.child_age)
  const pageCount = getPageCount(form.length)
  const stylePrefix = STYLE_PREFIXES[form.art_style] ?? STYLE_PREFIXES['dog-man']
  const companions  = form.supporting_characters
    ? form.supporting_characters.split(',').filter(Boolean).join(', ')
    : 'none'
  const charDesc = form.child_appearance
    ? `${form.child_age}-year-old child with ${form.child_appearance}`
    : `${form.child_age}-year-old child`

  const prompt = `You are a beloved children's storybook author. Create a complete illustrated storybook.

STORY INPUTS:
- Hero: ${form.child_name}, age ${form.child_age}, pronouns: ${form.child_pronouns}
- Appearance: ${form.child_appearance || 'not specified'}
- Genre: ${form.genre}
- Lesson: ${form.lesson}
- Setting: ${form.setting}
- Supporting characters: ${companions}
- Tone: ${form.tone}
- Reading level: ${tier.name} — ${tier.style}

Generate exactly ${pageCount + 2} pages: 1 cover + ${pageCount} story pages + 1 end page.

RESPOND WITH VALID JSON ONLY. No markdown. No explanation. Just this structure:
{
  "title": "Creative story title featuring ${form.child_name}",
  "pages": [
    {
      "page_number": 0,
      "type": "cover",
      "text_content": "The story title",
      "scene_description": "STYLE_PREFIX Cover illustration: ${form.child_name} (${charDesc}) in a heroic exciting pose that hints at the adventure. Setting: ${form.setting}. No text in image."
    },
    {
      "page_number": 1,
      "text_content": "Opening page story text...",
      "scene_description": "STYLE_PREFIX Scene: describe what is happening. ${form.child_name} appears as ${charDesc}. Setting: ${form.setting}. No text in image."
    },
    ...all pages in order...,
    {
      "page_number": ${pageCount + 1},
      "type": "end",
      "text_content": "The End.\\n\\n— The Lesson —\\n\\nOne memorable sentence summing up the lesson.",
      "scene_description": "STYLE_PREFIX Final cozy scene: ${form.child_name} (${charDesc}) at peace, the lesson learned. Warm, joyful mood. No text in image."
    }
  ]
}

SCENE DESCRIPTION RULES (apply to every page):
- Replace STYLE_PREFIX with exactly: "${stylePrefix}"
- Always describe ${form.child_name} as: "${charDesc}"
- Never include text, words, signs, banners, or letters in the image
- Be specific: include action, emotion, lighting, and setting details
- Weave in supporting characters (${companions}) naturally throughout`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  // Extract JSON — find the outermost { } block to handle any preamble/postamble
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in Claude response')

  return JSON.parse(raw.slice(start, end + 1))
}

// Shape returned by Claude (before DB ids are added)
export interface StoryPage {
  page_number: number
  type?: 'cover' | 'end'
  text_content: string
  scene_description: string
  illustration_url?: string
}
