# Image Generation Options

Last updated: 2026-03-30

## Current Provider

**OpenAI gpt-image-1** via raw fetch — standard ($0.005/img) or high ($0.04/img). Already integrated and deployed.

---

## Shortlisted Providers (4)

Cut criteria: must have a straightforward REST API, pay-per-image pricing, and no gated access. Prioritized providers we already have set up.

| # | Provider | Key Models | Cost/Image | Free Tier | Status |
|---|----------|-----------|------------|-----------|--------|
| 1 | **OpenAI** | gpt-image-1, GPT Image 1.5 | $0.005–0.20 | None | **Already integrated** (`OPENAI_API_KEY` set) |
| 2 | **Recraft** | V4 (raster + vector) | $0.04 (raster), $0.08 (SVG) | None | New — REST API, pay-per-image |
| 3 | **fal.ai** | FLUX.2 Pro, FLUX.1 Kontext, 600+ models | $0.015–0.055 | Promo credits ($10–50) | New — REST API, hosts all FLUX models + LoRAs |
| 4 | **Google** | Nano Banana 2 (Gemini 3.1 Flash) | Free | ~500 req/day (no credit card) | New — only meaningful free option |

**Cut:** Midjourney (no public API), Stability AI (older models, surpassed), Leonardo AI (opaque credit pricing), Ideogram (good but $0.06/img — GPT Image 1.5 covers text rendering), Together AI (redundant with fal.ai for FLUX), HF Inference (free credits exhausted).

### Why These Four

- **OpenAI** — already works, solid all-rounder, best prompt adherence for complex instructions
- **Recraft** — #1 for flat illustration / clean storybook art; built-in style consistency across image sets; 100+ style presets including watercolor, children's book, vector
- **fal.ai** — single API key unlocks FLUX.2 Pro (best photorealism), FLUX.1 Kontext (best character consistency via reference images), plus LoRA support for anime/Ghibli/sketch styles
- **Google** — free tier for development/testing and budget-conscious users; good general quality

---

## Children's Book Illustration Aesthetics (8)

Each aesthetic is inspired by iconic children's books with a distinctive visual identity.

| # | Aesthetic | Inspired By | Visual Description |
|---|-----------|------------|-------------------|
| 1 | **Comic Book** | Dog Man, Captain Underpants (Dav Pilkey) | Bold black outlines, flat bright colors, exaggerated expressions, hand-drawn energy |
| 2 | **Classic Watercolor** | Peter Rabbit (Beatrix Potter), The Gruffalo (Axel Scheffler) | Soft watercolor washes, delicate ink outlines, warm natural tones, detailed nature scenes |
| 3 | **Collage / Paper Cutout** | The Very Hungry Caterpillar (Eric Carle), Swimmy (Leo Lionni) | Layered tissue-paper textures, bold shapes, vibrant colors, handmade/tactile feel |
| 4 | **Whimsical Ink** | Matilda & Charlie (Quentin Blake / Roald Dahl), Where the Wild Things Are (Sendak) | Loose pen-and-ink lines, cross-hatching, energetic/messy, wildly expressive characters |
| 5 | **Bold & Modern** | Pete the Cat (James Dean), The Day the Crayons Quit (Oliver Jeffers) | Flat bold colors, clean graphic shapes, modern/poster-like, playful simplicity |
| 6 | **Soft & Cozy** | Goodnight Moon (Clement Hurd), Guess How Much I Love You (Anita Jeram) | Warm muted tones, soft edges, gentle shapes, calming bedtime feel |
| 7 | **Anime / Ghibli** | My Neighbor Totoro, Spirited Away (Studio Ghibli / Miyazaki) | Soft watercolor anime, lush detailed backgrounds, gentle characters, pastel palette |
| 8 | **Storybook Realism** | The Polar Express (Chris Van Allsburg), classic Disney storybook art | Rich painterly detail, dramatic lighting, cinematic composition, warm and immersive |

---

## The Table: Aesthetics x Providers

| Aesthetic | Primary Provider | Cost/Img | Why This Provider | Fallback | Fallback Cost |
|-----------|-----------------|----------|-------------------|----------|---------------|
| **Comic Book** | OpenAI (gpt-image-1) | $0.005–0.04 | Already integrated; good bold outlines + flat colors; strong prompt adherence | Google (free tier) | Free |
| **Classic Watercolor** | Recraft V4 | $0.04 | Dedicated watercolor style presets; style consistency across image sets | OpenAI | $0.005–0.04 |
| **Collage / Paper Cutout** | Recraft V4 | $0.04 | Excels at flat layered shapes and textured illustration; clean cutout aesthetic | OpenAI | $0.005–0.04 |
| **Whimsical Ink** | OpenAI (gpt-image-1) | $0.005–0.04 | Best at interpreting complex style instructions; good sketchy/hand-drawn output | fal.ai (FLUX.2 Pro) | $0.03–0.055 |
| **Bold & Modern** | Recraft V4 | $0.04 | Purpose-built for flat-color graphic illustration; poster-like output | OpenAI | $0.005–0.04 |
| **Soft & Cozy** | OpenAI (gpt-image-1) | $0.005–0.04 | Good at warm tones and gentle compositions; reliable all-rounder | Google (free tier) | Free |
| **Anime / Ghibli** | fal.ai (FLUX.2 + Ghibli LoRA) | $0.03–0.055 | Dedicated Ghibli Watercolor LoRA; anime LoRAs with clean linework | OpenAI | $0.005–0.04 |
| **Storybook Realism** | fal.ai (FLUX.2 Pro) | $0.03–0.055 | DSLR-level realism, cinematic lighting, depth of field — unmatched | OpenAI (GPT Image 1.5) | $0.009–0.20 |

