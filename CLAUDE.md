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
| Database | Supabase Postgres (`stories`, `credit_events`, `credit_claim_tokens`, `provider_alerts`) |
| File Storage | Supabase Storage (`story-images` bucket) |
| Payments | Stripe Checkout (guest mode, one-time credit packs) — `stripe` SDK |
| Transactional Email | Resend REST API (magic-link recovery emails) |
| Hosting | Vercel (primary, `storybookstudio.org`) + GitHub Pages (legacy static shares) |

## Current State

The Next.js app is **post-Phase 3** — live at `storybookstudio.org` with freemium gating (one free story per device, then prepaid credit packs) on top of the redesigned Phase 2c surface. The full pipeline (precheck → Wizard → streaming Claude text gen → multi-provider image gen → `/read/[slug]` reader) runs end-to-end on Vercel against Supabase, with a single combined progress bar driving the generating screen. Provider 402/429 errors page the operator over Resend (debounced 1/hour/provider). For low-friction sharing, select stories are also exported as self-contained HTML files and deployed to GitHub Pages.

### Next.js App Structure

```
app/
  page.tsx                              ← Landing page (marketing components)
  layout.tsx                            ← Loads Fraunces + Inter + Fredoka via next/font
  globals.css                           ← Tailwind v4 + design tokens (@theme inline)
  wizard/page.tsx                       ← 7-step story wizard
  generating/[slug]/page.tsx            ← Combined text+image progress (single SSE-driven bar)
  read/[slug]/page.tsx                  ← Story reader (server component, force-dynamic)
  api/stories/route.ts                  ← POST SSE: Claude streaming → Supabase insert (idempotent on slug)
  api/stories/precheck/route.ts         ← POST: entitlement + slug pre-flight (returns 402 paywall or {slug})
  api/stories/[slug]/images/route.ts    ← GET SSE: image gen → Supabase Storage; per-page progress + URL
  api/stories/[slug]/status/route.ts    ← GET: lightweight poll for SSE-drop recovery (images_done, total_pages)
  api/checkout/route.ts                 ← POST: Stripe Checkout Session (solo / small / large pack)
  api/stripe/webhook/route.ts           ← POST: checkout.session.completed → grant credits + mint claim token
  api/credits/claim/route.ts            ← GET: magic-link redirect that rebinds device cookie
components/
  marketing/                            ← Header, Hero, HowItWorks, SampleShowcase, Pricing, BottomCTA, Footer
  wizard/WizardContainer.tsx            ← Wizard state + navigation (7 steps), ToastProvider, AnimatePresence
  wizard/StepHeader.tsx                 ← Eyebrow + title + description per step
  wizard/steps/                         ← StepChild, StepGenre, StepTheme, StepSetting, StepStyle, StepVoice, StepReview
  reader/StoryReader.tsx                ← Page-by-page reader client component
  reader/ReaderChrome.tsx               ← Auto-hiding floating top bar
  reader/Scrubber.tsx                   ← Page scrubber with hover thumbnails
  reader/SharePopover.tsx               ← Radix Popover for copy/native-share/print
  paywall/PaywallModal.tsx              ← Pack picker shown when /api/stories/precheck returns 402
  ui/                                   ← Button, Input, SelectCard, Card, Badge, Chip, Progress, Stepper, IconButton, Toast (Radix), Select (Radix)
lib/
  ai/generate-story.ts                  ← Claude `messages.stream` w/ tool_use, age-tier vocab, voice + depth, story_outline planning
  ai/generate-image.ts                  ← Multi-provider image router (always highest quality), returns Buffer
  ai/index.ts                           ← STYLE_PREFIXES map per ArtStyle
  ai/writing-styles.ts                  ← WRITING_STYLE_VOICES, TONE_DESCRIPTIONS, DEPTH_MODIFIERS
  supabase.ts                           ← Service-role Supabase client
  identity.ts                           ← Signed `kb_device` cookie + `sha256(ip+ua+lang)` fallback hash
  credits.ts                            ← Entitlement, PACKS (solo/small/large), consume/refund/grant, global throttle
  stripe.ts                             ← Stripe SDK init + price lookup
  email.ts                              ← Resend REST wrapper
  alerts.ts                             ← maybeAlertProviderQuota — debounced 402/429 alert email per provider
  motion.ts                             ← Framer-motion variants, springs, durations
  utils.ts                              ← cn() class-merge helper
  utils/slug.ts                         ← makeSlug()
types/index.ts                          ← WizardFormData, Story, Page, ArtStyle, etc.
public/generated/[slug]/                ← story.json + page-XX.png (gitignored)
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
POST   /api/stories/precheck            → Resolve entitlement + return {slug}. 402 {paywall, packs} if no free / no credits; 503 if globally throttled.
POST   /api/stories                     → SSE: streams Claude tool_use → inserts row → emits text-done. Idempotent on slug (re-POST after drop skips Claude + credit).
GET    /api/stories/[slug]/images       → SSE: image gen via multi-provider router → Supabase Storage. Per-page progress + URL. (maxDuration=300)
GET    /api/stories/[slug]/status       → JSON: {images_done, total_pages}. Polled by the generating page when an SSE stream drops.
POST   /api/checkout                    → Stripe Checkout Session for `pack: 'solo' | 'small' | 'large'`. Success URL: `/wizard?paid=1`.
POST   /api/stripe/webhook              → `checkout.session.completed` → grant credits (idempotent on `stripe_session`) → mint claim token → email magic link.
GET    /api/credits/claim?token=…       → Validates claim token → rebinds `kb_device` cookie → redirects to `/wizard`.
```

