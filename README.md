# Storybook Studio

A web platform where parents, teachers, and caregivers create personalized illustrated storybooks for children. Users customize characters, settings, themes, and life lessons through a 7-step wizard, then receive a beautifully illustrated, page-by-page storybook they can read, share via link, or print.

**Live:** https://storybookstudio.org

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 |
| Story Generation | Anthropic Claude Sonnet 4.6 |
| Image Generation | Multi-provider router: OpenAI, Recraft, fal.ai (FLUX.2), Google |
| Database | Supabase Postgres |
| File Storage | Supabase Storage |
| Payments | Stripe Checkout (credit packs) |
| Email | Resend (magic-link recovery) |
| Hosting | Vercel |

---

## Local Development

### Prerequisites

- **Node.js 20** via nvm:
  ```bash
  export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
  ```

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Copy `.env.example` to `.env.local` and fill in your API keys:
   - `ANTHROPIC_API_KEY` (Claude)
   - `OPENAI_API_KEY`, `RECRAFT_API_KEY`, `FAL_KEY`, `GOOGLE_AI_KEY` (image providers)
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Stripe)
   - `RESEND_API_KEY` (email)
   - `DEVICE_COOKIE_SECRET` (identity cookie signing)
   - `APP_URL=http://localhost:3000` (development)

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Commands

- `npm run dev` — Start dev server (3000)
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
- `npm test` — Run vitest suite

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Architecture reference, API endpoints, data model, image provider routing, monetization, deployment notes, and agent guide for Claude Code
- **[docs/TASKS.md](./docs/TASKS.md)** — Live prioritized backlog (performance, features, bugs, hardening); delegation rubric for Haiku/Sonnet/Opus

---

## Key Features

- **AI-powered story generation** — Claude creates age-appropriate narratives with configurable writing voice, tone, and depth
- **Multi-provider image generation** — 8 book-inspired art aesthetics routed to the best provider per style
- **Character consistency** — Structured appearance customization + character sheet injection ensures the protagonist looks the same across all pages
- **Freemium monetization** — One free story per device, then prepaid credit packs via Stripe
- **Device library** — "My Stories" page to find past creations without account signup
- **Shareable reader** — Full-screen page-turn UI, works on mobile/tablet/desktop, no login required

---

## Phases Shipped

- **Phase 1** (MVP) — Wizard → Claude story gen → OpenAI images → Supabase → reader
- **Phase 2a** (Multi-provider) — 8 art aesthetics routed to OpenAI, Recraft, fal.ai, Google
- **Phase 2b.1** (Writing variety) — 8 voice presets, 6 tones, 4 depth modifiers
- **Phase 2c** (Visual redesign) — Warm-modern design system, new primitives, animated reader
- **Phase 3** (Monetization) — Freemium gating, Stripe Checkout, magic-link device recovery
- **Wave 1 hardening** (2026-07-07) — Parallel image generation, prompt deduplication, Zod validation, timeouts, vitest suite, My Stories

---

## License

Private / Proprietary
