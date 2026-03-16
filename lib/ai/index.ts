// AI clients — story generation (Claude) and image generation (HF FLUX)
// Implementations go in: generate-story.ts, generate-image.ts

export const HF_IMAGE_MODEL = 'black-forest-labs/FLUX.1-schnell'
export const HF_ENDPOINT = `https://router.huggingface.co/hf-inference/models/${HF_IMAGE_MODEL}`

export const STYLE_PREFIXES: Record<string, string> = {
  'dog-man':
    "Children's comic book illustration in the style of Dav Pilkey's Dog Man: bold black outlines, flat bright colors, simple cartoonish shapes, hand-drawn feel, expressive faces, no text or words in the image.",
  watercolor:
    'Soft watercolor storybook illustration, dreamy and warm, classic picture-book feel, no text or words in the image.',
  'bold-bright':
    'Bold and bright children\'s illustration, flat colors, thick outlines, modern and playful, no text or words in the image.',
  'pencil-sketch':
    'Hand-drawn pencil sketch illustration, warm and cozy, textured lines, no text or words in the image.',
  'pixel-art':
    'Retro pixel art illustration, 16-bit style, bright colors, no text or words in the image.',
}
