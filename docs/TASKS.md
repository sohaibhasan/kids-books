# Task Backlog

Live backlog of delegable work, produced from a full codebase review on 2026-07-07. Each task is scoped so a single agent session can complete it. Check off tasks here (`[x]`) when merged.

## Delegation rubric

- **Haiku** — mechanical, fully-specified, 1–2 file changes with acceptance criteria checkable by lint/build. No judgment calls.
- **Sonnet** — standard multi-file features/refactors/bug fixes with a clear spec; may write tests; no changes to money paths or job-orchestration semantics.
- **Opus** — anything touching concurrency, the credit ledger/Stripe paths, prompt architecture, or where the spec requires design judgment.

Rules for every task:
- Run `npm run build` and `npm run lint` before finishing.
- Every BUG-n fix adds a vitest regression test (once HARD-8 lands).
- Tasks marked ⚠️ touch production money/reliability paths — **human review required before merge**, plus a preview-branch deploy and one real story generation before merging to `main` (main auto-deploys to production).

Priorities: **P0** do first (cost/reliability/UX-critical), **P1** high value, **P2** nice to have.

Suggested order:
1. **Wave 1 (P0):** PERF-3, BUG-1, CTX-5 → BUG-2 + HARD-1 (same PR) → PERF-1 ⚠️ → PERF-2 ⚠️ → BUG-3 → HARD-8 setup → CTX-1, FEAT-1
2. **Wave 2 (P1):** PERF-4/5/6, BUG-4/5/7/8, HARD-2, HARD-6, FEAT-2, FEAT-4, CTX-2/3/4
3. **Wave 3 (P2):** FEAT-3 ⚠️ (after HARD-2), FEAT-5/6/7, PERF-7, HARD-3/4/5/7/9/10, BUG-9/10

---

## 1. Performance

### [x] PERF-1 ⚠️ Parallelize image generation with a bounded worker pool — Opus, P0 — done 2026-07-07 (pending preview-deploy validation before push)
`lib/jobs/run-story-job.ts:125–227`. Replace the sequential `for (const page of pages)` loop with a concurrency-limited pool (3 workers; no new deps — simple index-cursor async workers). Must preserve:
- per-page `attempts`/`rewrites` budgets;
- `persistPageStatus` correctness — serialize writes (single mutex, or persist after each settle from one place);
- heartbeat cadence;
- the soft-deadline handoff (`run-story-job.ts:129`): stop dispatching new pages, persist, return `in_progress_handed_off`;
- "one fatal page aborts the story" (`:222`): on fatal, stop dispatching, let in-flight pages settle, then `failStory`.

Acceptance: 17-page story wall-clock ≈ ceil(17/3) × per-image time; `page_status` accurate after a crash + cron resume; if 429s spike, the existing transient-retry/backoff path still governs.

### [x] PERF-2 ⚠️ Stop paying for 17 copies of the character sheet — Opus, P0 — done 2026-07-07 (live-tested; pending preview-deploy validation before push)
`lib/ai/generate-story.ts:140–239`. Today the prompt orders Claude to paste `character_sheet` verbatim into every `scene_description` (~800 chars × ~17 pages ≈ 40–50% of output tokens). Change:
- tool schema returns `character_sheet` once + per-page `scene` (scene-only text);
- server composes `scene_description = stylePrefix + '. ' + character_sheet + '. ' + scene` before writing `pages` to the DB — stored shape and everything downstream (image gen, rewriter, reader) unchanged;
- persist `character_sheet` on the story row (or in `form`) and use it in `run-story-job.ts` instead of the regex re-extraction at `:325–336`;
- re-tune `max_tokens: 20000` (`generate-story.ts:197`) down to fit the new output (~8–10k).

Acceptance: generated story JSON in DB is byte-shape identical; token usage per story drops measurably (log `usage` from the final message before/after).

### [x] PERF-3 Downgrade the prompt-rewriter model to Haiku — Haiku, P0 — done 2026-07-07
`lib/ai/sanitize-prompt.ts:44`: `claude-sonnet-4-6` → `claude-haiku-4-5-20251001`. The task (rewrite an image prompt to dodge a safety/format error while preserving character sheet + style prefix) is well within Haiku. Acceptance: build passes; manually trigger one rewrite (feed a known-blocked prompt) and confirm output keeps the sheet + prefix.

