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
POST   /api/stories                     → Wizard inputs → Claude story JSON → story.json saved → returns {slug}
GET    /api/stories/[slug]/images       → SSE stream: generates images via HF FLUX, saves PNGs, streams progress
```

### User Flow

1. **Wizard** — collect child details, genre, theme/lesson, setting, characters, tone, length
2. **Generate** — Claude API produces story text; image API generates per-page illustrations
3. **Storyboard editor** — drag-and-drop cards to reorder/edit/regenerate pages
4. **Publish** — shareable reader link, full-screen page-turn UI

## Image Generation

**Provider:** Hugging Face Inference API, model `black-forest-labs/FLUX.1-schnell`
- Free tier, no billing required
- Endpoint: `https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell`
- Auth: `Authorization: Bearer $HF_TOKEN`
- Request body: `{"inputs": "<prompt>"}`
- Response: raw PNG bytes

**Gemini image models are NOT free** — all require billing enabled regardless of model tier.

### Prompt Structure

Every scene prompt must include three things in order:

1. **Style prefix** (from `story.style_prefix`) — sets the art style for every page
2. **Character description** — repeated verbatim on every page for consistency
3. **Scene** — what is happening on this specific page

Current default style prefix:
> "Children's comic book illustration in the style of Dav Pilkey's Dog Man: bold black outlines, flat bright colors, simple cartoonish shapes, hand-drawn feel, expressive faces, no text or words in the image."

**Always include `no text or words in the image`** — diffusion models cannot reliably spell names or words. All text is overlaid by the app/HTML layer.

### Character Consistency

Repeat the full appearance description in every page's `scene_description`. Do not rely on the character block alone — it is metadata only.

Example: `"a 7-year-old girl with light tan skin and straight brown hair down to her shoulders"`

## Python Scripts (Prototype)

Dependencies managed in `.venv/`:
```bash
python3 -m venv .venv
.venv/bin/pip install requests certifi
```

Generate a single image:
```python
import requests, certifi
resp = requests.post(
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
    headers={"Authorization": f"Bearer {hf_token}"},
    json={"inputs": prompt},
    verify=certifi.where(),
    timeout=120
)
open("output.png", "wb").write(resp.content)
```

## Deployment

Stories are deployed to GitHub Pages from the `main` branch root.

```bash
# First push (large files need increased buffer)
git config http.postBuffer 52428800
git push -u origin main
```

Pages URL pattern: `https://sohaibhasan.github.io/kids-books/stories/<story-slug>/`

## Dev Commands

```bash
# Run dev server (requires Node via nvm)
export PATH="$HOME/.nvm/versions/node/v20.20.1/bin:$PATH"
npm run dev

# Build
npm run build
```

## Development Phases

- **Phase 1 (MVP)** ✅ Pipeline done — Wizard → Claude → HF images → reader → GitHub Pages share. Remaining: Supabase + Vercel deploy.
- **Phase 2** — Storyboard editor, multiple art styles, character customization, read-aloud, night mode
- **Phase 3** — User accounts, story library, age-tier vocabulary, bilingual support
- **Phase 4** — Stripe payments, subscriptions, print-on-demand, classroom accounts