### Character Consistency Layer

Regardless of which provider generates the images, character consistency can be enhanced:

| Approach | How | Cost | Benefit |
|----------|-----|------|---------|
| **Current** | Character sheet text in every prompt (OpenAI) | $0 extra | Works, not perfect |
| **Kontext upgrade** | Generate 1 reference image, then use FLUX.1 Kontext for all pages | +$0.015–0.04/page | Identity preserved across scenes via reference image |
| **Hybrid** | Use primary provider for page 1, feed result to Kontext for remaining pages | Mixed | Best consistency + best style per aesthetic |

---

## Integration Notes

### OpenAI (already integrated)
```
Endpoint: https://api.openai.com/v1/images/generations
Auth:     Authorization: Bearer $OPENAI_API_KEY
Format:   base64 (b64_json)
Note:     Uses raw fetch, not SDK (SDK auth bug with project-scoped keys)
```

### Recraft V4 (new)
```
Endpoint: https://external.api.recraft.ai/v1/images/generations
Auth:     Authorization: Bearer $RECRAFT_API_KEY
Format:   URL (download to buffer)
Feature:  `style` field with 100+ presets (e.g. "watercolor", "flat_illustration")
Feature:  Built-in series consistency across multiple generations
```

### fal.ai — FLUX.2 Pro + Kontext (new)
```
FLUX.2:   https://queue.fal.run/fal-ai/flux-pro/v1.1
Kontext:  https://queue.fal.run/fal-ai/flux-pro/kontext
Auth:     Authorization: Key $FAL_KEY
Feature:  LoRA support (Ghibli, anime, sketch styles)
Feature:  Kontext accepts `image_url` for character reference
```

### Google Nano Banana 2 (new, free)
```
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent
Auth:     x-goog-api-key: $GOOGLE_AI_KEY
Format:   Inline image data in Gemini response
Limit:    ~500 requests/day, no credit card required
```

### Env Vars Needed
```
OPENAI_API_KEY       — already set on Vercel
RECRAFT_API_KEY      — new
FAL_KEY              — new
GOOGLE_AI_KEY        — new (free, no billing)
```

### Prompt Rules (all providers)
- Always append "no text or words in the image"
- Embed character_sheet verbatim in every prompt
- Outfit remains the strongest consistency anchor
- Style prefix set per aesthetic (see STYLE_PREFIXES in lib/ai/index.ts)

---

## Anthropic Claude — Code-Generated Visuals (supplementary)

Claude cannot generate raster images. It can produce SVG/HTML visuals via code, but quality is geometric-mascot level — not suitable for main storybook illustrations.

**Useful for:** wizard character preview (instant SVG avatar), loading placeholders, coloring-book style as an intentional aesthetic, page border decorations.

**Not useful for:** any of the 8 main aesthetics above.

---

## Sources

- [AI Image Generation API Comparison 2026](https://blog.laozhang.ai/en/posts/ai-image-generation-api-comparison-2026)
- [Best AI Image Models 2026: 14 Generators Ranked](https://www.teamday.ai/blog/best-ai-image-models-2026)
- [10 Best AI Image Generators 2026 (fal.ai)](https://fal.ai/learn/tools/ai-image-generators)
- [Recraft API Pricing](https://www.recraft.ai/docs/api-reference/pricing)
- [GPT Image 1.5 Model](https://platform.openai.com/docs/models/gpt-image-1.5)
- [FLUX.2 Prompting Guide](https://docs.bfl.ml/guides/prompting_guide_flux2)
- [FLUX.1 Kontext (BFL)](https://bfl.ai/models/flux-kontext)
- [Gemini Image Generation Complete Guide](https://blog.laozhang.ai/en/posts/gemini-image-generation-complete-guide)
- [Character Consistency in AI Art: 2026 Breakthrough](https://aistorybook.app/blog/ai-image-generation/character-consistency-in-ai-art-solved)
- [Recraft: Comparing Text to Image Models](https://www.recraft.ai/blog/comparing-popular-and-high-performing-text-to-image-models-and-providers)
- [Google Imagen 4 Pricing](https://magichour.ai/blog/imagen-4-pricing-and-api)
- [Ideogram 3.0 Features](https://ideogram.ai/features/3.0)