### [x] PERF-4 Trust `page_status` instead of listing Storage per page — Haiku, P1 — done 2026-07-07
`run-story-job.ts:277–281` (`imageExists`) does a `storage.list()` for every not-done page on every (re)claim. Only call it when the page's status is `in_progress` (a prior worker may have crashed between upload and status persist); for `pending` pages skip straight to generation. Acceptance: fresh story does zero `storage.list` calls; resumed story still recovers already-uploaded pages.

### [x] PERF-5 Slim the status endpoint + adaptive polling — Sonnet, P1
`app/api/stories/[slug]/status/route.ts` + `app/generating/[slug]/page.tsx` (`POLL_MS = 3000`).
(a) Return only fields the generating page renders; skip the `credit_events` query except when status is `failed`/`refunded`.
(b) Client: poll at 3s during `generating_images`, back off to 5–8s during `pending`/`generating_text` and after 2 minutes elapsed.
Acceptance: payload size drops; page still flips to reader within a few seconds of completion.

### [x] PERF-6 Reader image loading: `next/image` + adjacent-page preload — Sonnet, P1
`components/reader/StoryReader.tsx:138` and `components/reader/ReaderNav.tsx:76` use raw `<img>` with full-res Supabase URLs. Convert to `next/image` with `sizes` (correct pattern already in `components/marketing/Hero.tsx:130–136`; `next.config.ts` already allowlists the Supabase host). Preload current±1 page images (hidden `<Image priority>` or `link rel=preload`). ReaderNav thumbnails get small `sizes` so Next serves resized variants. Acceptance: page-turn shows no image pop-in on a warm story; image weight on `/read/[slug]` drops.

### [x] PERF-7 Memoize StoryPreview — Haiku, P2 — done 2026-07-08
`components/wizard/StoryPreview.tsx` (274 lines) re-renders on every keystroke. Wrap the export in `React.memo`; move per-render option-array `.find()` lookups into `useMemo` keyed on the relevant `data` fields. Acceptance: React DevTools shows no StoryPreview re-render when typing in an unrelated field. (Fine before or after HARD-6.)

---

## 2. Feature improvements

### [x] FEAT-1 "My stories" device library — Sonnet, P0 — done 2026-07-07
No way to find a story again without the URL. On successful enqueue (`WizardContainer` after `POST /api/stories/start` returns `{slug}`), append `{slug, child_name, created_at}` to localStorage key `kb_my_stories`; on the generating page's completion poll, patch in the real title. New route `app/stories/page.tsx` (client) listing entries with cover thumbnail (`page-00.png` public URL pattern from `lib/jobs/run-story-job.ts:288–290`), linking to `/read/[slug]`. Link from `components/marketing/Header.tsx` and the reader chrome. Acceptance: create story → appears in library; clearing localStorage empties it (acceptable in the no-accounts model); empty state has a CTA to the wizard.

### [x] FEAT-2 Wizard draft autosave — Sonnet, P1 — done 2026-07-07
Wizard state dies on refresh (sessionStorage is only used for the post-Stripe resume, `WizardContainer.tsx:103–105`). Debounced (~500ms) save of `{step, data}` to localStorage `kb_wizard_draft`; on mount, if a draft exists and differs from defaults, show a dismissible "Resume where you left off?" bar (restore vs. start fresh). Clear the draft on successful submit. Must not interfere with the `?paid=1` sessionStorage resume path. Acceptance: fill 3 steps → refresh → resume restores step + data; submit clears draft.

### [x] FEAT-3 ⚠️ Per-page regenerate (storyboard-lite) — Opus, P1 (after HARD-2) — done 2026-07-08
The Phase 2b flagship. New endpoint `POST /api/stories/[slug]/pages/[n]/regenerate`:
- verify device ownership (`device_id` from `lib/identity.ts` matches the story row);
- enforce a per-story regen budget (e.g. 3 free regens stored on the row);
- reset that page's `page_status` to `pending` (reset attempts), overwrite the old image;
- reuse the `generatePage()` extracted in HARD-2 for a single page.

Reader UI: small "Regenerate this illustration" affordance behind an owner check (device cookie), spinner state driven by the status endpoint. Acceptance: regen replaces exactly one image; budget decrements; non-owner devices never see the button; story stays `complete` throughout.

