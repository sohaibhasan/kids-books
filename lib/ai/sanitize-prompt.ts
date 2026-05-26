import Anthropic from '@anthropic-ai/sdk'
import type { ImageErrorCategory } from './classify-image-error'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Provider = 'openai' | 'recraft' | 'fal' | 'google'

export interface RewriteOptions {
  prompt: string
  provider: Provider
  category: ImageErrorCategory
  errorMessage: string
  attempt: number                // 1-indexed
  previousRewrites?: string[]    // earlier failed rewrites — Claude must avoid repeating
  characterSheet?: string        // visual anchor pasted into every page
  stylePrefix?: string           // visual anchor that opens every prompt
}

/**
 * Ask Claude to rewrite a failed image prompt. The rewriter's instructions
 * change based on WHY the provider rejected it — softening for content
 * filters, compression for length errors, more concrete framing for empty
 * responses. We always preserve the character sheet + style prefix verbatim
 * because they're what holds aesthetic and character consistency across the
 * 17 pages of a story.
 */
export async function rewritePromptForError(opts: RewriteOptions): Promise<string> {
  const { prompt, provider, category, errorMessage, attempt, previousRewrites, characterSheet, stylePrefix } = opts

  const system = buildSystemPrompt({ provider, category, attempt, characterSheet, stylePrefix })

  const userBlocks: string[] = [
    `PROVIDER ERROR: ${errorMessage.slice(0, 400)}`,
    `\nORIGINAL PROMPT:\n${prompt}`,
  ]
  if (previousRewrites && previousRewrites.length > 0) {
    userBlocks.push(
      `\nPREVIOUS REWRITES THAT ALSO FAILED (produce something materially different):\n` +
        previousRewrites.slice(-2).map((p, i) => `--- rewrite ${i + 1} ---\n${p}`).join('\n'),
    )
  }

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    system,
    messages: [{ role: 'user', content: userBlocks.join('\n') }],
  })

  const textBlock = msg.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text block for prompt rewrite')
  }
  return textBlock.text.trim()
}

function buildSystemPrompt({
  provider, category, attempt, characterSheet, stylePrefix,
}: {
  provider: Provider
  category: ImageErrorCategory
  attempt: number
  characterSheet?: string
  stylePrefix?: string
}): string {
  const preservation = [
    stylePrefix ? `- The art-style prefix (start the prompt with: "${stylePrefix}").` : '',
    characterSheet ? `- The character sheet pasted verbatim — this is the consistency anchor across all pages of the story:\n  ${characterSheet.slice(0, 1200)}` : '',
    '- The character outfit / hair / eye color / defining features.',
    '- The setting, the action of the scene, the emotional tone.',
  ].filter(Boolean).join('\n')

  const constraints = [
    `- Output ONLY the rewritten prompt. No preface, no explanation, no quotation marks.`,
    `- Keep it concise — under 1500 characters total.`,
    `- Do NOT include text, words, signs, banners, or letters in the scene.`,
    attempt >= 2
      ? `- This is rewrite attempt ${attempt}. The previous attempts failed. Produce something materially different — change sentence order, surface forms, vocabulary, framing.`
      : '',
  ].filter(Boolean).join('\n')

  switch (category) {
    case 'prompt_filter':
      return `You are a prompt safety editor for AI image generation in a children's storybook context. The ${provider} content filter just rejected the prompt as "improper", though the intent is wholesome.\n\nPreserve:\n${preservation}\n\nSoften:\n- Detailed body / anatomy descriptions (use gentler, more general phrasing).\n- Words filters misread as suggestive when paired with a child subject ("bare", "small body", body-part lists).\n- Intense verbs ("trembling", "shaking") near body descriptions.\n- Anything weapon-, violence-, or gore-adjacent — swap for whimsical-safe equivalents (e.g. a "sword fight" becomes a "stick-pretend duel"; "blood" becomes "red paint"; "fire" becomes "glowing embers").\n\nConstraints:\n${constraints}`

    case 'prompt_invalid':
      return `You are a prompt compactor for AI image generation. The ${provider} provider rejected the prompt as too long or malformed. Compress it under 800 characters while preserving the visual essence.\n\nPreserve:\n${preservation}\n\nCompress:\n- Drop adverbs (very, really, extremely, quite, incredibly).\n- Drop parentheticals and asides.\n- Collapse verbose phrases ("standing in a" → "in a"; "in the background" → "behind"; "there is a" → "a").\n- Keep one strong sentence describing the character + one strong sentence describing the action + setting.\n\nConstraints:\n${constraints.replace('under 1500 characters total', 'under 800 characters total')}`

    case 'no_output':
      return `You are a prompt rewriter for AI image generation. The ${provider} provider accepted the prompt but returned no image — usually because the prompt was too abstract or open-ended for the model to commit to a single image. Make it more concrete and visually grounded.\n\nPreserve:\n${preservation}\n\nMake it more concrete:\n- Specify the camera framing (close-up, medium shot, wide shot, low angle, overhead).\n- Specify the lighting (golden-hour, soft morning light, candlelit, overcast).\n- Specify exactly what the character is doing with their hands / face / body in this moment.\n- Replace abstract language ("a sense of wonder", "magical atmosphere") with concrete visuals ("eyes wide, mouth slightly open", "tiny floating sparkles around the character").\n\nConstraints:\n${constraints}`

    default:
      return `You are a prompt editor for AI image generation. The ${provider} provider rejected the prompt for an unclear reason. Rewrite it with cleaner phrasing and the original visual intent intact.\n\nPreserve:\n${preservation}\n\nConstraints:\n${constraints}`
  }
}

/**
 * Backward-compat wrapper used by lib/ai/generate-image.ts's legacy
 * in-process sanitize loop. New code should call rewritePromptForError
 * directly so it can pass error context.
 */
export async function sanitizePromptForProvider(
  prompt: string,
  provider: Provider,
  attempt: number = 1,
): Promise<string> {
  return rewritePromptForError({
    prompt,
    provider,
    category: 'prompt_filter',
    errorMessage: 'content filter rejection',
    attempt,
  })
}
