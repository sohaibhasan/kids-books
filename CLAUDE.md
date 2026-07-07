# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web app where parents, teachers, and caregivers create personalized illustrated storybooks for children. Users customize characters, settings, themes, and lessons — then get a page-by-page storybook they can share via link or print.

## Live Links

- **Production:** https://storybookstudio.org (primary; also `https://www.storybookstudio.org` and the legacy `https://kidsbooks-eight.vercel.app`)
- **Repo:** https://github.com/sohaibhasan/kids-books
- **GitHub Pages (legacy static prototype):** https://sohaibhasan.github.io/kids-books/
- **First story:** https://sohaibhasan.github.io/kids-books/stories/aamilah-and-the-dragon-treasure/

## Stack (current)

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, React 19) + Tailwind CSS v4 |
| Fonts | Fraunces (display, variable + SOFT axis), Inter (body), Fredoka (numerals) — all via `next/font/google` |
| UI primitives | Bespoke (Button, Input, SelectCard, Card, Badge, Chip, Progress, Stepper, IconButton); Radix for Select, Toast, Popover; lucide-react icons |
| Animation | `motion` (Framer-maintained); variants in `lib/motion.ts` |
| State | React local state (no global store yet) |
| Backend | Next.js API routes |
| AI Story Gen | Anthropic Claude sonnet-4-6 (`@anthropic-ai/sdk`) |
| AI Image Gen | Multi-provider router (OpenAI, Recraft, fal.ai, Google) — see Image Generation section |
| Database | Supabase Postgres (`stories`, `credit_events`, `credit_claim_tokens`) |
| File Storage | Supabase Storage (`story-images` bucket) |
| Payments | Stripe Checkout (guest mode, one-time credit packs) — `stripe` SDK |
| Transactional Email | Resend REST API (magic-link recovery emails) |
| Hosting | Vercel (primary, `storybookstudio.org`) + GitHub Pages (legacy static shares) |

## Current State

The Next.js app is in Phase 2c — the full pipeline (Wizard → Claude story generation → multi-provider image generation → `/read/[slug]` reader) runs end-to-end on Vercel against Supabase, and the entire surface area was redesigned in Phase 2c onto a modern-warm design system. For low-friction sharing, select stories are also exported as self-contained HTML files and deployed to GitHub Pages.

### Next.js App Structure

```
app/
  page.tsx                        ← Landing page (marketing components)
  layout.tsx                      ← Loads Fraunces + Inter + Fredoka via next/font
  globals.css                     ← Tailwind v4 + design tokens (@theme inline)
  wizard/page.tsx                 ← 7-step story wizard
  generating/[slug]/page.tsx      ← Live image generation progress (SSE)
  read/[slug]/page.tsx            ← Story reader (server component)
  api/stories/route.ts            ← POST: Claude story gen → Supabase insert → returns slug
  api/stories/[slug]/images/route.ts  ← GET SSE: image gen → Supabase Storage; streams per-page progress + URL
components/
  marketing/                      ← Header, Hero, HowItWorks, SampleShowcase, BottomCTA, Footer
  wizard/WizardContainer.tsx      ← Wizard state + navigation (7 steps), ToastProvider, AnimatePresence
  wizard/StepHeader.tsx           ← Eyebrow + title + description per step
  wizard/StoryPreview.tsx         ← Sticky right-side "Your story so far" panel (lg+), fills in section-by-section as user advances through steps
  wizard/steps/                   ← StepChild, StepGenre, StepTheme, StepSetting, StepStyle, StepVoice, StepReview (each exports its option arrays — SKIN_TONES, GENRES, LESSONS, etc. — reused by StoryPreview)
  reader/StoryReader.tsx          ← Page-by-page reader client component
  reader/ReaderChrome.tsx         ← Auto-hiding floating top bar
  reader/ReaderNav.tsx            ← Unified bottom nav bar (prev/next + dot scrubber w/ hover thumbnails; page label on mobile)
  reader/SharePopover.tsx         ← Radix Popover for copy/native-share/print
  ui/                             ← Button, Input, SelectCard, Card, Badge, Chip, Progress, Stepper, IconButton, Toast (Radix), Select (Radix)
lib/
  ai/generate-story.ts            ← Claude API call, age-tier vocab, writing voice + depth injection, JSON output
  ai/generate-image.ts            ← Multi-provider image router, returns Buffer
  ai/index.ts                     ← STYLE_PREFIXES map per ArtStyle
  ai/writing-styles.ts            ← WRITING_STYLE_VOICES, TONE_META, DEPTH_MODIFIERS
  motion.ts                       ← Framer-motion variants, springs, durations
  utils.ts                        ← cn() class-merge helper
  utils/slug.ts                   ← makeSlug()
types/index.ts                    ← WizardFormData, Story, Page, ArtStyle, etc.
public/generated/[slug]/          ← story.json + page-XX.png (gitignored)
```

### Design System (Phase 2c)

