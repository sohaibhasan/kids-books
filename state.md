# Project State

Last updated: 2026-03-16

---

## Current Phase: Phase 1 — MVP (In Progress)

The Next.js app is initialized and the wizard UI is complete. The "Create My Story" button is a stub — it logs form data but does not yet call any API. Next up: wire the Claude API for story text generation.

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
- [ ] "Create My Story" wired to API — **currently a stub, no story is generated**

---

## Phase 1 — Remaining Todos

### 3. Claude API — Story Text Generation
- [ ] `ANTHROPIC_API_KEY` added to `.env.local`
- [ ] `/api/stories` POST endpoint — accepts wizard inputs, calls Claude
- [ ] Prompt template that produces structured page-by-page JSON output
- [ ] Age-tier vocabulary control (map child age → tier → prompt instructions)
- [ ] Scene description auto-generated from each page's narrative text

### 4. HF API — Illustration Generation
- [ ] `/api/stories/[id]/generate` — triggers image gen for all pages sequentially
- [ ] Style prefix + character description injected automatically per page prompt
- [ ] Store generated images (initially base64/public folder; S3/R2 later)

### 5. Reader View (React)
- [ ] `/read/[slug]` route — page-by-page reader, no auth required
- [ ] Page-turn navigation (arrow keys + buttons)
- [ ] Responsive layout (desktop two-column, phone stacked)

### 6. Database
- [ ] Set up Supabase project
- [ ] Create `stories`, `pages`, `characters` tables
- [ ] Wire `/api/stories` to persist and retrieve from Supabase

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