**SSE event shapes — `POST /api/stories` (text phase, 0–30% of the combined bar):**
- `start` — `{ type }`
- `text-progress` — `{ type, completed, total }` (a primed `0/total` is sent first so the bar renders > 0 immediately)
- `text-done` — `{ type, slug, title }`
- `error` — `{ type, message }`

**SSE event shapes — `GET /api/stories/[slug]/images` (image phase, 30–100%):**
- `start` — `{ type, total }`
- `progress` — `{ type, page, total, url, cached? }` (per-page; `url` is the public Supabase Storage URL — consumed by the generating page to fade in real thumbnails as pages complete)
- `error` — `{ type, page, message }`
- `done` — `{ type, success, total }`

### User Flow

1. **Wizard** — collect child details, genre, theme/lesson, setting, characters, voice, tone, length. On submit hit `/api/stories/precheck` first; if it returns 402 the `PaywallModal` opens, otherwise we redirect to `/generating/[slug]` within ~1s.
2. **Generate (live)** — `/generating/[slug]` POSTs the form to `/api/stories` (text SSE), then opens the EventSource on `/api/stories/[slug]/images` (image SSE). A single progress bar fills 0–30% during text, 30–100% during images, with the page-thumbnail grid fading in as each URL arrives. On stream drop the page polls `/status` to decide whether to navigate to the reader or retry.
3. **Read** — `/read/[slug]` is server-rendered (`force-dynamic`) with auto-hiding chrome, swipe gestures, scrubber, and share popover.
4. **Storyboard editor (deferred)** — drag-and-drop reorder/edit/regenerate is on the roadmap; not yet built.

## Image Generation

**Architecture:** Multi-provider routing — each art style maps to the provider that produces the best results for that aesthetic. The style router in `lib/ai/generate-image.ts` selects the provider based on the wizard's `art_style` field. Every provider is called at its highest available quality tier — there is no standard/high toggle anywhere in the codebase.

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

**Story length & arc planning.** Three length presets: **Short = 10 pages, Medium = 15, Long = 20** (plus a cover + end page). To keep the longer stories from meandering, Claude is required to emit a `story_outline` object first (premise + 5-beat arc: setup, inciting incident, midpoint shift, climax, resolution + per-page beats), then write the `pages` array against those beats. The streaming route enforces this — `max_tokens = 16000`, and `stop_reason='max_tokens'` (or `pages.length` ≠ expected total) is treated as a hard error so no truncated row ever lands in Supabase.

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
- **Credits ledger:** `credit_events` table (event-sourced; balance = SUM of deltas). `+N` on Stripe `checkout.session.completed`, `−1` per paid generation, `+1` `refund_failed_gen` when image gen ultimately fails. `unique(stripe_session)` makes the webhook idempotent.
- **Gate point:** `app/api/stories/precheck/route.ts` resolves identity, calls `getEntitlement()` from `lib/credits.ts`, returns **402 `{ paywall: true, packs }`** before the wizard ever opens the streaming `/api/stories` connection. The streaming endpoint re-checks entitlement and is itself idempotent per slug — re-POSTing after an SSE drop does not double-charge.
- **Packs (`PACKS` in `lib/credits.ts`):**
  - `solo` — 1 story · $3.50 · price env `STRIPE_PRICE_PACK_1`
  - `small` — 3 stories · $10 · price env `STRIPE_PRICE_PACK_3`
  - `large` — 10 stories · $25 · price env `STRIPE_PRICE_PACK_10`
