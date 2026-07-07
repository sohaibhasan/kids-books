# Project State

Last updated: 2026-07-07

Live in production at https://storybookstudio.org.

## Current Phase

**Phases 1–3b complete.** MVP, multi-provider image generation, writing voices, visual redesign, freemium monetization, and background-job pipeline (parallel image generation, character-sheet deduplication, Zod validation, Claude call timeouts, vitest test suite, My Stories library) are all live.

Current work: reliability and performance hardening.

Wave 1 of `docs/TASKS.md` shipped 2026-07-07:
- Parallel image generation with a 3-worker pool
- Character sheet deduplication (moved from prompt to server-side composition)
- Zod schema validation at the API boundary
- 120s timeout on Claude story generation, 30s on prompt rewrites
- vitest infrastructure + 82+ assertion test suite
- "My Stories" device library (`app/stories/page.tsx`)

## References

- **Live backlog & delegation rubric:** `docs/TASKS.md`
- **Architecture & agent guide:** `CLAUDE.md`
