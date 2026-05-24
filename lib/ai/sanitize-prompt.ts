import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Provider = 'openai' | 'recraft' | 'fal' | 'google'

/**
 * The provider's content filter rejected the image prompt. Ask Claude to
 * rewrite it preserving the visual intent (character look, setting, action,
 * mood, art-style instructions) but softening phrasing that filters tend to
 * misread — long anatomical descriptions of children, intense verbs,
 * medicalized vocabulary, etc.
 *
 * On `attempt: 2`, ask Claude for a substantially different rewrite so we
 * don't burn the second try on a near-duplicate.
 */
export async function sanitizePromptForProvider(
  prompt: string,
  provider: Provider,
  attempt: number = 1,
): Promise<string> {
  const system =
    `You are a prompt safety editor for AI image generation. The ${provider} provider's content filter just rejected the prompt below as "improper", though it's intended for a wholesome children's storybook illustration.\n\n` +
    `Rewrite the prompt so it preserves:\n` +
    `- The art-style instructions (e.g., "Watercolor illustration: soft washes, delicate ink, warm tones")\n` +
    `- The character's outfit, hair, eye color, and any defining features (these are visual anchors across pages)\n` +
    `- The setting, action, and emotional tone of the scene\n\n` +
    `Soften or rephrase:\n` +
    `- Detailed body/anatomy descriptions (replace with gentler, more general phrasing)\n` +
    `- Words that filters sometimes misread (e.g., "bare", "small body", body-part lists, anything that could read as suggestive when paired with a child subject)\n` +
    `- Intense verbs (e.g., "trembling", "shaking") if they appear alongside body descriptions\n\n` +
    `Constraints:\n` +
    `- Keep it under 1500 characters.\n` +
    `- Output ONLY the rewritten prompt — no preface, no explanation, no quotation marks.\n` +
    (attempt >= 2
      ? `- This is attempt 2. Produce a substantially different rewrite from a typical first attempt — change sentence order, surface forms, and word choice meaningfully.\n`
      : '')

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = msg.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text block for prompt sanitize')
  }
  return textBlock.text.trim()
}