Warm-modern aesthetic — softened coral + honey on cream cream surfaces, Fraunces display for emotional moments + Inter for UI. Soft layered shadows replace hard offsets. Tokens live in **one file**, `app/globals.css`, exposed to Tailwind via `@theme inline` (color, type, radius, shadow, motion). Add new tokens there; they become utilities everywhere automatically. Story-palette tints (`--story-rose/sage/apricot/sky/lavender`) are used for per-card tinted selections in the wizard. Animations honor `prefers-reduced-motion` globally and use variants from `lib/motion.ts`.

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
GET    /api/stories/[slug]/images       → SSE stream: generates images via the multi-provider router, uploads to Supabase Storage, streams progress (maxDuration=300)
```

**SSE event shapes:**
- `start` — `{ type, total }`
- `progress` — `{ type, page, total, url, cached? }` (per-page; `url` is the public Supabase Storage URL — consumed by the generating page to fade in real thumbnails as pages complete)
- `error` — `{ type, page, message }`
- `done` — `{ type, success, total }`

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

## Writing Voice

**Architecture:** In addition to the per-story art aesthetic, the wizard collects a **writing voice** (craft-descriptor preset), a **tone**, and optional **depth modifiers**. All three get injected into the Claude story-gen prompt in `lib/ai/generate-story.ts`. Voice shapes sentence-level craft; tone modulates mood; depth modifiers push toward richer storytelling techniques.

**8 Writing voice presets** (see `lib/ai/writing-styles.ts`):
1. Rhyming & Playful — anapestic rhyme, invented compounds, refrains
2. Gentle & Pastoral — formal old-fashioned vocabulary, quiet stakes
3. Deadpan & Quirky — sparse dialogue, comic timing
4. Lyrical & Imaginative — rhythmic prose, big feelings, there-and-back shape (default)
5. Mischievous & Bold — inventive wordplay, clever kid triumphs
6. Warm & Contemplative — cozy, friendship-focused, kid-level philosophy
7. Vocab-Stretching — rich words with in-line definitions, ironic narrator
8. Sensory & Repetitive — short rhythmic sentences, cumulative patterns

**6 Tones:** silly, heartfelt, adventurous, spooky-but-safe, bittersweet, hopeful.

**4 Depth modifiers** (opt-in, multi-select): plot-twist, sensory-rich, vocab-stretch, character-arc. Each appends a specific directive to the Claude prompt.

The `scene_description` (image prompts) is NOT affected by writing voice — voice only shapes text_content.

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

## Monetization (Freemium)

**Model:** one free story per device, then prepaid credit packs. No accounts.

- **Identity:** signed first-party cookie `kb_device` (HMAC via `DEVICE_COOKIE_SECRET`) plus a server-side `sha256(ip + ua + accept-language)` fallback hash. Free allowance is "burnt" if either matches a prior `stories` row, so clearing cookies on the same browser/network does not reset it.
- **Credits ledger:** `credit_events` table (event-sourced; balance = SUM of deltas). `+N` on Stripe `checkout.session.completed`, `−1` per paid generation. `unique(stripe_session)` makes the webhook idempotent.
- **Gate point:** `app/api/stories/route.ts` resolves identity, calls `getEntitlement()` from `lib/credits.ts`, returns **402 `{ paywall: true, packs }`** before invoking Claude when the device has no free allowance and no balance.
- **Checkout:** `POST /api/checkout { pack: 'solo' | 'small' | 'large' }` → Stripe Checkout Session (guest mode; prices via `STRIPE_PRICE_PACK_1` / `STRIPE_PRICE_PACK_3` / `STRIPE_PRICE_PACK_10`). Success URL `/wizard?paid=1`; the wizard stashes in-flight `WizardFormData` in `sessionStorage` before redirect and auto-resubmits on return.
- **Pricing (current):** $2 / 1 story, $5 / 3 stories ($1.67 ea), $15 / 10 stories ($1.50 ea — the floor, set at 1.25× worst-case generation cost). Display strings live in `lib/credits.ts` (`PACKS`); marketing copy in `components/marketing/Pricing.tsx`.
- **Cross-device recovery:** webhook mints a `credit_claim_tokens` row and emails a magic link via Resend. `GET /api/credits/claim?token=…` rebinds the cookie to the original `source_device`.
- **Circuit breaker:** `FREE_STORIES_PER_DAY_GLOBAL` (default 200) — free-tier requests beyond the daily ceiling get a 503.

**Stripe modes:** `STRIPE_SECRET_KEY` is the **live** key in production, so `/api/checkout` always creates live Sessions (real money) regardless of the dashboard's mode toggle. The webhook handler accepts **either** signature: tries `STRIPE_WEBHOOK_SECRET` (live) first, falls back to `STRIPE_WEBHOOK_SECRET_TEST` — so the test-mode endpoint (`we_1TXkSUF5za3JxXe0RANXRsO2`) stays useful for CLI replays / dashboard test events without disturbing live payments. To do a true test-mode E2E against the live URL, override `STRIPE_SECRET_KEY` on a preview branch.

**Live Stripe IDs (record-keeping):**
- Products: `prod_UXLI2hVY8QaTNL` (1-story), `prod_UWyaxMWuVSc2QZ` (3-pack), `prod_UWyaeSceVGi94F` (10-pack)
- Prices (active, 2026-05-23 onward): `price_1TYGcEFVsOo5w5LqQJXr56YW` ($2 · 1 story), `price_1TaRwIFVsOo5w5Lq2a5kX2Qy` ($5 · 3 stories), `price_1TaRv4FVsOo5w5Lq7R199QWu` ($15 · 10 stories). Older prices ($3.50 / $10 / $25 and $5 / $12) are archived.
- Webhook: `we_1TXud5FVsOo5w5LqhmYkqhnL` → `https://storybookstudio.org/api/stripe/webhook`, event `checkout.session.completed`

