import { WritingStyle, Tone, DepthModifier } from '@/types'

export interface WritingStyleVoice {
  label: string
  icon: string
  description: string
  voice_prompt: string
}

export const WRITING_STYLE_VOICES: Record<WritingStyle, WritingStyleVoice> = {
  'rhyming-playful': {
    label: 'Rhyming & Playful',
    icon: '🎵',
    description: 'Bouncy rhymes, invented words, read-aloud rhythm',
    voice_prompt:
      'Write every story page in rhyming couplets with a bouncy anapestic or dactylic rhythm — the kind of meter that begs to be read aloud. Use playful invented compound words (original, never trademarked) when ordinary words feel flat. Favor short rhyming pairs over long stanzas. Pick a one-line refrain that recurs on at least three pages. Rhymes must be honest — never force a word just to rhyme.',
  },
  'gentle-pastoral': {
    label: 'Gentle & Pastoral',
    icon: '🌿',
    description: 'Soft, old-fashioned, quiet adventures in nature',
    voice_prompt:
      'Write in a gently old-fashioned, pastoral voice with slightly formal vocabulary ("presently", "fetched", "a great deal"). Stakes should be quiet and small-scale — a lost mitten, a thimble of tea, a wrong turning on a familiar path. Pack each page with tactile nature details (moss, wet stones, hedgerows). Dialogue is polite, sometimes fussy. The lesson is learned through gentle misadventure and kindly consequence, never through a lecture.',
  },
  'deadpan-quirky': {
    label: 'Deadpan & Quirky',
    icon: '😐',
    description: 'Dry humor, lots of dialogue, comic timing',
    voice_prompt:
      'Write in a spare, deadpan voice with strong comic timing. Most pages should be mostly dialogue, with visible wants and stubborn characters who state exactly what they feel. Use dramatic pauses ("..."), one-line paragraphs, and understated punchlines. The narrator is matter-of-fact and lightly ironic. Never explain the joke — trust the reader.',
  },
  'lyrical-imaginative': {
    label: 'Lyrical & Imaginative',
    icon: '🌙',
    description: 'Rhythmic prose about big feelings, dreamlike',
    voice_prompt:
      'Write rhythmic, lyrical prose that takes big feelings seriously — fear, loneliness, wonder, joy — and names them at a child-appropriate level. Use fresh, simple metaphors (a worry like a heavy stone, a laugh like a window opening). The story should feel like a there-and-back journey, with the hero returning a little changed. Prose should have a cadence — sentences that vary in length, pauses that feel earned.',
  },
  'mischievous-bold': {
    label: 'Mischievous & Bold',
    icon: '⚡',
    description: 'Inventive vocabulary, clever kid triumphs',
    voice_prompt:
      'Write in a mischievous, inventive voice with playful wordplay and kid-friendly made-up words where needed. The hero is clever, a little cheeky, and outwits a problem (or a silly grown-up, or a goofy beast) through wits rather than force. Let the narrator be on the kid\'s side. Never punch down, never cruel — the comeuppance is always silly, not mean.',
  },
  'warm-contemplative': {
    label: 'Warm & Contemplative',
    icon: '🍯',
    description: 'Cozy meandering friendships and small thoughts',
    voice_prompt:
      'Write in a cozy, meandering voice that lingers on small moments and friendship. The hero has gentle philosophical thoughts at a kid\'s level ("I wonder if stars are just very patient"). Pages feel episodic rather than urgent. The warmth comes from characters who genuinely care about each other and say so. Pacing is unhurried; quiet pages are allowed.',
  },
  'vocab-stretching': {
    label: 'Vocab-Stretching',
    icon: '📚',
    description: 'Richer words with built-in definitions, literary',
    voice_prompt:
      'Write in a literary voice with a slightly ironic, knowing narrator (the kind who addresses the reader directly now and then). Introduce rich vocabulary a year above the reading level, and define each new word in-line the first time it appears — usually via a short aside or parenthetical ("she was *flummoxed* — which is a fancy word for very, very confused"). Carry one subtle emotional thread across the whole story.',
  },
  'sensory-repetitive': {
    label: 'Sensory & Repetitive',
    icon: '🎨',
    description: 'Short rhythmic sentences, patterns, lots of senses',
    voice_prompt:
      'Write in short, rhythmic sentences with strong repetition and pattern — each page builds on the last ("On Monday she found one red leaf. On Tuesday she found two yellow leaves..."). Lean heavily on sensory words (crunchy, silky, warm, bright). Use a cumulative structure if it fits: each page adds to a growing list the reader can anticipate.',
  },
}

export const TONE_DESCRIPTIONS: Record<Tone, string> = {
  silly: 'lighthearted, goofy, chuckle-every-page — keep things playful and absurd',
  heartfelt: 'warm and tender — let moments of genuine feeling breathe',
  adventurous: 'forward-leaning energy — the hero wants something and goes after it',
  'spooky-but-safe': 'mild creaky-floor tension that always resolves warmly — age-appropriate campfire feeling, never actually scary',
  bittersweet: 'real melancholy alongside joy — the lesson earns its weight, and not every ending is purely happy',
  hopeful: 'quiet optimism and rising feeling — things get a little better, page by page',
}

export const TONE_META: Record<Tone, { icon: string; label: string }> = {
  silly: { icon: '😂', label: 'Silly' },
  heartfelt: { icon: '🥰', label: 'Heartfelt' },
  adventurous: { icon: '⚡', label: 'Adventurous' },
  'spooky-but-safe': { icon: '👻', label: 'Spooky (safe)' },
  bittersweet: { icon: '🥀', label: 'Bittersweet' },
  hopeful: { icon: '🌅', label: 'Hopeful' },
}

export const DEPTH_MODIFIERS: Record<DepthModifier, { label: string; icon: string; description: string; directive: string }> = {
  'plot-twist': {
    label: 'Plot twist',
    icon: '🔀',
    description: 'One surprising reversal mid-story',
    directive:
      'Include one genuine reversal roughly two-thirds of the way through — something the reader will not see coming but that re-frames what came before. The twist must be kid-appropriate and satisfying, not cruel or frightening.',
  },
  'sensory-rich': {
    label: 'Sensory rich',
    icon: '✨',
    description: 'All five senses across the story',
    directive:
      'Weave all five senses (sight, sound, smell, taste, touch) across the story — distributed over pages so the world feels tangible. Do not cram them onto one page; let each sense land when it fits.',
  },
  'vocab-stretch': {
    label: 'Vocabulary stretch',
    icon: '📖',
    description: '2–3 new words with in-line definitions',
    directive:
      'Introduce 2–3 new vocabulary words appropriate for one year above the reading level. Define each in-line the first time via a short natural aside or parenthetical — never a glossary, never breaking the narrative.',
  },
  'character-arc': {
    label: 'Character arc',
    icon: '🌱',
    description: 'Hero visibly changes inside, not just outside',
    directive:
      'The hero must change measurably between page 1 and the end — an internal shift (e.g., from timid to steady, from rushed to patient). Show the shift through concrete action in a later page, not through narration telling us the hero has changed.',
  },
}