### [x] FEAT-4 Read-aloud — Sonnet, P1 — done 2026-07-07
Web Speech API (`speechSynthesis`) button in the reader: play/pause per page, auto-advance page when the utterance ends (toggleable). Child-friendly rate (~0.95), prefer an `en` voice; hide the button when `speechSynthesis` is unavailable; stop speech on page change/unmount. Note: iOS requires a user-gesture start. Acceptance: works in Chrome + Safari iOS; no orphaned speech after navigating away.

### [x] FEAT-5 Print/PDF export polish — Sonnet, P2 — done 2026-07-08
`SharePopover.tsx` already triggers `window.print()`. Add a print stylesheet (`@media print` in `globals.css`, or a dedicated `app/read/[slug]/print/page.tsx` rendering all pages sequentially, one per sheet, image + text, no chrome). Rename the action "Save as PDF / Print". Acceptance: print preview shows one clean page per story page, no nav/chrome, images not clipped.

### [x] FEAT-6 Reader night/day mode — Haiku, P2 — done 2026-07-08
Reader is hard-coded dark (`bg-night`). Add a sun/moon `IconButton` toggle in `ReaderChrome` persisting to localStorage `kb_reader_theme`; light mode uses existing cream tokens from `app/globals.css`. Class swaps: container `bg-night → bg-cream`, `text-white → text-ink`, glass buttons `bg-white/15 → bg-black/10` (verify each against the tokens). Acceptance: toggle persists across stories; both modes meet contrast on the prose text.

### [x] FEAT-7 Featured-story gallery — Sonnet, P2 — done 2026-07-08
`lib/featured-stories.ts` (206 lines) exists with hardcoded metadata; surface it: `/gallery` page of featured covers linking to readers, linked from the landing page (reuse the `SampleShowcase` card pattern). Acceptance: gallery renders from `featured-stories.ts` only; no DB changes.

---

## 3. Bug fixes

### [x] BUG-1 Unhandled rejection from fire-and-forget heartbeats — Haiku, P0 — done 2026-07-07
`run-story-job.ts:65` passes `() => { void beat() }` into `generateStoryStream`, and `beat()` (`:36–40`) awaits `heartbeat(slug)` with no catch — a transient Supabase error becomes an unhandled rejection inside a `waitUntil` job. Wrap the `beat` body in try/catch (log + continue); same for the `void maybeAlertProviderQuota(...)` calls (`:168`, `:256`) if they can reject. Acceptance: grep shows no bare `void somethingAsync()` in `lib/jobs/`; build passes.

### [x] BUG-2 ⚠️ Validate the wizard form at the API boundary — Sonnet, P0 — done 2026-07-07 (with HARD-1)
`app/api/stories/start/route.ts:20–41` only checks `child_name` and email; `art_style`, `length`, `tone`, `writing_style`, `child_age`, `depth_modifiers` flow unvalidated into prompts and the provider router (unknown `art_style` silently falls back at `run-story-job.ts:101`). Add `zod` (new dep); define `WizardFormSchema` in `lib/validation.ts` with enums sourced from `types/index.ts`, `child_age` int 2–12, the existing `clampText` caps folded in, `.strip()` unknown keys. Parse in the route; on failure return the existing `{error}` 400 shape. Acceptance: request with `art_style: "x"` → 400; valid wizard payload unchanged end-to-end.

### [x] BUG-3 Timeout the Claude calls — Sonnet, P0 — done 2026-07-07
`lib/ai/generate-story.ts:195` (stream) and `lib/ai/sanitize-prompt.ts` have no timeout; a hung call eats the whole 240s job budget before the sweeper can help. The Anthropic SDK accepts a per-request `timeout` — set ~120s on story gen and ~30s on rewrites; ensure the timeout error propagates so the catch at `run-story-job.ts:253` hands off to cron. Acceptance: simulated hang (temporarily set timeout to 1ms) results in `in_progress_handed_off`, not a silent 240s stall.

### [x] BUG-4 Retry unsent success emails from the sweeper — Sonnet, P1 — done 2026-07-07 (operator: apply migration 0008 in Supabase)
`run-story-job.ts:283–313`: if the success email fails, `notify_email_sent_at` stays null by design, but nothing ever retries — the admin endpoint is manual. In `/api/cron/resume-stories` (runs every 2 min via `.github/workflows/cron-resume-stories.yml`), also query `status='complete' AND email IS NOT NULL AND notify_email_sent_at IS NULL AND last_progress_at < now()-'10 min'` and call the existing send path (export `sendSuccessIfNeeded`). Cap retries (small migration adding `notify_attempts` if needed). Acceptance: force a send failure (bad RESEND key in dev) → next sweep retries; success stamps the timestamp.

