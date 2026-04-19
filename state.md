# Project State

Last updated: 2026-04-12

---

## Current Phase: Phase 2b — Story Polish + UX

Phase 2a complete and live. All 8 art aesthetics are wired to their providers and deployed.

### Phase 2a Tasks ✅ Complete

- [x] Build style router in `lib/ai/generate-image.ts` — maps `art_style` to provider + config
- [x] Integrate Recraft V4 API (classic watercolor, paper collage, bold & modern)
- [x] Integrate fal.ai API for FLUX.2 Pro (storybook realism, anime/ghibli)
- [x] Integrate Google Gemini as free-tier fallback
- [x] Update wizard art style options to 8 book-inspired aesthetics
- [x] Update `STYLE_PREFIXES` map and `ArtStyle` type for new aesthetics
- [x] Add new env vars to `.env.local`: `RECRAFT_API_KEY`, `FAL_KEY`, `GOOGLE_AI_KEY`
- [x] Fix Recraft 1000-char prompt limit (smart condensing function)
- [x] Fix generating page: show error + retry when all images fail
- [x] Add new env vars to Vercel: `RECRAFT_API_KEY`, `FAL_KEY`, `GOOGLE_AI_KEY`
- [x] Deploy to production — https://kidsbooks-eight.vercel.app

---

## What's Done

### Infrastructure
- [x] Project plan written (`project_plan.md`)
- [x] GitHub repo created — https://github.com/sohaibhasan/kids-books
- [x] GitHub Pages live — https://sohaibhasan.github.io/kids-books/
- [x] Python image generation pipeline (HF FLUX.1-schnell, free tier)
- [x] `.env` / `.env.local` with all credentials and placeholders
- [x] `.claude/settings.local.json` added to `.gitignore` (was leaking API keys)

### First Story: Aamilah and the Dragon's Treasure
- [x] Story authored (15 pages, JSON storyboard)
- [x] All 15 illustrations generated (Dog Man style)
- [x] Self-contained HTML reader built (page-by-page, keyboard nav)
- [x] Deployed — https://sohaibhasan.github.io/kids-books/stories/aamilah-and-the-dragon-treasure/

### Next.js App
- [x] Initialized with TypeScript + Tailwind, App Router
- [x] Folder structure: `app/`, `components/`, `lib/`, `types/`
- [x] Shared types defined (`Story`, `Page`, `Character`, `WizardFormData`)
- [x] UI components: `Button`, `Input`, `SelectCard`
- [x] Landing page (`/`) with hero and CTA
- [x] Wizard (`/wizard`) — 6-step flow, fully interactive
  - [x] Step 1 — Child details (name, age, pronouns, appearance)
  - [x] Step 2 — Genre (8 cards)
  - [x] Step 3 — Theme / lesson (12 cards)
  - [x] Step 4 — Setting + supporting characters
  - [x] Step 5 — Art style, tone, length
  - [x] Step 6 — Review summary
  - [x] Progress bar, Back/Next navigation, per-step validation
- [x] "Create My Story" wired to API — full pipeline working

### API Pipeline
- [x] `ANTHROPIC_API_KEY` in `.env.local` (new key, credits active)
- [x] `OPENAI_API_KEY` in `.env.local` (for image generation)
- [x] `POST /api/stories` — calls Claude, saves to Supabase
- [x] `GET /api/stories/[slug]/images` — SSE endpoint, generates images via OpenAI gpt-image-1, uploads to Supabase Storage
- [x] `lib/ai/generate-story.ts` — Claude sonnet-4-6, age-tier vocabulary, character sheet generation, structured JSON output
- [x] `lib/ai/generate-image.ts` — OpenAI gpt-image-1 with standard/high quality options
- [x] `/generating/[slug]` — live progress bar via EventSource, redirects when done
- [x] `/read/[slug]` — reads from Supabase, serves images via public Storage URLs
- [x] JSON parsing hardened — extracts outermost `{}` block to handle Claude preamble
- [x] `maxDuration=300` on SSE route to avoid Vercel function timeout

### Character Consistency
- [x] Structured appearance fields in wizard: skin tone, hair color, hair style, eye color, outfit presets
- [x] Claude generates a detailed `character_sheet` with fixed outfit, embedded verbatim in every page prompt
- [x] Switched from DALL-E 3 to gpt-image-1 for better prompt adherence

### First AI-Generated Story
- [x] "Minha and the Kind Little Spark" — 12 pages, fairy-tale, Dog Man style
- [x] Deployed to GitHub Pages — https://sohaibhasan.github.io/kids-books/stories/minha-and-the-kind-little-spark/

### Database (Supabase)
- [x] Supabase project created — `yfmlegmlkqkzpxotajna`
- [x] `stories` table with RLS policies (public read, service role write)
- [x] `story-images` storage bucket (public)
- [x] `@supabase/supabase-js` installed, `lib/supabase.ts` client created

### Deployment (Vercel)
- [x] Vercel CLI installed, project linked (`sohaibhasans-projects/kids_books`)
- [x] All env vars set on Vercel: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `HF_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] App live — https://kidsbooks-eight.vercel.app
- [x] Build passing cleanly on Vercel
- [x] End-to-end flow working: wizard → Claude story gen → OpenAI images → Supabase → `/read/[slug]`

---

## Deferred to Phase 2b+

- Storyboard editor (reorder, edit text, regenerate individual images)
- FLUX.1 Kontext character consistency upgrade (reference image → all pages)
- Read-aloud (browser TTS)
- Night mode
- User accounts / story library
- Bilingual support
- Stripe / monetization

---

## Key Decisions Locked

| Decision | Choice | Reason |
|---|---|---|
| Image generation | Multi-provider routing | OpenAI (comic, ink, cozy), Recraft V4 (watercolor, collage, bold), fal.ai/FLUX (anime, realism), Google (free fallback) |
| Art aesthetics | 8 book-inspired styles | See `docs/image-gen-options.md` for full mapping |
| Image prompts | Never include names/words | Diffusion models can't spell reliably |
| Character consistency | Structured fields + character sheet + fixed outfit in every prompt | Model has no memory across prompts; outfit is strongest anchor |
| Story persistence | Supabase Postgres | Vercel filesystem is ephemeral |
| Image storage | Supabase Storage | Same reason — no persistent disk on Vercel |
| Hosting (prototype) | GitHub Pages | Static HTML, zero config |
| Hosting (app) | Vercel | Deployed and live |
