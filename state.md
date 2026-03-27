# Project State

Last updated: 2026-03-25

---

## Current Phase: Phase 1 — MVP (In Progress)

Supabase is fully integrated — stories persist to Postgres and images upload to Supabase Storage. The app is ready for Vercel deployment. Next up: deploy to Vercel and run an end-to-end production test.

---

## What's Done

### Infrastructure
- [x] Project plan written (`project_plan.md`)
- [x] GitHub repo created — https://github.com/sohaibhasan/kids-books
- [x] GitHub Pages live — https://sohaibhasan.github.io/kids-books/
- [x] Python image generation pipeline (HF FLUX.1-schnell, free tier)
- [x] `.env` / `.env.local` with all credentials and placeholders

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
- [x] `HF_TOKEN` in `.env.local`
- [x] `POST /api/stories` — calls Claude, saves `story.json` to `public/generated/[slug]/`
- [x] `GET /api/stories/[slug]/images` — SSE endpoint, generates images via HF FLUX, saves PNGs
- [x] `lib/ai/generate-story.ts` — Claude sonnet-4-6, age-tier vocabulary, structured JSON output
- [x] `lib/ai/generate-image.ts` — HF FLUX.1-schnell, style prefix + character description per page
- [x] `/generating/[slug]` — live progress bar via EventSource, redirects when done
- [x] `/read/[slug]` — server-rendered reader, page-by-page with keyboard nav

### First AI-Generated Story
- [x] "Minha and the Kind Little Spark" — 12 pages, fairy-tale, Dog Man style
- [x] Deployed to GitHub Pages — https://sohaibhasan.github.io/kids-books/stories/minha-and-the-kind-little-spark/

### Database (Supabase)
- [x] Supabase project created — `yfmlegmlkqkzpxotajna`
- [x] `stories` table with RLS policies (public read, service role write)
- [x] `story-images` storage bucket (public)
- [x] `@supabase/supabase-js` installed, `lib/supabase.ts` client created
- [x] `POST /api/stories` — inserts to Supabase instead of filesystem
- [x] `GET /api/stories/[slug]/images` — uploads PNGs to Supabase Storage
- [x] `/read/[slug]` — reads from Supabase, serves images via public Storage URLs
- [x] Build passes clean (no TypeScript errors)

---

## Phase 1 — Remaining Todos

### 7. Deploy
- [ ] Deploy Next.js app to Vercel
- [ ] Set production environment variables
- [ ] End-to-end test: wizard → generate → shareable `/read/:slug` link

---

## Deferred to Phase 2+

- Storyboard editor (reorder, edit text, regenerate individual images)
- Multiple art styles in-app
- Read-aloud (browser TTS)
- Night mode
- User accounts / story library
- Bilingual support
- Stripe / monetization

---

## Key Decisions Locked

| Decision | Choice | Reason |
|---|---|---|
| Image generation | HF FLUX.1-schnell | Only free-tier option; Gemini image requires billing |
| Art style default | Dog Man Comic Book | Bold outlines, flat colors, works well with FLUX |
| Image prompts | Never include names/words | Diffusion models can't spell reliably |
| Character consistency | Repeat full appearance in every page prompt | Model has no memory across prompts |
| Hosting (prototype) | GitHub Pages | Static HTML, zero config |
| Hosting (app) | Vercel | Planned for Next.js app |