### [x] BUG-5 `?paid=1` resume fails silently — Sonnet, P1
`WizardContainer.tsx:125–157`: arriving at `/wizard?paid=1` with a missing/corrupt sessionStorage stash shows a success toast but silently does nothing (empty catch at `:147`). When the stash is absent/unparseable: toast "Payment received — your credit is ready. Your previous inputs couldn't be restored, please review and submit again." and land on the review step if partial data exists, else step 1. Acceptance: clear sessionStorage, hit `/wizard?paid=1` → explicit message, no dead-end.

### [x] BUG-6 ⚠️ Guard test-mode webhooks in production — Sonnet, P1 — done 2026-07-08
`app/api/stripe/webhook/route.ts:36–58` tries the live secret then the test secret. After a successful `constructEvent`, check `event.livemode`: if `false` in production (`process.env.VERCEL_ENV === 'production'`), log loudly and **skip granting credits** unless `ALLOW_TEST_WEBHOOKS=1` is set (keeps the CLI replay workflow usable). The `unique(stripe_session)` constraint already prevents dupes; this closes the "test event grants live credits" hole. Acceptance: replayed test event in prod logs + creates no `credit_events` row; live events unaffected. Human review required.

### [x] BUG-7 Remove the dead Google image provider (or revive it) — Sonnet, P1 — done 2026-07-07
`GOOGLE_AI_KEY` has been returning 429 `limit: 0` for all Gemini image models — the "free fallback" is non-functional, and any story routed to it burns all 8 attempts and fails. First verify with one live call (script in scratchpad, not the repo). Then either (a) owner enables billing, or (b) remove `google` from `selectProviderForStyle` fallbacks in `lib/ai/generate-image.ts`, delete the provider branch, and update CLAUDE.md's provider table. Default to (b) if quota is still 0. Acceptance: no code path can select a provider whose env key is absent/dead; docs match.

### [x] BUG-8 Error boundaries for reader + generating pages — Haiku, P1
Add `app/read/[slug]/error.tsx` and `app/generating/[slug]/error.tsx` (client components, on-brand copy, "Try again" via `reset()`, link home). Follow existing design tokens (`bg-cream`, Fraunces heading, `Button` primitive). Acceptance: throwing inside `StoryReader` renders the boundary instead of a blank screen.

### [x] BUG-9 Companion name without companion type — Haiku, P2 — done 2026-07-08
`StepSetting.tsx:34–44` / `StepReview.tsx:42–44`: a user can set `companion_name` with no companion selected → inconsistent form state. In `StepSetting`, clear `companion_name` when the last companion is deselected; in review, only show the name when a companion exists. Add shared `parseCompanions()` in `lib/utils.ts` replacing both comma-split sites. Acceptance: deselect companion → name field hidden and cleared.

### [x] BUG-10 Email edge cases — Haiku, P2 — done 2026-07-08
(a) `StepReview.tsx:199–203` `maskEmail` assumes one `@` — guard malformed input (return as-is).
(b) Keep the simple regex but add trailing-dot / consecutive-dot checks, shared between client (`WizardContainer.tsx:62`) and server (`app/api/stories/start/route.ts:123–125`) — export one `isValidEmail` from `lib/utils.ts`, import in both places.
Acceptance: `a@@b.c`, `a@b.`, `a..b@c.d` rejected consistently client + server.

---

## 4. Codebase hardening

### [x] HARD-1 Typed parsing for JSONB columns — Sonnet, P0 — done 2026-07-07 (with BUG-2; note: clampText/isValidEmail logic now lives inside WizardFormSchema, adjust BUG-10/HARD-8 accordingly)
`run-story-job.ts:315–323` (`parseForm` blind-casts; `parsePages` silently returns `[]`) and `status/route.ts` re-implement ad-hoc parsing. In `lib/validation.ts`, add `StoryPageSchema` + `parseStoryRow()` used by `run-story-job.ts`, `status/route.ts`, `app/read/[slug]/page.tsx`, and `lib/jobs/claim.ts`. Corrupt data → thrown typed error → existing failure paths (job hands off / page 404s) instead of undefined behavior. Acceptance: all `as WizardFormData` / `as Array<…>` casts on DB reads are gone.

