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

export async function generateStory(form: WizardFormData): Promise<{ title: string; character_sheet: string; pages: StoryPage[] }> {
  const tier      = getAgeTier(form.child_age)
  const pageCount = getPageCount(form.length)
  const stylePrefix = STYLE_PREFIXES[form.art_style] ?? STYLE_PREFIXES['dog-man']
  const companions  = form.supporting_characters
    ? form.supporting_characters.split(',').filter(Boolean).join(', ')
    : 'none'

  // Build structured appearance string from form fields
  const appearanceParts: string[] = []
  if (form.skin_tone) appearanceParts.push(`${form.skin_tone} skin`)
  if (form.hair_color && form.hair_style) appearanceParts.push(`${form.hair_color} ${form.hair_style} hair`)
  else if (form.hair_color) appearanceParts.push(`${form.hair_color} hair`)
  else if (form.hair_style) appearanceParts.push(`${form.hair_style} hair`)
  if (form.eye_color) appearanceParts.push(`${form.eye_color} eyes`)
  if (form.child_appearance) appearanceParts.push(form.child_appearance)
  const appearanceDesc = appearanceParts.length > 0 ? appearanceParts.join(', ') : 'not specified'
  const outfitDesc = form.outfit || 'a colorful casual outfit'

  const prompt = `You are a beloved children's storybook author. Create a complete illustrated storybook.

STORY INPUTS:
- Hero: ${form.child_name}, age ${form.child_age}, pronouns: ${form.child_pronouns}
- Appearance: ${appearanceDesc}
- Outfit (MUST be worn in every illustration): ${outfitDesc}
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
  "character_sheet": "A detailed, fixed visual description of ${form.child_name} that will be pasted verbatim into EVERY image prompt for consistency. You MUST incorporate the exact appearance details provided: ${appearanceDesc}. You MUST include this exact outfit: ${outfitDesc}. Build on these details by adding: age, gender presentation, body build, and any extra flourishes. Write it as one dense paragraph. Do NOT include the character's name — just physical appearance and clothing. The outfit MUST appear identically in every single illustration. Example format: 'A 7-year-old girl with warm brown skin, large round dark brown eyes, long curly black hair in two puffs with yellow hair ties, slim build, wearing a bright red hoodie with a yellow star on the chest, dark blue jeans, and white sneakers with pink laces.'",
  "pages": [
    {
      "page_number": 0,
      "type": "cover",
      "text_content": "The story title",
      "scene_description": "STYLE_PREFIX Cover illustration: CHARACTER_SHEET standing in a heroic exciting pose that hints at the adventure. Setting: ${form.setting}. No text or words in the image."
    },
    {
      "page_number": 1,
      "text_content": "Opening page story text...",
      "scene_description": "STYLE_PREFIX Scene: describe what is happening. The main character (CHARACTER_SHEET) is doing X. Setting details. No text or words in the image."
    },
    ...all pages in order...,
    {
      "page_number": ${pageCount + 1},
      "type": "end",
      "text_content": "The End.\\n\\n— The Lesson —\\n\\nOne memorable sentence summing up the lesson.",
      "scene_description": "STYLE_PREFIX Final cozy scene: CHARACTER_SHEET at peace, the lesson learned. Warm, joyful mood. No text or words in the image."
    }
  ]
}

CRITICAL RULES:
1. The "character_sheet" field must be a single detailed paragraph describing ${form.child_name}'s EXACT appearance and a SPECIFIC outfit they wear throughout the entire story.
2. In every scene_description, replace CHARACTER_SHEET with the EXACT character_sheet text — paste it verbatim, do not abbreviate or paraphrase.
3. Replace STYLE_PREFIX with exactly: "${stylePrefix}"
4. Never include text, words, signs, banners, or letters in any image description.
5. Be specific in scenes: include action, emotion, lighting, and setting details.
6. Weave in supporting characters (${companions}) naturally throughout.
7. If supporting characters appear, give each one a FIXED appearance description on first mention and repeat it exactly on subsequent pages.`

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
