# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web app where parents, teachers, and caregivers create personalized illustrated storybooks for children. Users customize characters, settings, themes, and lessons — then get a page-by-page storybook they can share via link or print.

## Live Links

- **Repo:** https://github.com/sohaibhasan/kids-books
- **GitHub Pages:** https://sohaibhasan.github.io/kids-books/
- **First story:** https://sohaibhasan.github.io/kids-books/stories/aamilah-and-the-dragon-treasure/

## Planned Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) + Tailwind CSS |
| Animation | Framer Motion or react-spring |
| State | Zustand or React Context |
| Backend | Next.js API routes or Node/Python service |
| AI Story Gen | Claude API (Anthropic) |
| AI Image Gen | Hugging Face Inference API — FLUX.1-schnell (free tier) |
| Database | PostgreSQL via Supabase or PlanetScale |
| File Storage | AWS S3 or Cloudflare R2 |
| Auth | Clerk, NextAuth, or Supabase Auth |
| Hosting | Vercel or Cloudflare Pages |

## Current State

The Next.js app (Phase 1 MVP) is built and working end-to-end locally. The full pipeline — Wizard → Claude story generation → HF image generation → `/read/[slug]` reader — is wired up and functional. Stories are persisted to `public/generated/[slug]/` (gitignored). For sharing, AI-generated stories are exported as self-contained HTML files and deployed to GitHub Pages.

### Next.js App Structure

```
app/
  page.tsx                        ← Landing page
  wizard/page.tsx                 ← 6-step story wizard
  generating/[slug]/page.tsx      ← Live image generation progress (SSE)
  read/[slug]/page.tsx            ← Story reader (server component)
  api/stories/route.ts            ← POST: Claude story gen → story.json
  api/stories/[slug]/images/route.ts  ← GET SSE: HF image gen → page-XX.png
components/
  wizard/WizardContainer.tsx      ← Wizard state + navigation
  wizard/steps/                   ← StepChild, StepGenre, StepTheme, StepSetting, StepStyle, StepReview
  reader/StoryReader.tsx          ← Page-by-page reader client component
  ui/                             ← Button, Input, SelectCard
lib/
  ai/generate-story.ts            ← Claude API call, age-tier vocab, JSON output
  ai/generate-image.ts            ← HF FLUX API call, returns Buffer
  ai/index.ts                     ← STYLE_PREFIXES map per ArtStyle
  utils/slug.ts                   ← makeSlug()
types/index.ts                    ← WizardFormData, Story, Page, ArtStyle, etc.
public/generated/[slug]/          ← story.json + page-XX.png (gitignored)
```

### Generated Story JSON Shape (Next.js)

```json
{
  "slug": "story-slug",
  "title": "Story Title",
  "form": { "...wizard inputs..." },
  "pages": [{ "page_number", "type", "text_content", "scene_description" }],
  "created_at": "ISO timestamp",
  "images_done": true
}
```

`page.type` is `"cover"`, `"end"`, or omitted (story page).

### GitHub Pages Static Reader (Prototype)

Self-contained HTML files with base64-encoded images, used for shareable links before Vercel deployment:
```
stories/<story-slug>/index.html   ← all images base64-inlined
```
URL pattern: `https://sohaibhasan.github.io/kids-books/stories/<story-slug>/`

Published stories:
- Aamilah and the Dragon's Treasure — `aamilah-and-the-dragon-treasure`
- Minha and the Kind Little Spark — `minha-and-the-kind-little-spark`

## Architecture

### Core Data Model

```
User → Story → Page (text + illustration + scene prompt)
             → Character (protagonist/supporting + reference image)
```

- `Story` has a unique `share_slug` for public reader URLs (`/read/:slug`)
- `Page` stores both generated text and the scene description prompt used for image generation
- `Character` stores appearance details and a reference image URL for cross-page consistency

### Implemented API Endpoints

```
POST   /api/stories                     → Wizard inputs → Claude story JSON → Supabase insert → returns {slug}
GET    /api/stories/[slug]/images       → SSE stream: generates images via OpenAI gpt-image-1, uploads to Supabase Storage, streams progress (maxDuration=300)
```

### User Flow