### [x] HARD-2 Split `runStoryJob` into phases — Sonnet, P1 (after PERF-1) — done 2026-07-07
`lib/jobs/run-story-job.ts` (347 lines, 267-line function) → `textPhase()`, `imagePhase()` (contains the worker pool + a reusable `generatePage()` — FEAT-3 depends on this), `finalize()`. Pure mechanical extraction, no behavior change; keep the single try/catch + handoff semantics at the top level. Acceptance: diff shows moved code only; build passes; a full story generates end-to-end on a preview deploy.

### [x] HARD-3 Central constants — Haiku, P2 — done 2026-07-08
Create `lib/config.ts` gathering: job budgets (`run-story-job.ts:13–17`), `POLL_MS`, the `FREE_GLOBAL_DAILY` default, image `BUCKET`. (Pack display strings stay in `lib/credits.ts`.) Import everywhere; no value changes. Acceptance: grep shows each old literal defined once.

### [x] HARD-4 Shared story-row select + type — Haiku, P2 — done 2026-07-08
`lib/jobs/claim.ts:36` and `status/route.ts:24–27` maintain divergent select strings. Export `STORY_SELECT` + `StoryRow` from `lib/jobs/claim.ts` (or a new `lib/db.ts`) and use in both. Acceptance: one definition, both routes compile.