- **Checkout:** `POST /api/checkout { pack: 'solo' | 'small' | 'large' }` → Stripe Checkout Session (guest mode). Success URL `/wizard?paid=1`; the wizard stashes in-flight `WizardFormData` in `sessionStorage` before redirect and auto-resubmits on return.
- **Auto-refund:** when image generation ends with zero successful pages, the route writes a `refund_failed_gen` credit_event so the user is made whole (idempotent on slug + reason). False-positive "all illustrations failed" toasts on a still-running stream were fixed in `2a422ee`.
- **Cross-device recovery:** webhook mints a `credit_claim_tokens` row and emails a magic link via Resend. `GET /api/credits/claim?token=…` rebinds the cookie to the original `source_device`.
- **Circuit breaker:** `FREE_STORIES_PER_DAY_GLOBAL` (default 200) — free-tier requests beyond the daily ceiling get a 503.

**Stripe modes:** `STRIPE_SECRET_KEY` is the **live** key in production, so `/api/checkout` always creates live Sessions (real money) regardless of the dashboard's mode toggle. The webhook handler accepts **either** signature: tries `STRIPE_WEBHOOK_SECRET` (live) first, falls back to `STRIPE_WEBHOOK_SECRET_TEST` — so the test-mode endpoint stays useful for CLI replays / dashboard test events without disturbing live payments. To do a true test-mode E2E against the live URL, override `STRIPE_SECRET_KEY` on a preview branch.

**Live Stripe IDs:** the canonical pack → price-id mapping lives on Vercel as `STRIPE_PRICE_PACK_1` / `STRIPE_PRICE_PACK_3` / `STRIPE_PRICE_PACK_10`. The product/price IDs were re-issued with the 2026-05 reprice (commit `1d0b711`); read the current values from the Vercel env vars or the Stripe dashboard rather than hard-coding them here. Webhook: `https://storybookstudio.org/api/stripe/webhook`, event `checkout.session.completed`.

**Resend:** sending domain is `support.storybookstudio.org` (verified). `EMAIL_FROM = "Storybook Studio <hello@support.storybookstudio.org>"`. The apex `storybookstudio.org` is **not** verified in Resend — don't change EMAIL_FROM to use the apex without re-verifying.

**Key files:** `lib/identity.ts`, `lib/credits.ts`, `lib/stripe.ts`, `lib/email.ts`, `components/paywall/PaywallModal.tsx`, `components/marketing/Pricing.tsx`, `app/api/stories/precheck/route.ts`, `app/api/checkout/route.ts`, `app/api/stripe/webhook/route.ts`, `app/api/credits/claim/route.ts`, `supabase/migrations/0002_freemium.sql`.

## Provider Quota Alerts

When any AI provider returns **HTTP 402 (out of credit)** or **429 (rate limited)**, `lib/alerts.ts::maybeAlertProviderQuota(err, contextHint?)` classifies the error (by SDK status field or an inline `(NNN)` substring in the message) and emails the operator via the existing Resend wrapper. Calls are **debounced to once per provider per hour** through the `provider_alerts` table (see `supabase/migrations/0003_provider_alerts.sql`) — but the `alert_count` column is still incremented on every hit so post-mortems show true scope.

- **Recipient:** `ALERT_EMAIL` env var. If unset the handler logs and silently returns.
- **Subject:** `[Storybook Studio] <provider> <status> — <label>`.
- **Body:** human-readable summary plus a deep-link to that provider's billing/quota dashboard.
- **Coverage:** Anthropic, OpenAI, Recraft, fal.ai, Google (Gemini). Unknown providers fall through with `provider='unknown'`.
- **Call sites:** wrap the call in a `try { … } catch (err) { await maybeAlertProviderQuota(err, 'context'); throw err }` pattern so the alert never masks the underlying failure path.

## Deployment