**Resend:** sending domain is `support.storybookstudio.org` (verified). `EMAIL_FROM = "Storybook Studio <hello@support.storybookstudio.org>"`. The apex `storybookstudio.org` is **not** verified in Resend — don't change EMAIL_FROM to use the apex without re-verifying.

**Key files:** `lib/identity.ts`, `lib/credits.ts`, `lib/stripe.ts`, `lib/email.ts`, `components/paywall/PaywallModal.tsx`, `app/api/checkout/route.ts`, `app/api/stripe/webhook/route.ts`, `app/api/credits/claim/route.ts`, `supabase/migrations/0002_freemium.sql`.

## Deployment

**Vercel (primary):** https://storybookstudio.org (legacy alias: https://kidsbooks-eight.vercel.app)
- **Domain:** registered at Cloudflare Registrar. DNS records (apex `A 76.76.21.21`, `www CNAME cname.vercel-dns.com`) are **DNS only** (gray cloud) — Vercel handles SSL itself; proxying would cause redirect loops.
- **Auto-deploy:** push to `main` → Vercel builds and promotes to production. Push to any other branch → preview deployment. (Connected via the Vercel GitHub App.)
- **Manual fallback:** `npx vercel --prod --yes` (with nvm Node on PATH; the Vercel CLI is not installed globally on this machine)
- **Env vars (Production):**
  - AI: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `RECRAFT_API_KEY`, `FAL_KEY`, `GOOGLE_AI_KEY`, `HF_TOKEN`
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Freemium gating: `DEVICE_COOKIE_SECRET`, `FREE_STORIES_PER_DAY_GLOBAL`
  - Stripe: `STRIPE_SECRET_KEY` (sk_live), `STRIPE_WEBHOOK_SECRET` (live), `STRIPE_WEBHOOK_SECRET_TEST` (test, fallback), `STRIPE_PRICE_PACK_3`, `STRIPE_PRICE_PACK_10`
  - Email: `RESEND_API_KEY`, `EMAIL_FROM`
  - App: `APP_URL=https://storybookstudio.org`
- See `.env.example` for the full template.

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
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
npm run dev

# Build
npm run build
```

## Development Phases

- **Phase 1 (MVP)** ✅ Complete — Wizard → Claude story gen → OpenAI images → Supabase → Vercel. Character consistency via structured fields + character sheets.
- **Phase 2a** ✅ Complete — Multi-provider image routing: 8 book-inspired art aesthetics, each routed to best provider (OpenAI, Recraft, fal.ai/FLUX, Google free tier). Wizard UI exposes all 8 styles (`components/wizard/steps/StepStyle.tsx`). End-to-end testing complete across all provider routes.
- **Phase 2b.1** ✅ Complete — Story variety & depth: 8 writing-voice presets, 6 tones, 4 optional depth modifiers (plot-twist, sensory-rich, vocab-stretch, character-arc). New `StepVoice` wizard step + `lib/ai/writing-styles.ts`.
- **Phase 2c** ✅ Complete — End-to-end visual redesign. New design system in `app/globals.css` (warm-modern palette, Fraunces+Inter, soft elevation, motion tokens). Primitives rebuilt + new ones added (Card/Badge/Chip/Progress/Stepper/IconButton/Toast/Select). Marketing landing rewrite. Wizard chrome with sticky footer nav, AnimatePresence step transitions, toast errors, jump-to-edit review with cover preview. Generating screen with rotating copy + real per-page thumbnail grid (powered by extended SSE `url` field). Reader with auto-hiding chrome, slide+fade transitions, swipe gestures, glass IconButton chevrons, Scrubber, SharePopover, and Fraunces drop-cap story prose.
- **Phase 3 (Monetization)** ✅ Complete — Freemium gating live in production at `storybookstudio.org`. Free first story per device (signed cookie + IP/UA fallback hash), then prepaid Stripe credit packs ($5/3 stories, $12/10 stories). Magic-link cross-device recovery via Resend (`support.storybookstudio.org`). Webhook handler accepts both live + test signatures. End-to-end validated: free gate, paywall trigger, Stripe Checkout (live mode), credit grant + consume, magic-link delivery. See "Monetization (Freemium)" section.
- **Phase 2b (remaining)** — Storyboard editor, FLUX.1 Kontext character consistency upgrade, read-aloud, night mode, narrative structure presets, POV selector, bilingual output
- **Phase 4** — Subscriptions, print-on-demand, classroom accounts, optional user accounts for richer library/history