### [x] HARD-5 Standard API error helper — Sonnet, P2 — done 2026-07-08
Routes return `{error}`, `{paywall, packs}`, and bare 500s inconsistently. Add `apiError(status, code, message)` + `apiOk(data)` in `lib/api.ts`; migrate `stories/start`, `status`, `checkout`, `credits/claim` (the webhook keeps Stripe's expected 2xx/4xx semantics). Keep the `paywall` shape working — `WizardContainer` reads it; update both sides together. Acceptance: paywall + error toasts still function in the browser.

### [x] HARD-6 Wizard options registry — Sonnet, P1 — done 2026-07-07
`StoryPreview.tsx` imports option arrays from 9 step files (SKIN_TONES, GENRES, LESSONS, SETTINGS, COMPANIONS, ART_STYLES, LENGTHS, OUTFITS + voice/tone maps) — tight coupling. Move all option arrays to `lib/wizard-options.ts` (one export per array, types alongside); steps and StoryPreview import from there; step files keep only UI. Acceptance: no step file exports data; StoryPreview imports options from exactly one module; wizard renders identically.

### [ ] HARD-7 UI class-blob dedupe — Haiku, P2
(a) Extract the repeated glass-button classes (`ReaderNav.tsx:45`, similar in `ReaderChrome`) into an `IconButton` `variant="glass"` in `components/ui/IconButton.tsx`.
(b) After HARD-6: move the `toneSwatch`/`toneCheck` maps from `SelectCard.tsx:27–45` into `lib/wizard-options.ts` so tone→class mapping has one source.
Acceptance: visual parity (compare screenshots); grep finds each class blob once.

### [x] HARD-8 Test infrastructure + first suite — Sonnet (setup), P0 — setup done 2026-07-07 (82 assertions, `npm test`); Haiku expansion tasks remain open
No tests exist. Add `vitest` (devDep) + `"test": "vitest run"` script. First suite, pure functions only (no network/DB): `lib/credits.ts` balance math (mock the supabase client or extract the pure calc), `lib/ai/classify-image-error.ts` (feed representative provider errors), `lib/utils/slug.ts`, `clampText`/`isValidEmail` (move to `lib/utils.ts` per BUG-10), `extractCharacterSheet`/`extractStylePrefix`. Acceptance: `npm test` green locally; ≥20 assertions.

### [ ] HARD-9 Accessible modal primitive — Sonnet, P2
`components/paywall/PaywallModal.tsx` is a hand-rolled overlay (no focus trap, no scroll lock, manual Esc). Radix is already a dependency — wrap `@radix-ui/react-dialog` (new subpackage) as `components/ui/Dialog.tsx` styled with existing tokens; rebuild PaywallModal on it, keeping the motion entrance. Acceptance: Tab cycles inside the modal, Esc closes, focus returns to the trigger, background scroll locked.

### [ ] HARD-10 Repo cleanup — Haiku, P2 (needs owner sign-off on (b))
(a) Delete the empty `app/api/pages/` directory.
(b) The 6.6 MB `stories/` GitHub-Pages exports predate Vercel — move to a separate branch or archive; **do not delete without the owner confirming** the two published GH Pages links can go stale or be redirected.
(c) Remove `HF_TOKEN` from `.env.example` (marked "reserved", used nowhere in source).
Acceptance: build passes; CLAUDE.md links updated if (b) executes.

---

## 5. Global context updates

### [x] CTX-1 Rewrite CLAUDE.md architecture sections — Sonnet, P0 — done 2026-07-07
CLAUDE.md documents deleted routes (`POST /api/stories`, SSE `GET /api/stories/[slug]/images` with event shapes) and omits the real production architecture. Rewrite "Implemented API Endpoints" and the app-structure tree, and add a "Background job pipeline" section covering: `POST /api/stories/start` (credit-first + refund-on-failure), `lib/jobs/run-story-job.ts` (claim/heartbeat/soft-deadline/attempt budgets/`page_status`), the `/api/stories/[slug]/status` polling contract, `/api/stories/[slug]/abandon`, `/api/admin/story-email/[slug]`, `/api/cron/resume-stories` + the GH Actions sweeper (every 2 min, `CRON_SECRET`), `/api/internal/process-story`, the error-classification + prompt-rewrite loop (`classify-image-error.ts`, `sanitize-prompt.ts`), `lib/featured-stories.ts`, the "Your Ideas" wizard step + `custom_*` form fields, and migrations 0003–0007. Update the phase list. Acceptance: every route under `app/api/**` appears; no removed route is mentioned.

### [x] CTX-2 Refresh or retire `state.md` and `project_plan.md` — Haiku, P1
`state.md` says "Phase 2b, 2026-04-12"; reality is post-Phase-3 production reliability work (July 2026). Replace the `state.md` body with: current phase, last-updated date, and a link to `docs/TASKS.md` as the live backlog. Trim `project_plan.md` to the still-unbuilt vision items (storyboard editor, subscriptions, print-on-demand, classroom, bilingual) with a header pointing to CLAUDE.md for current state. Acceptance: no date/phase claims contradict CLAUDE.md.

### [x] CTX-3 Add a README.md — Haiku, P1
Repo has none. Short: what the product is, live URL, stack table (condensed from CLAUDE.md), local dev (nvm Node 20, `npm run dev`, `.env.example`), pointers to CLAUDE.md (agent docs) and docs/TASKS.md (backlog). Acceptance: a newcomer can boot dev from the README alone.

### [x] CTX-4 Agent-efficacy upgrades to `.claude/` + CLAUDE.md — Sonnet, P1 — done 2026-07-07
(a) Add a "Working on this repo" section to CLAUDE.md: build/lint/test commands; a "money-path files require human review" list (`lib/credits.ts`, `app/api/stripe/webhook/route.ts`, `app/api/checkout/route.ts`, `app/api/stories/start/route.ts`); the "every bug fix adds a vitest regression test" rule; pointer to docs/TASKS.md and its delegation rubric.
(b) Create checked-in `.claude/` project skills for two recurring chores: `new-migration` (next number in `supabase/migrations/`, naming convention, apply command) and `deploy-check` (build + lint + grep for stray console.logs + confirm no `.env` values in the diff).
(c) Fold the `AGENTS.md` Vercel notes into CLAUDE.md or reference them explicitly.
Acceptance: `/new-migration` invocable in a fresh session.

### [x] CTX-5 Secrets hygiene — owner action + Haiku, P0 — code half done 2026-07-07; owner must still revoke/rotate the GitHub + HF tokens in .env
Local `.env` contains plaintext `GITHUB_TOKEN` (ghp_…), `HF_TOKEN`, and a Gemini key; `.gitignore` covers them but they sit unrotated on disk and the HF/GH tokens are unused by the app. **Owner:** revoke/rotate the GitHub and HF tokens. **Haiku:** remove `HF_TOKEN` from `.env.example` and the CLAUDE.md env list. Acceptance: no unused credentials in env templates or docs.

### [x] CTX-6 Land this backlog as `docs/TASKS.md` — done 2026-07-07
This file, plus a pointer line in CLAUDE.md.