1. **Wizard** — collect child details, genre, theme/lesson, setting, characters, tone, length
2. **Generate** — Claude API produces story text; image API generates per-page illustrations
3. **Storyboard editor** — drag-and-drop cards to reorder/edit/regenerate pages
4. **Publish** — shareable reader link, full-screen page-turn UI

## Image Generation

**Architecture:** Multi-provider routing — each art style maps to the provider that produces the best results for that aesthetic. The style router in `lib/ai/generate-image.ts` selects the provider based on the wizard's `art_style` field.

**Providers (4):**

| Provider | Env Var | Aesthetics | Cost/Image |
|----------|---------|-----------|------------|
| OpenAI gpt-image-1 | `OPENAI_API_KEY` (set) | Comic Book, Whimsical Ink, Soft & Cozy | $0.005–0.04 |
| Recraft V4 | `RECRAFT_API_KEY` (new) | Classic Watercolor, Collage, Bold & Modern | $0.04 |
| fal.ai (FLUX.2 Pro + LoRA) | `FAL_KEY` (new) | Anime/Ghibli, Storybook Realism | $0.03–0.055 |
| Google Nano Banana 2 | `GOOGLE_AI_KEY` (new) | Free-tier fallback for any style | Free (~500/day) |

**8 Art Aesthetics (book-inspired):**
1. Comic Book (Dog Man) → OpenAI
2. Classic Watercolor (Peter Rabbit) → Recraft
3. Collage / Paper Cutout (Very Hungry Caterpillar) → Recraft
4. Whimsical Ink (Roald Dahl / Quentin Blake) → OpenAI
5. Bold & Modern (Pete the Cat) → Recraft
6. Soft & Cozy (Goodnight Moon) → OpenAI
7. Anime / Ghibli (Totoro) → fal.ai FLUX + LoRA
8. Storybook Realism (The Polar Express) → fal.ai FLUX.2 Pro

See `docs/image-gen-options.md` for full research, provider comparison, and integration notes.

### Prompt Structure

Every scene prompt must include three things in order:

1. **Style prefix** (from `STYLE_PREFIXES` map) — sets the art style for every page
2. **Character sheet** — a detailed, fixed appearance description generated by Claude, pasted verbatim on every page
3. **Scene** — what is happening on this specific page

**Always include `no text or words in the image`** — image models cannot reliably spell names or words. All text is overlaid by the app/HTML layer.

### Character Consistency

Claude generates a `character_sheet` field during story creation — a dense paragraph describing exact physical appearance + a fixed outfit. This is embedded verbatim in every page's `scene_description`.

The wizard collects structured appearance fields to seed the character sheet:
- Skin tone (6 swatches), hair color (8 options), hair style (13 options), eye color (6 options)
- Outfit (8 presets like "Red Hoodie", "Dino Onesie", "Superhero Cape")
- Freeform extras (glasses, freckles, etc.)

The outfit is the strongest consistency anchor — it's the most visually distinctive element that the model can reproduce reliably across pages.

## Deployment

**Vercel (primary):** https://kidsbooks-eight.vercel.app
- Deploy: `~/.nvm/versions/node/v20.20.1/bin/node ~/.nvm/versions/node/v20.20.1/bin/vercel --prod --yes`
- Env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `HF_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**GitHub Pages (static story shares):** https://sohaibhasan.github.io/kids-books/
- Self-contained HTML files with base64-encoded images under `stories/<slug>/index.html`

```bash
# Large push (base64-encoded stories)
git config http.postBuffer 52428800
git push -u origin main
```

## Dev Commands

```bash
# Run dev server (requires Node via nvm)
export PATH="$HOME/.nvm/versions/node/v20.20.1/bin:$PATH"
npm run dev

# Build
npm run build
```

## Development Phases

- **Phase 1 (MVP)** ✅ Complete — Wizard → Claude story gen → OpenAI images → Supabase → Vercel. Character consistency via structured fields + character sheets.
- **Phase 2a (In Progress)** — Multi-provider image routing: 8 book-inspired art aesthetics, each routed to best provider (OpenAI, Recraft, fal.ai/FLUX, Google free tier). Update wizard with new styles.
- **Phase 2b** — Storyboard editor, FLUX.1 Kontext character consistency upgrade, read-aloud, night mode
- **Phase 3** — User accounts, story library, age-tier vocabulary, bilingual support
- **Phase 4** — Stripe payments, subscriptions, print-on-demand, classroom accounts
