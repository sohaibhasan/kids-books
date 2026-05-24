# Project State

Last updated: 2026-05-24

---

## Current Phase: Post-Phase 3 — Live in production

Live at https://storybookstudio.org with freemium gating, the Phase 2c
visual redesign, multi-provider image routing, and the writing-voice
system. CLAUDE.md is the canonical engineering reference; this file
tracks completed phases and what's still on the roadmap.

### Phase 2b.1 — Writing Voice & Depth ✅ Complete

- [x] 8 writing-voice presets in `lib/ai/writing-styles.ts` (rhyming, pastoral, deadpan, lyrical, mischievous, contemplative, vocab-stretching, sensory)
- [x] 6 tones (silly, heartfelt, adventurous, spooky-but-safe, bittersweet, hopeful)
- [x] 4 opt-in depth modifiers (plot-twist, sensory-rich, vocab-stretch, character-arc)
- [x] New `StepVoice` wizard step; voice + tone + depth injected into Claude prompt

### Phase 2c — Visual Redesign ✅ Complete

- [x] New design system in `app/globals.css` (warm-modern palette, Fraunces+Inter+Fredoka, soft elevation, motion tokens) exposed to Tailwind via `@theme inline`
- [x] Bespoke primitives rebuilt + new ones added (Card, Badge, Chip, Progress, Stepper, IconButton, Toast, Select)
- [x] Marketing landing rewrite (Header, Hero, HowItWorks, SampleShowcase, BottomCTA, Footer)
- [x] Wizard chrome with sticky footer nav, AnimatePresence step transitions, toast errors, jump-to-edit review with cover preview
- [x] Generating screen with rotating copy + real per-page thumbnail grid (powered by extended SSE `url` field)
- [x] Reader with auto-hiding chrome, slide+fade transitions, swipe gestures, glass IconButton chevrons, Scrubber, SharePopover, Fraunces drop-cap story prose
- [x] `prefers-reduced-motion` honored globally

### Phase 3 — Monetization (Freemium) ✅ Complete

- [x] Signed `kb_device` cookie + `sha256(ip+ua+lang)` fallback hash (`lib/identity.ts`)
- [x] Event-sourced credit ledger (`credit_events` table, `lib/credits.ts`)
- [x] Stripe Checkout in guest mode; webhook handler accepts live + test signatures
- [x] Magic-link cross-device recovery via Resend (`support.storybookstudio.org` verified)
- [x] `FREE_STORIES_PER_DAY_GLOBAL` circuit breaker
- [x] Paywall modal triggered by 402 from `/api/stories/precheck`
- [x] End-to-end validated in production: free gate, paywall trigger, live Checkout, credit grant + consume, magic-link delivery

### Phase 3.x — Operational Polish ✅ Complete

- [x] Text-gen streaming — `POST /api/stories` is now SSE (Claude `messages.stream` + tool_use). Single combined progress bar fills 0–30% (text) / 30–100% (images)
- [x] `POST /api/stories/precheck` — entitlement pre-flight + slug; lets the wizard show paywall or redirect within ~1s
- [x] `GET /api/stories/[slug]/status` — drop-recovery probe; the generating page falls back to it when SSE dies mid-flight
- [x] Idempotent regeneration on slug — re-POST after a drop skips Claude + credit consume
- [x] Required `story_outline` (premise + 5-beat arc + per-page beats) before pages so longer stories don't meander
- [x] Page counts bumped to 10 / 15 / 20 (was 6 / 10 / 14); `max_tokens=16000`; `stop_reason='max_tokens'` is a hard error so no truncated rows land in Supabase
- [x] Image quality unified — Standard/High toggle removed; every provider runs at its highest tier
- [x] Auto-refund (`refund_failed_gen` credit_event) when image gen yields zero successful pages; false-positive "all illustrations failed" toast fixed
- [x] Provider quota alerts — `lib/alerts.ts` + `provider_alerts` table + `ALERT_EMAIL` env var; 402/429 emails debounced to 1/hour/provider
- [x] Solo tier added + packs repriced: $3.50 / 1 story, $10 / 3-pack, $25 / 10-pack (new `STRIPE_PRICE_PACK_1` env var)
- [x] `components/marketing/Pricing.tsx` — 4-tier landing-page pricing block
- [x] Hero + showcase refreshed with real recent cover art (Mountain of Stars / Ghibli featured)
- [x] Wizard polish: age field clearable, eye-color picker shows real swatches

---

## Phase 2a Tasks ✅ Complete

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

## Deferred to Phase 4+

- Storyboard editor (reorder, edit text, regenerate individual images)
- FLUX.1 Kontext character consistency upgrade (reference image → all pages)
- Read-aloud (browser TTS or pre-generated audio per page)
- Night mode
- Narrative structure presets, POV selector
- Bilingual output
- User accounts / story library / gallery
- Subscriptions, print-on-demand, classroom accounts

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
