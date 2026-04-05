# AI Image Generation API Landscape (March 2026)

> Comprehensive research for children's storybook illustration use cases.
> Last updated: 2026-03-30

---

## Table of Contents

1. [Arena Leaderboard Rankings](#arena-leaderboard-rankings)
2. [Provider Deep Dives](#provider-deep-dives)
   - [OpenAI](#1-openai)
   - [Black Forest Labs / FLUX](#2-black-forest-labs--flux)
   - [Google (Imagen + Gemini)](#3-google-imagen--gemini)
   - [Stability AI](#4-stability-ai)
   - [Midjourney](#5-midjourney)
   - [Recraft](#6-recraft)
   - [Ideogram](#7-ideogram)
   - [Leonardo AI](#8-leonardo-ai)
   - [ByteDance / Seedream](#9-bytedance--seedream)
   - [Together AI (aggregator)](#10-together-ai-aggregator)
   - [Replicate (aggregator)](#11-replicate-aggregator)
   - [fal.ai (aggregator)](#12-falai-aggregator)
   - [WaveSpeed AI (aggregator)](#13-wavespeed-ai-aggregator)
3. [Master Pricing Table](#master-pricing-table)
4. [Style Suitability Matrix](#style-suitability-matrix-for-childrens-storybooks)
5. [Recommendations for Kids Books App](#recommendations-for-kids-books-app)

---

## Arena Leaderboard Rankings

As of March 2026, the LM Arena text-to-image leaderboard (4.35M+ votes across 52 models) ranks the top models by Elo:

| Rank | Model | Elo Score | Approx. Cost/Image |
|------|-------|-----------|---------------------|
| 1 | GPT Image 1.5 (high) | ~1,265 | $0.04 |
| 2 | Nano Banana 2 (Gemini 3.1 Flash Image Preview) | ~1,258 | $0.045-0.067 |
| 3 | Nano Banana Pro (Gemini 3 Pro Image) | ~1,214 | $0.134 |
| 4 | FLUX.2 [max] | ~1,200 | $0.07+ |
| 5 | Seedream 4.0 | ~1,185 | $0.03-0.035 |
| 6 | FLUX.2 [pro] | ~1,170 est. | $0.07 |
| 7 | Recraft V4 | ~1,160 est. | $0.04 |
| 8 | Imagen 4 Ultra | ~1,155 est. | $0.06 |
| 9 | Midjourney V8 Alpha | ~1,150 est. | Sub only ($10-120/mo) |

**Key takeaway:** The top ~9 models span only ~115 Elo points. The practical quality difference between mid-tier and top-tier is smaller than ever. Budget-friendly models like Imagen 4 Fast ($0.02) and FLUX 2 Schnell ($0.015) deliver results that a casual observer would struggle to distinguish from premium outputs.

---

## Provider Deep Dives

### 1. OpenAI

#### Models

| Model | Status | Quality Tier | Cost (1024x1024) | Cost Range |
|-------|--------|-------------|-------------------|------------|
| **GPT Image 1.5** | Current flagship | Low/Med/High | $0.009 / $0.02 / $0.04 | $0.009-0.20 |
| **GPT Image 1** | Previous gen | Low/Med/High | $0.011 / $0.042 / $0.167 | $0.011-0.19 |
| **GPT Image 1 Mini** | Budget option | Low/Med/High | **$0.005** / $0.015 / $0.052 | $0.005-0.052 |
| DALL-E 3 | **Deprecated** (removal May 12, 2026) | N/A | Legacy | Migrate to GPT Image 1+ |
| DALL-E 2 | **Deprecated** | N/A | Legacy | N/A |

#### API Access
- **Endpoint:** `POST https://api.openai.com/v1/images/generations`
- **Auth:** `Authorization: Bearer $OPENAI_API_KEY`
- **SDK:** Official Python/Node SDKs; raw `fetch` also works (and avoids SDK bugs with project-scoped keys)
- **Output formats:** PNG, JPEG, WebP; supports transparent backgrounds
- **Batch API:** Available (but no 50% discount like Google)

#### Resolutions
- 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait), or `auto`
- All three quality tiers (low/medium/high) available at all sizes
- Generation time: 15-45 seconds depending on complexity and quality

#### Aesthetic Strengths
- **Excellent:** Photorealistic, modern illustration, bold graphic styles, text rendering (GPT Image 1.5 is best-in-class for in-image typography)
- **Good:** Cartoon/comic, watercolor, flat vector-like illustration
- **Prompt adherence:** Best in class -- GPT Image 1.5 parses complex multi-constraint prompts without dropping requirements (layout, color, composition, text)

#### Aesthetic Weaknesses
- Can produce a somewhat "polished/commercial" look that lacks organic hand-drawn feel
- Less stylistic variety compared to Midjourney -- tends toward a consistent OpenAI "house style"
- Anime/manga style is acceptable but not as refined as specialized models
- Older-style illustration aesthetics (woodcut, etching) are possible but not a strength

#### Character Consistency
- **Within edits:** Robust facial/identity preservation when editing existing images
- **Across independent generations:** No native character reference feature. Consistency relies entirely on prompt engineering (detailed character descriptions). Works reasonably well but not guaranteed
- **Rating:** 6/10 for cross-image consistency without reference images; 8/10 with image editing workflows

#### Key Advantage for Kids Books
GPT Image 1 Mini at $0.005/image (low quality) is the cheapest option from any major provider for decent-quality output. GPT Image 1.5 at $0.04 offers top-tier quality with unmatched prompt adherence.

---

### 2. Black Forest Labs / FLUX

#### Models

| Model | Type | Cost/Image (1MP) | Notes |
|-------|------|-------------------|-------|
| **FLUX.2 [pro]** | Premium | $0.07 | Best FLUX quality, up to 4MP (2048x2048) |
| **FLUX.2 [max]** | Ultra premium | $0.07+ | Highest quality tier |
| **FLUX.2 Klein 4B** | Lightweight | $0.014 | Sub-second generation, 4MP max |
| **FLUX.2 Klein 9B** | Mid-weight | ~$0.02 | Better quality than 4B |
| **FLUX.1 Kontext [pro]** | Character consistency | $0.04 | Reference image input, 90-95% character fidelity |
| **FLUX.1 Kontext [max]** | Premium consistency | ~$0.06 | Higher quality Kontext |
| **FLUX.1 Kontext [dev]** | Open-weight | Free (self-host) | Available on HuggingFace |
| FLUX.1 [pro] | Previous gen | $0.055 (Replicate) | Superseded by FLUX.2 |
| FLUX.1 [dev] | Open-weight | $0.025-0.030 | Good quality, self-hostable |
| FLUX.1 [schnell] | Fast/free | $0.003 (Replicate) | 1-4 steps, lower quality |

#### API Access
- **Direct (BFL):** `https://api.bfl.ai/` -- credit-based (1 credit = $0.01)
- **Via aggregators:** fal.ai, Replicate, Together AI, WaveSpeed
- **Pricing model:** Megapixel-based -- first MP costs more, additional MPs cost less
- **Open-weight models:** FLUX.1 Kontext [dev], FLUX.2 Klein available on HuggingFace for self-hosting

#### Resolutions
- Min: 64x64, Max: 4MP (~2048x2048)
- Dimensions must be multiples of 16
- Recommended: up to 2MP for optimal quality
- Aspect ratios: landscape_16_9, portrait_4_3, square, or custom width/height

#### Aesthetic Strengths
- **Excellent:** Photorealism (skin textures, lighting, depth of field), prompt adherence
- **Good:** Watercolor (captures fluidity and texture reasonably well), general illustration
- **Strong anatomical accuracy:** Better hands, fingers, and body proportions than older models

#### Aesthetic Weaknesses
- **Limited stylistic range:** Outputs often default to semi-realistic look when asked for highly stylized art (Studio Ghibli, graphic novel, etc.)
- **Cartoon/comic book:** Tends to add photorealistic details instead of staying flat/graphic
- **Lacks the "artistic ceiling" of Midjourney** -- technically impressive but can feel generic
- **Watercolor:** Doesn't fully capture transparency/wet-on-wet effects; can over-saturate

#### Character Consistency
- **FLUX Kontext is the standout here:** Accepts up to 10 reference images and maintains 90-95% character fidelity across generations without fine-tuning
- Preserves facial features, clothing, and identifying elements across different poses/scenes
- **Rating:** 9/10 with Kontext; 5/10 with standard FLUX models (prompt-only)

#### Key Advantage for Kids Books
FLUX Kontext is specifically designed for the children's storybook use case -- maintain a character across 10-20 pages by passing a reference image with each generation. At $0.04/image it's cost-competitive with GPT Image 1.5 while offering far superior character consistency.

---

### 3. Google (Imagen + Gemini)

#### Models

| Model | Cost/Image | Resolution | Notes |
|-------|-----------|------------|-------|
| **Imagen 4 Fast** | **$0.02** | Up to 1408x768 | Best value in entire ecosystem |
| **Imagen 4 Standard** | $0.04 | Up to 2048x2048 | Balanced quality/cost |
| **Imagen 4 Ultra** | $0.06 | Up to 2K+ | Highest Imagen quality |
| **Nano Banana 2** (Gemini 3.1 Flash Image Preview) | $0.045-0.067 | Up to 4K | #1 on Arena leaderboard, fast |
| **Nano Banana Pro** (Gemini 3 Pro Image) | $0.134 | Up to 4K | Premium quality, advanced controls |
| Gemini 2.5 Flash Image (Nano Banana) | $0.039 | Up to 2K | Original Nano Banana |

#### API Access
- **Imagen 4:** Vertex AI (GCP) -- `https://cloud.google.com/vertex-ai/`
- **Gemini/Nano Banana:** Google AI Studio / Gemini Developer API -- `https://ai.google.dev/`
- **Auth:** GCP service account or API key
- **Batch API:** 50% discount on all models (significant cost advantage)
- **Free tier:** Google AI Studio web UI has limited free quotas
- **Subscription:** AI Pro ($19.99/mo) = 100 NB Pro images/day; AI Ultra ($30/mo) = 1,000/day

#### Resolutions
- Imagen 4: Aspect ratios 1:1, 3:4, 4:3, 9:16, 16:9; resolution controlled via `sampleImageSize` param
- Nano Banana 2: 512px to 4096px, with pricing scaling by resolution
- Up to 4 images per API call (`sampleCount`)

#### Aesthetic Strengths
- **Excellent:** Photorealism (material rendering, lighting), text rendering (Imagen 4 treats typography as part of the image), prompt adherence
- **Good:** Artistic styles (Imagen 4 broadened range beyond photorealism), editorial illustration
- **Nano Banana Pro:** Advanced physics controls (lighting, camera, focus, color grading)

#### Aesthetic Weaknesses
- **"Plastic" skin textures** -- realistic human skin has reportedly regressed to smooth, AI-looking outputs
- **Numerical/spatial reasoning:** Struggles with complex compositional and spatial prompts
- **Fine typography:** Tiny fonts, tight curves, or text wrapping around objects can blur
- **Inconsistent instruction adherence:** Sometimes misses subtle details or moods
- **Less "artistic" than Midjourney** for purely creative/expressive outputs

#### Character Consistency
- No native reference image feature like FLUX Kontext
- Relies on prompt engineering for consistency
- Nano Banana Pro has style reference capabilities but not character-level
- **Rating:** 5/10 (prompt-only consistency)

#### Key Advantage for Kids Books
Imagen 4 Fast at $0.02/image with Batch API discount ($0.01/image) is the most cost-effective option for production volumes. Nano Banana 2 offers top-tier quality at half the cost of Nano Banana Pro.

---

### 4. Stability AI

#### Models

| Model | Credits | Cost/Image | Notes |
|-------|---------|-----------|-------|
| **Stable Image Ultra** (SD 3.5 Large-based) | 8 credits | $0.08 | State-of-the-art Stability model |
| **SD 3.5 Large** | 6.5 credits | $0.065 | Best open-weight quality |
| **SD 3.5 Medium** | 3.5 credits | $0.035 | Good balance |
| **SD 3.5 Turbo** | 4 credits | $0.04 | Fast generation |
| **Stable Image Core** | Varies | ~$0.03 | General purpose |
| **SDXL** | ~1 credit | ~$0.01 | Older, cheap, huge LoRA ecosystem |

#### API Access
- **Platform:** `https://platform.stability.ai/`
- **Pricing:** Credit-based (1 credit = $0.01)
- **Free tier:** 25 credits on signup (~4-6 images with Ultra, ~25 with SDXL)
- **Self-hosting:** Model weights on HuggingFace; open-source for <$1M revenue (Stability AI Community License)
- **No SD4 announced** as of March 2026

#### Resolutions
- SD 3.5 Large: Effective range 960-1152px square; breaks above that range
- SDXL: 1024x1024 native; various aspect ratios with fine-tuned models
- Ultra: Higher resolution support via upscaling pipeline

#### Aesthetic Strengths
- **Excellent:** Anime/manga (out of the box without fine-tuning), diverse realistic characters (less face-type bias than older models or FLUX), stylized art with varied lighting
- **Good:** Photorealism (skin texture, fingers, fabrics), prompt adherence (better than SDXL)
- **SDXL ecosystem:** Thousands of community LoRA fine-tunes for every conceivable style

#### Aesthetic Weaknesses
- **Hands and anatomy:** Still struggles with complex hand poses and object consistency
- **Sweaters/clothing wrinkles:** Specific fabric rendering issues
- **Resolution limits:** Image quality degrades noticeably above the effective resolution range
- **Higher VRAM requirements** for self-hosting (SD 3.5 Large needs significant GPU memory)
- **Generally behind** FLUX 2 and GPT Image 1.5 on quality benchmarks

#### Character Consistency
- No native reference image feature in the API
- **LoRA fine-tuning** is the primary approach -- train a lightweight adapter on 5-20 reference images of your character
- SDXL has the most mature LoRA ecosystem for character consistency
- **Rating:** 4/10 (API prompt-only); 7/10 (with custom LoRA training)

#### Key Advantage for Kids Books
Self-hosting SDXL or SD 3.5 with custom LoRAs gives unlimited free generation with strong character consistency. The anime/illustration style works well out of the box. Best for teams willing to manage infrastructure.

---

### 5. Midjourney

#### Models

| Model | Status | Access | Notes |
|-------|--------|--------|-------|
| **Midjourney V8 Alpha** | Launched March 17, 2026 | Alpha website only | 5x faster, native 2K, better text |
| **Midjourney V7** | Stable | Web + Discord | Production-ready |
| Midjourney V6.1 | Previous gen | Discord | Still available |

#### API Access
- **NO official public API** as of March 2026
- API keys are restricted to Enterprise dashboard -- must apply for developer access
- **Third-party wrappers:** Unofficial APIs from $0.01/image to $39+/month
- **Subscription required:** Basic ($10/mo), Standard ($24/mo), Pro ($48/mo), Mega ($120/mo)
- **No free tier or trial** for new users

#### Resolutions
- V8: Native 2K resolution via `--hd` parameter (no upscaling needed)
- V7: 1024x1024 default, upscale to 4x
- Aspect ratios: `--ar 16:9`, `--ar 3:4`, etc.

#### Aesthetic Strengths
- **Excellent:** Artistic expression, stylistic range (the widest of any model), cinematic composition, dramatic lighting, painterly effects
- **Excellent:** Watercolor, oil painting, concept art, editorial illustration, fantasy art
- **Good:** Cartoon, anime, pixel art, any artistic style you can describe
- **V8 Style Creator:** Build and save custom "visual DNA" for consistent style application

#### Aesthetic Weaknesses
- **Photorealism:** Has improved but still has a "Midjourney look" -- slightly dreamy/stylized
- **Text rendering:** V8 dramatically improved but still behind GPT Image 1.5 and Ideogram
- **Prompt literalness:** Sometimes interprets prompts creatively rather than literally
- **No API** makes it impractical for automated pipelines

#### Character Consistency
- **Character Reference (`--cref`):** V8 significantly improved -- faces, clothing, and proportions stay consistent across varied compositions
- Dedicated feature for character locking across generations
- **Rating:** 8/10 with `--cref`; requires manual workflow (no API automation)

#### Key Advantage for Kids Books
Midjourney produces the most "artistic" and visually appealing storybook illustrations. The Style Creator + Character Reference combo is excellent for consistent storybook characters. **Major blocker:** No API means no automated pipeline integration.

---

### 6. Recraft

#### Models

| Model | Cost/Image (raster) | Cost/Image (vector SVG) | Notes |
|-------|---------------------|------------------------|-------|
| **Recraft V4** | $0.04 | $0.08 | Current flagship, #1 on HF leaderboard |
| **Recraft V3** | $0.04 | $0.08 | Previous gen, still available |

#### API Access
- **Direct:** `https://api.recraft.ai/`
- **Via aggregators:** fal.ai ($0.04/image), Replicate
- **Features:** Batch jobs, async processing, background removal, inpainting, outpainting
- **Unique:** Only AI model generating production-quality SVG vector output

#### Resolutions
- Raster: Up to 2048x2048
- Vector SVG: Scalable to any size (actual structured SVG with clean paths and layers)

#### Aesthetic Strengths
- **Excellent:** Vector illustration, logo/icon design, typography, editorial illustration, design-forward compositions
- **Excellent:** Maintains visual hierarchy, focus, and clarity -- "design taste"
- **Good:** Photorealism (V4 improved textures/lighting), etchings, woodcuts, Ghibli-style painting
- **Unique SVG capability:** Editable vector files that open in Illustrator/Figma with structured layers

#### Aesthetic Weaknesses
- Inconsistency on fine details across complex scenes
- Less suited for photorealistic humans (skin, expressions)
- No native image editing workflow (unlike Nano Banana Pro)
- Mobile/complex multi-layer workflows have bugs

#### Character Consistency
- V4 prioritizes style consistency across series of images
- No dedicated character reference feature like FLUX Kontext or Midjourney --cref
- **Rating:** 6/10 (style consistency is strong; character-level consistency is prompt-dependent)

#### Key Advantage for Kids Books
SVG vector output is unique and ideal for print-quality storybooks. The "design taste" means illustrations feel deliberate rather than generic. Good for bold, modern illustration styles with clean lines.

---

### 7. Ideogram

#### Models

| Model | Cost/Image | Speed | Notes |
|-------|-----------|-------|-------|
| **Ideogram V3** | $0.03-0.05 | ~4 seconds | Best text rendering in the industry |
| **Ideogram V3 Turbo** | $0.03 | ~2 seconds | Faster, slightly lower quality |

#### API Access
- **Direct:** `https://api.ideogram.ai/`
- **Via Together AI, Replicate**
- **Subscription required for API:** Plus tier ($15/mo) minimum
- **Quality tiers:** Turbo (fastest), Default (balanced), Quality (highest fidelity)

#### Resolutions
- square, square_hd, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
- Character reference images supported (billed separately)

#### Aesthetic Strengths
- **Excellent:** Text rendering -- the undisputed leader. Text in quotes reliably appears correctly in the image
- **Good:** Graphic design, posters, marketing materials, logos with text
- **Good:** General illustration, stylized art

#### Aesthetic Weaknesses
- Less photorealistic than FLUX 2 or GPT Image 1.5
- Artistic range is narrower than Midjourney
- Can produce a slightly "digital/flat" look
- Fine detail and complex scene composition not as strong

#### Character Consistency
- Ideogram 3.0 now supports character consistency via character reference images
- Relatively new feature -- not as mature as FLUX Kontext or Midjourney --cref
- **Rating:** 6/10

#### Key Advantage for Kids Books
If your storybook needs readable text within illustrations (character names on signs, book titles within scenes, labels), Ideogram is the only reliable option. At $0.03/image it's also very affordable.

---

### 8. Leonardo AI

#### Models

| Model | Specialty | Token Cost | Notes |
|-------|-----------|-----------|-------|
| **Phoenix 1.0** | Prompt adherence, text rendering | Varies by config | In-house foundational model |
| **Kino XL** | Cinematic/dramatic | Varies | Wide aspect ratios, movie-like |
| Various SDXL fine-tunes | Multiple styles | Varies | Broad model library |

#### API Access
- **Endpoint:** `https://cloud.leonardo.ai/api/rest/v1/`
- **Free credits:** $5 API credit on new accounts
- **Token-based pricing:** Tokens deducted based on GPU load; varies by model/resolution/settings
- **Subscription plans:** Apprentice ($10/mo, 8,500 tokens), Artisan ($24/mo), Maestro ($48/mo, 60,000 tokens)
- **Pricing calculator:** Available at docs.leonardo.ai for estimating costs per configuration

#### Resolutions
- Phoenix: Up to 5MP+ via Ultra generation mode
- Standard: 1024x1024, various aspect ratios
- Custom resolutions available

#### Aesthetic Strengths
- **Excellent:** Flat illustration, vector-style stickers, game assets, prompt adherence (Phoenix)
- **Good:** Cinematic compositions (Kino XL), text rendering (Phoenix), photorealism
- **Broad model library:** Access to multiple specialized fine-tunes

#### Aesthetic Weaknesses
- Token-based pricing makes cost prediction difficult
- Quality varies significantly between models
- Less competitive on raw quality benchmarks vs FLUX 2 or GPT Image 1.5
- Platform is more consumer/creator-focused than developer-focused

#### Character Consistency
- Supports LoRA-based fine-tuning for character consistency
- Image-to-image guidance available
- **Rating:** 6/10

#### Key Advantage for Kids Books
The $5 free API credit allows substantial testing. Phoenix's prompt adherence is strong for ensuring scene descriptions are followed accurately. Good for flat/vector illustration styles common in children's books.

---

### 9. ByteDance / Seedream

#### Models

| Model | Cost/Image | Speed | Notes |
|-------|-----------|-------|-------|
| **Seedream 5.0 Lite** | ~$0.04 | 2-3 seconds | Latest, with web search and deep thinking |
| **Seedream 4.5** | $0.035-0.045 | Fast | Strong general quality |
| **Seedream 4.0** | $0.03-0.035 | Fast | Elo ~1,185, excellent value |

#### API Access
- **Direct:** `https://seed.bytedance.com/`
- **Via aggregators:** Together AI ($0.04), Replicate, ModelsLab, Atlas Cloud, fal.ai
- **No official free tier** (aggregator free credits apply)

#### Resolutions
- Native 2K and 4K image outputs
- Generation: 2-3 seconds per image (very fast)

#### Aesthetic Strengths
- **Excellent:** Photorealism, marketing/promotional materials, multilingual text embedding
- **Good:** General illustration, diverse styles
- **Unique:** Web integration -- can reflect current events/trends in generated images (5.0 Lite)
- **Fast generation** (~2-3 seconds)

#### Aesthetic Weaknesses
- Less established ecosystem than FLUX or OpenAI
- Limited community resources, LoRAs, and style guides
- Artistic/stylized illustration range not as well-documented
- Text rendering for non-Latin scripts is a strength, but children's storybook styles specifically are under-documented

#### Character Consistency
- No dedicated character reference feature documented
- Relies on prompt engineering
- **Rating:** 4/10

#### Key Advantage for Kids Books
Very fast generation (2-3 seconds) at competitive pricing. Seedream 4.0 punches above its weight at $0.03/image. Good fallback option but not the primary recommendation.

---

### 10. Together AI (Aggregator)

#### Available Image Models

| Model | Cost/Image | Notes |
|-------|-----------|-------|
| FLUX.1 Schnell | ~$0.003 | Cheapest FLUX |
| FLUX.1 Dev | $0.025 | Good quality open-weight |
| FLUX.1 Kontext [pro] | $0.04 | Character consistency |
| FLUX.1 Kontext [max] | ~$0.06 | Premium character consistency |
| Seedream 5.0 Lite | $0.04 | ByteDance latest |
| Ideogram 3.0 | $0.03 | Best text rendering |
| Dreamshaper | $0.0006 | Cheapest option overall |

#### API Access
- **Endpoint:** `https://api.together.xyz/v1/images/generations`
- **Auth:** `Authorization: Bearer $TOGETHER_API_KEY`
- **Free signup credits** available
- **OpenAI-compatible API** format

#### Key Advantage
Single API key accesses multiple providers. Good for A/B testing different models. OpenAI-compatible endpoint makes switching easy.

---

### 11. Replicate (Aggregator)

#### Available Image Models

| Model | Cost/Image | Notes |
|-------|-----------|-------|
| FLUX.1 [schnell] | $0.003 | Fast and cheap |
| FLUX.1 [dev] | $0.030 | Good quality |
| FLUX.1 [pro] | $0.055 | Premium FLUX |
| FLUX 2 variants | $0.04-0.08 | Latest FLUX |
| Recraft V4 SVG | $0.04 (raster) / $0.08 (vector) | True SVG output |
| Ideogram V3 Turbo | $0.03 | Fast text rendering |
| GPT Image 1.5 | ~$0.04 | OpenAI via Replicate |
| Stable Diffusion XL | ~$0.005 | Legacy, cheap |
| Seedream 5 Lite | Varies | ByteDance |
| Imagen 4 Fast | ~$0.02 | Google via Replicate |

#### API Access
- **Endpoint:** `https://api.replicate.com/v1/predictions`
- **Pricing:** Per-second GPU billing (varies by hardware); some models use per-image pricing
- **Free tier:** Limited free runs for new accounts
- **Largest model catalog** of any aggregator (1000+ models)

#### Key Advantage
Widest selection of models including fine-tunes, LoRAs, and community models. "Try for free" collection lets you test before committing.

---

### 12. fal.ai (Aggregator)

#### Available Image Models

| Model | Cost/Image | Notes |
|-------|-----------|-------|
| FLUX.2 [pro] | $0.03/MP | Latest FLUX |
| FLUX.1 Dev | $0.025 | Open-weight |
| FLUX.1 Kontext [pro] | $0.04 | Character consistency |
| Recraft V3 | $0.04 (raster) / $0.08 (vector) | Vector output |
| Recraft V4 | $0.04 | Latest Recraft |
| Seedream V4.5 | $0.04 | ByteDance |
| Nano Banana 2 | ~$0.08 | Google's latest |

#### API Access
- **Endpoint:** `https://fal.run/`
- **Pricing:** Pay-per-use, no subscriptions or minimums
- **Promo credits:** $10-50 for new accounts
- **1000+ models** available
- **Fastest inference engine** claim

#### Key Advantage
Speed-optimized infrastructure. Claims fastest inference times. Good for real-time/interactive generation. No minimum commitments.

---

### 13. WaveSpeed AI (Aggregator)

#### Pricing
- Pay-per-use, no monthly fees
- Starting at $0.005/image (FLUX Dev Ultra Fast)
- Standard models ~$0.035/image; HD ~$0.070/image
- **Free trial:** $1 credit on signup

#### Tiers
- Bronze (default), Silver ($100), Gold ($1,000), Ultra ($10,000)
- Higher tiers unlock more concurrent tasks and rate limits (Gold: 3,000 images/min)

#### Key Advantage
High throughput for batch generation. Gold tier supports 3,000 images/min -- useful for generating entire storybooks in seconds.

---

## Master Pricing Table

Sorted by cost per standard image (1024x1024 equivalent):

| Model | Provider | Cost/Image | Quality (Elo) | Character Consistency | Text Rendering |
|-------|----------|-----------|---------------|----------------------|----------------|
| Dreamshaper | Together AI | **$0.0006** | Decent | Low | Poor |
| FLUX.1 Schnell | Various | $0.003 | ~1,232 | Low | Poor |
| **GPT Image 1 Mini (low)** | OpenAI | **$0.005** | Good | Medium | Good |
| WaveSpeed FLUX Dev Ultra Fast | WaveSpeed | $0.005 | Good | Low | Fair |
| SDXL | Replicate | ~$0.005 | Decent | Low (7/10 w/ LoRA) | Poor |
| GPT Image 1.5 (low) | OpenAI | $0.009 | Good | Medium | Excellent |
| FLUX.2 Klein 4B | BFL | $0.014 | Good | Low | Fair |
| FLUX 2 Schnell | Various | $0.015 | Good | Low | Fair |
| **Imagen 4 Fast** | Google | **$0.02** | Strong | Low | Good |
| GPT Image 1.5 (medium) | OpenAI | $0.02 | ~1,264 | Medium | Excellent |
| FLUX.1 Dev | Various | $0.025 | ~1,245 | Low | Fair |
| **Ideogram V3** | Ideogram | **$0.03** | Good | Medium | **Excellent** |
| Seedream 4.0 | Various | $0.03 | ~1,185 | Low | Good |
| SD 3.5 Medium | Stability AI | $0.035 | Good | Low | Fair |
| Seedream 5.0 Lite | Together AI | $0.04 | Good | Low | Good |
| **FLUX.1 Kontext [pro]** | BFL/fal.ai | **$0.04** | Good | **Excellent (9/10)** | Fair |
| **GPT Image 1.5 (high)** | OpenAI | **$0.04** | **~1,265** | Medium | **Excellent** |
| **Recraft V4** | Recraft | **$0.04** | ~1,160 | Medium | Good |
| Imagen 4 Standard | Google | $0.04 | Strong | Low | Good |
| **Nano Banana 2** | Google | **$0.045-0.067** | **~1,258** | Low | Good |
| Imagen 4 Ultra | Google | $0.06 | Strong | Low | Good |
| SD 3.5 Large | Stability AI | $0.065 | Good | Low | Fair |
| **FLUX.2 [pro]** | BFL | **$0.07** | ~1,170 | Low | Fair |
| Stable Image Ultra | Stability AI | $0.08 | Good | Low | Fair |
| **Nano Banana Pro** | Google | **$0.134** | ~1,214 | Low | Good |
| Midjourney V8 | Midjourney | Sub only | ~1,150 | High (8/10 w/ --cref) | Good |

---

## Style Suitability Matrix for Children's Storybooks

Rating: Excellent / Good / Fair / Poor

| Style | Best Models | Good Models | Fair Models | Notes |
|-------|------------|-------------|-------------|-------|
| **Cartoon / Comic Book** (bold outlines, flat colors) | Recraft V4, Leonardo Phoenix | Midjourney V8, GPT Image 1.5 | FLUX.2, Imagen 4 | Recraft's design taste + SVG output ideal for bold flat styles |
| **Watercolor / Soft Storybook** | Midjourney V8, Nano Banana Pro | GPT Image 1.5, FLUX.1 | Imagen 4, SD 3.5 | Midjourney captures flowing transparency best; FLUX can over-saturate |
| **Hand-drawn / Pencil Sketch** | Midjourney V8, Recraft V4 | SD 3.5 (w/ LoRA), Leonardo | FLUX.2, GPT Image 1.5 | Midjourney's artistic range wins; SD 3.5 LoRAs add specificity |
| **Bold & Bright Modern Illustration** | GPT Image 1.5, Recraft V4 | FLUX Kontext, Nano Banana 2 | Imagen 4, Ideogram V3 | GPT Image 1.5 excels at polished modern styles |
| **Pixel Art / Retro** | Midjourney V8, SD 3.5 (w/ LoRA) | FLUX.1 Dev | GPT Image 1.5, Imagen 4 | Niche style -- LoRA fine-tunes outperform general models |
| **Anime / Manga** | SD 3.5, Midjourney V8 | FLUX.1 Dev, Leonardo | GPT Image 1.5, Imagen 4 | SD 3.5 excels at anime without fine-tuning |
| **Claymation / 3D Render** | GPT Image 1.5, Midjourney V8 | FLUX.2, Nano Banana Pro | Imagen 4, Recraft V4 | GPT Image 1.5's polished look suits 3D render aesthetic |
| **Paper Cutout / Collage** | Midjourney V8 | Recraft V4, GPT Image 1.5 | FLUX.2, SD 3.5 | Highly stylized -- Midjourney's creativity shines |
| **Consistency Across 10-20 Pages** | **FLUX Kontext** | Midjourney (--cref) | GPT Image 1.5 (editing) | FLUX Kontext designed for this exact use case |

---

## Recommendations for Kids Books App

### Current Setup Assessment

The app currently uses OpenAI `gpt-image-1` via raw fetch. Based on this research, here are upgrade recommendations:

### Tier 1: Best Overall for Storybooks

**FLUX Kontext [pro]** via fal.ai or Together AI -- $0.04/image
- Solves the #1 problem: character consistency across pages (90-95% fidelity)
- Pass a reference image of the character with each page generation
- No fine-tuning or LoRA training needed
- Works with existing prompt structure (style prefix + character description + scene)
- API is straightforward REST

### Tier 2: Best Quality (When Consistency is Less Critical)

**GPT Image 1.5 (medium/high)** -- $0.02-0.04/image
- Top Elo ranking, best prompt adherence, excellent text rendering
- Good for cover pages and title pages where in-image text matters
- Already integrated via OpenAI API

### Tier 3: Best Budget Option

**Imagen 4 Fast** via Vertex AI -- $0.02/image ($0.01 with Batch API)
- Strong quality for the price
- Good for high-volume generation or budget-conscious users
- Requires GCP account setup

### Tier 4: Cheapest Possible

**GPT Image 1 Mini (low)** -- $0.005/image
- Already compatible with current OpenAI integration
- 85-90% of full model quality at 54-70% less cost
- Best for draft/preview generation before committing to higher quality

### Recommended Architecture

```
Draft/Preview:  GPT Image 1 Mini (low)     → $0.005/image
Final Quality:  FLUX Kontext [pro]          → $0.04/image  (character pages)
                GPT Image 1.5 (medium)      → $0.02/image  (cover/title with text)
Vector Export:  Recraft V4 SVG              → $0.08/image  (print-quality output)
```

### Migration Priority

1. **Immediate:** Switch from `gpt-image-1` to `gpt-image-1-mini` for cost savings (same API, change model param)
2. **Short-term:** Add FLUX Kontext [pro] integration for character-consistent page generation
3. **Medium-term:** Add Imagen 4 Fast as a budget quality option in the wizard
4. **Optional:** Add Recraft V4 SVG for print-on-demand export

---

## Sources

- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [OpenAI Image Generation Docs](https://platform.openai.com/docs/guides/image-generation)
- [GPT Image 1.5 Prompting Guide](https://cookbook.openai.com/examples/multimodal/image-gen-1.5-prompting_guide)
- [OpenAI Deprecations (DALL-E 3)](https://developers.openai.com/api/docs/deprecations)
- [Black Forest Labs Pricing](https://bfl.ai/pricing)
- [BFL FLUX.2 Documentation](https://docs.bfl.ml/flux_2/flux2_text_to_image)
- [FLUX Kontext Announcement](https://bfl.ai/announcements/flux-1-kontext)
- [FLUX Kontext on Together AI](https://www.together.ai/blog/flux-1-kontext)
- [Google Vertex AI Imagen 4 Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate)
- [Gemini Developer API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Nano Banana Pro Announcement](https://blog.google/innovation-and-ai/products/nano-banana-pro/)
- [Nano Banana 2 Announcement](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)
- [Stability AI Platform Pricing](https://platform.stability.ai/pricing)
- [Midjourney V8 Features Guide](https://wavespeed.ai/blog/posts/what-is-midjourney-v8-features-pricing-how-to-use-2026/)
- [Midjourney V8 vs V7 Comparison](https://www.mindstudio.ai/blog/midjourney-v8-vs-v7-comparison)
- [Recraft V4 Introduction](https://www.recraft.ai/blog/introducing-recraft-v4-design-taste-meets-image-generation)
- [Recraft API Pricing](https://www.recraft.ai/docs/api-reference/pricing)
- [Ideogram API Pricing](https://ideogram.ai/features/api-pricing)
- [Ideogram 3.0 on Together AI](https://www.together.ai/models/ideogram-3-0)
- [Leonardo AI API Docs](https://docs.leonardo.ai/docs/plan-with-the-pricing-calculator)
- [Seedream 5.0 Lite](https://seed.bytedance.com/en/seedream5_0_lite)
- [Together AI Pricing](https://www.together.ai/pricing)
- [Replicate Pricing](https://replicate.com/pricing)
- [Replicate Image Models Collection](https://replicate.com/collections/text-to-image)
- [fal.ai Pricing](https://fal.ai/pricing)
- [fal.ai FLUX Models](https://fal.ai/flux)
- [WaveSpeed AI Pricing](https://wavespeed.ai/pricing)
- [LM Arena Text-to-Image Leaderboard](https://arena.ai/leaderboard/text-to-image)
- [Artificial Analysis Image Leaderboard](https://artificialanalysis.ai/image/leaderboard/text-to-image)
- [AI Image Generation API Comparison 2026](https://blog.laozhang.ai/en/posts/ai-image-generation-api-comparison-2026)
- [Character Consistency in AI Art 2026](https://aistorybook.app/blog/ai-image-generation/character-consistency-in-ai-art-solved)
- [Best AI Image Models 2026 Ranked](https://www.teamday.ai/blog/best-ai-image-models-2026)
- [Complete Guide to AI Image APIs 2026](https://wavespeed.ai/blog/posts/complete-guide-ai-image-apis-2026/)
