# Project State

Last updated: 2026-03-15

---

## Current Phase: Pre-MVP — Prototype / Pipeline Validation

We are in a prototype stage ahead of Phase 1. The content pipeline (story authoring → image generation → reader view → shareable link) has been proven end-to-end manually. No Next.js app exists yet.

---

## What's Done

### Infrastructure
- [x] Project plan written (`project_plan.md`)
- [x] GitHub repo created — https://github.com/sohaibhasan/kids-books
- [x] GitHub Pages live — https://sohaibhasan.github.io/kids-books/
- [x] Python image generation pipeline (HF FLUX.1-schnell, free tier)
- [x] `.env` with Gemini, HF, and GitHub credentials

### First Story: Aamilah and the Dragon's Treasure
- [x] Story authored (15 pages, JSON storyboard)
- [x] Character description defined (7yo, light tan skin, straight brown hair)
- [x] Art style locked: Dog Man Comic Book (Dav Pilkey aesthetic)
- [x] All 15 illustrations generated
- [x] Self-contained HTML reader built (page-by-page, keyboard nav)
- [x] Deployed and shareable — https://sohaibhasan.github.io/kids-books/stories/aamilah-and-the-dragon-treasure/

---

## Phase 1 — MVP Todos (Next Milestone)

The goal: a real web app where a user fills out a form and gets a generated story.

### 1. Initialize Next.js App
- [x] `npx create-next-app@latest` with TypeScript + Tailwind
- [x] Set up folder structure (`/app`, `/components`, `/lib`)
- [x] Configure environment variables (Claude API key, HF token)

### 2. Story Creation Wizard (UI)
- [ ] Step 1 — Child details: name, age, pronouns, appearance
- [ ] Step 2 — Genre selection
- [ ] Step 3 — Theme / lesson selection
- [ ] Step 4 — Setting + supporting characters
- [ ] Step 5 — Tone + length (short / medium / long)
- [ ] Progress bar between steps
- [ ] Form state managed with Zustand or React Context

### 3. Claude API — Story Text Generation
- [ ] `/api/stories` POST endpoint — accepts wizard inputs
- [ ] Prompt template that produces structured page-by-page JSON output
- [ ] Age-tier vocabulary control (map child age → tier → prompt instructions)
- [ ] Scene description auto-generated from each page's narrative text

### 4. HF API — Illustration Generation
- [ ] `/api/stories/:id/generate` — triggers image gen for all pages
- [ ] Sequential generation with queue (respect HF rate limits)
- [ ] Store generated images to S3/R2 (replace base64 inline approach)
- [ ] Style prefix + character description injected automatically per page

### 5. Reader View (React)
- [ ] Port existing HTML reader to Next.js `/read/[slug]` route
- [ ] Page-turn animation (Framer Motion)
- [ ] Responsive layout (desktop two-column, tablet/phone stacked)
- [ ] No login required to view

### 6. Database
- [ ] Set up Supabase project
- [ ] Create `users`, `stories`, `pages`, `characters` tables (per data model)
- [ ] Wire API routes to Supabase client

### 7. Deploy
- [ ] Deploy Next.js app to Vercel
- [ ] Set production environment variables
- [ ] Confirm shareable `/read/:slug` links work end-to-end

---

## Deferred to Phase 2+

- Storyboard editor (reorder, edit text, regenerate individual images)
- Multiple art styles
- Read-aloud (browser TTS)
- Night mode
- User accounts / story library
- Bilingual support
- Stripe / monetization

---

## Key Decisions Locked

| Decision | Choice | Reason |
|---|---|---|
| Image generation | HF FLUX.1-schnell | Only free-tier option that works; Gemini image requires billing |
| Art style | Dog Man Comic Book | Bold outlines, flat colors, works well with FLUX |
| Image text | Never include names/words in prompts | Diffusion models can't spell reliably |
| Character consistency | Repeat full appearance in every scene prompt | Model has no memory across prompts |
| Hosting (prototype) | GitHub Pages | Free, zero config for static HTML |
| Hosting (app) | Vercel | Planned for Next.js app |
