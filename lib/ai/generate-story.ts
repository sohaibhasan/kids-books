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

Generate exactly ${pageCount + 2} pages: 1 cover (page_number 0, type "cover") + ${pageCount} story pages (page_number 1..${pageCount}) + 1 end page (page_number ${pageCount + 1}, type "end").

Call the return_story tool with the finished storybook.

CRITICAL RULES:
1. The "character_sheet" field must be a single detailed paragraph describing ${form.child_name}'s EXACT appearance and a SPECIFIC outfit they wear throughout the entire story. Incorporate the exact appearance details: ${appearanceDesc}. Include this exact outfit: ${outfitDesc}. Add age, gender presentation, body build, and any extra flourishes. Do NOT include the character's name — just physical appearance and clothing. The outfit MUST appear identically in every single illustration.
2. In every scene_description, paste the EXACT character_sheet text verbatim where the character appears — do not abbreviate or paraphrase.
3. Every scene_description MUST start with exactly this style prefix: "${stylePrefix}"
4. Never include text, words, signs, banners, or letters in any image description.
5. Be specific in scenes: include action, emotion, lighting, and setting details.
6. Weave in supporting characters (${companions}) naturally throughout.
7. If supporting characters appear, give each one a FIXED appearance description on first mention and repeat it exactly on subsequent pages.
8. The end page's text_content should be: "The End.\\n\\n— The Lesson —\\n\\n<one memorable sentence summing up the lesson>".`

  const pageSchema = {
    type: 'object' as const,
    properties: {
      page_number: { type: 'integer' as const },
      type:        { type: 'string' as const, enum: ['cover', 'end', 'story'] },
      text_content:      { type: 'string' as const },
      scene_description: { type: 'string' as const },
    },
    required: ['page_number', 'text_content', 'scene_description'],
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    tools: [
      {
        name: 'return_story',
        description: 'Return the finished illustrated storybook.',
        input_schema: {
          type: 'object',
          properties: {
            title:           { type: 'string', description: `Creative story title featuring ${form.child_name}` },
            character_sheet: { type: 'string', description: 'Dense single paragraph describing the hero\'s exact appearance + fixed outfit, pasted verbatim into every scene_description.' },
            pages: {
              type: 'array',
              items: pageSchema,
              minItems: pageCount + 2,
              maxItems: pageCount + 2,
            },
          },
          required: ['title', 'character_sheet', 'pages'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'return_story' },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not call return_story tool')
  }

  return toolUse.input as { title: string; character_sheet: string; pages: StoryPage[] }
}

// Shape returned by Claude (before DB ids are added)
export interface StoryPage {
  page_number: number
  type?: 'cover' | 'end'
  text_content: string
  scene_description: string
  illustration_url?: string
}
