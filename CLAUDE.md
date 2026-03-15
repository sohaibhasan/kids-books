# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web app where parents, teachers, and caregivers create personalized illustrated storybooks for children. Users customize characters, settings, themes, and lessons — then get a page-by-page storybook they can share via link or print.

## Planned Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) + Tailwind CSS |
| Animation | Framer Motion or react-spring |
| State | Zustand or React Context |
| Backend | Next.js API routes or Node/Python service |
| AI Story Gen | Claude API (Anthropic) |
| AI Image Gen | Google Gemini API (free tier) |
| Database | PostgreSQL via Supabase or PlanetScale |
| File Storage | AWS S3 or Cloudflare R2 |
| Auth | Clerk, NextAuth, or Supabase Auth |
| Hosting | Vercel or Cloudflare Pages |

## Architecture

### Core Data Model

```
User → Story → Page (text + illustration + scene prompt)
             → Character (protagonist/supporting + reference image)
```

- `Story` has a unique `share_slug` for public reader URLs (`/read/:slug`)
- `Page` stores both generated text and the scene description prompt used for image generation
- `Character` stores appearance details and a reference image URL for cross-page consistency

### Key API Endpoints

```
POST   /api/stories                 → Create story from wizard inputs
GET    /api/stories/:id             → Fetch full story with pages
POST   /api/stories/:id/generate    → Trigger AI story + illustration generation
PATCH  /api/pages/:id               → Edit a single page
POST   /api/pages/:id/regenerate    → Regenerate one illustration
GET    /api/read/:slug              → Public reader (no auth required)
```

### User Flow

1. **Wizard** — collect child details, genre, theme/lesson, setting, characters, tone, length
2. **Generate** — Claude API produces story text; image API generates per-page illustrations
3. **Storyboard editor** — drag-and-drop cards to reorder/edit/regenerate pages
4. **Publish** — shareable reader link, full-screen page-turn UI

### Character Consistency (Key Technical Challenge)

Generate a front-facing/profile reference sheet from user appearance inputs, then pass it alongside each scene prompt. Fallback: use a more stylized/abstract art style where minor variation is acceptable.

## Development Phases

- **Phase 1 (MVP)** — Wizard → Claude story gen → one art style → reader view → shareable link
- **Phase 2** — Storyboard editor, multiple art styles, character customization, read-aloud, night mode
- **Phase 3** — User accounts, story library, age-tier vocabulary, bilingual support
- **Phase 4** — Stripe payments, subscriptions, print-on-demand, classroom accounts

## Commands

No build system configured yet. Update this section once the Next.js project is initialized.
