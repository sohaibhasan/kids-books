// AI clients — story generation (Claude) and image generation (multi-provider router)
// Implementations go in: generate-story.ts, generate-image.ts

export const STYLE_PREFIXES: Record<string, string> = {
  'comic-book':
    "Children's comic book illustration: bold black outlines, flat bright colors, simple cartoonish shapes, hand-drawn feel, exaggerated expressions, dynamic action poses, no text or words in the image.",
  'classic-watercolor':
    'Classic watercolor storybook illustration: soft watercolor washes, delicate ink outlines, warm natural tones, detailed nature scenes, gentle light and shadow, no text or words in the image.',
  'paper-collage':
    'Paper collage illustration: layered tissue-paper textures, bold cut-out shapes, vibrant overlapping colors, handmade tactile feel, visible paper grain, no text or words in the image.',
  'whimsical-ink':
    'Whimsical pen-and-ink illustration: loose energetic ink lines, cross-hatching, sketchy and expressive characters, wildly exaggerated features, messy charm, no text or words in the image.',
  'bold-modern':
    'Bold modern children\'s illustration: flat solid colors, clean graphic shapes, poster-like composition, playful minimalist simplicity, strong contrast, no text or words in the image.',
  'soft-cozy':
    'Soft and cozy bedtime illustration: warm muted pastel tones, soft blurred edges, gentle rounded shapes, calming atmosphere, golden evening light, no text or words in the image.',
  'anime-ghibli':
    'Studio Ghibli-inspired watercolor anime illustration: soft pastel palette, lush detailed backgrounds, gentle expressive characters, dreamy atmospheric lighting, whimsical nature details, no text or words in the image.',
  'storybook-realism':
    'Painterly storybook realism: rich oil-painting detail, dramatic cinematic lighting, warm immersive atmosphere, depth of field, classical composition, no text or words in the image.',
}