**Vercel (primary):** https://storybookstudio.org (legacy alias: https://kidsbooks-eight.vercel.app)
- **Domain:** registered at Cloudflare Registrar. DNS records (apex `A 76.76.21.21`, `www CNAME cname.vercel-dns.com`) are **DNS only** (gray cloud) — Vercel handles SSL itself; proxying would cause redirect loops.
- **Auto-deploy:** push to `main` → Vercel builds and promotes to production. Push to any other branch → preview deployment. (Connected via the Vercel GitHub App.)
- **Manual fallback:** `~/.nvm/versions/node/v20.20.1/bin/node ~/.nvm/versions/node/v20.20.1/bin/vercel --prod --yes`
- **Env vars (Production):**
  - AI: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `RECRAFT_API_KEY`, `FAL_KEY`, `GOOGLE_AI_KEY`, `HF_TOKEN`
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Freemium gating: `DEVICE_COOKIE_SECRET`, `FREE_STORIES_PER_DAY_GLOBAL`
  - Stripe: `STRIPE_SECRET_KEY` (sk_live), `STRIPE_WEBHOOK_SECRET` (live), `STRIPE_WEBHOOK_SECRET_TEST` (test, fallback), `STRIPE_PRICE_PACK_1`, `STRIPE_PRICE_PACK_3`, `STRIPE_PRICE_PACK_10`
  - Email: `RESEND_API_KEY`, `EMAIL_FROM`, `ALERT_EMAIL` (operator inbox for provider 402/429 alerts)
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
export PATH="$HOME/.nvm/versions/node/v20.20.1/bin:$PATH"
npm run dev

# Build
npm run build
```

## Development Phases

- **Phase 1 (MVP)** ✅ Complete — Wizard → Claude story gen → OpenAI images → Supabase → Vercel. Character consistency via structured fields + character sheets.
- **Phase 2a** ✅ Complete — Multi-provider image routing: 8 book-inspired art aesthetics, each routed to best provider (OpenAI, Recraft, fal.ai/FLUX, Google free tier). Wizard UI exposes all 8 styles (`components/wizard/steps/StepStyle.tsx`). End-to-end testing complete across all provider routes.
- **Phase 2b.1** ✅ Complete — Story variety & depth: 8 writing-voice presets, 6 tones, 4 optional depth modifiers (plot-twist, sensory-rich, vocab-stretch, character-arc). New `StepVoice` wizard step + `lib/ai/writing-styles.ts`.
- **Phase 2c** ✅ Complete — End-to-end visual redesign. New design system in `app/globals.css` (warm-modern palette, Fraunces+Inter, soft elevation, motion tokens). Primitives rebuilt + new ones added (Card/Badge/Chip/Progress/Stepper/IconButton/Toast/Select). Marketing landing rewrite. Wizard chrome with sticky footer nav, AnimatePresence step transitions, toast errors, jump-to-edit review with cover preview. Generating screen with rotating copy + real per-page thumbnail grid (powered by extended SSE `url` field). Reader with auto-hiding chrome, slide+fade transitions, swipe gestures, glass IconButton chevrons, Scrubber, SharePopover, and Fraunces drop-cap story prose.
- **Phase 3 (Monetization)** ✅ Complete — Freemium gating live in production at `storybookstudio.org`. Free first story per device (signed cookie + IP/UA fallback hash), then prepaid Stripe credit packs (Solo $3.50, 3-pack $10, 10-pack $25). Magic-link cross-device recovery via Resend (`support.storybookstudio.org`). Webhook handler accepts both live + test signatures. Auto-refund on real image-gen failure. End-to-end validated: free gate, paywall trigger, Stripe Checkout (live mode), credit grant + consume + refund, magic-link delivery. See "Monetization (Freemium)" section.
- **Phase 3.x — Operational polish** ✅ Complete — Text-gen streaming (Claude `messages.stream` → SSE → single combined progress bar 0–30% text / 30–100% images); precheck endpoint + drop-recovery status poll; idempotent regeneration on slug (no double-charge after SSE drop); story-arc planning via required `story_outline` + bumped page counts (10/15/20) + 16k max_tokens with hard-fail on truncation; image-quality unified (always highest tier per provider); provider-quota alerting (`lib/alerts.ts`, `provider_alerts` table, debounced 1/hour/provider email); Solo tier reprice; pricing landing-section + hero/showcase refresh with real recent covers.
- **Phase 4 (deferred)** — Storyboard editor, FLUX.1 Kontext character consistency upgrade, read-aloud (TTS), night mode, narrative structure presets, POV selector, bilingual output, subscriptions, print-on-demand, classroom accounts, optional user accounts for richer library/history.
