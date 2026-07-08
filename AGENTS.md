<!-- VERCEL BEST PRACTICES START -->
See **CLAUDE.md** for full project guidance (architecture, API endpoints, background job pipeline, monetization, deployment, and working conventions).

## Vercel notes that apply to this repo

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons); Supabase is the durable store.
- Store secrets in Vercel Env Variables — never in git or `NEXT_PUBLIC_*` prefixes.
- Use `waitUntil` for post-response background work (already in use via `lib/jobs/run-story-job.ts`); avoid the deprecated Function `context` parameter.
- Tune `maxDuration` for long I/O-heavy calls — story generation and image phases both need extended limits (see `app/api/internal/process-story/route.ts`).
- Cron Jobs run in UTC and trigger your production URL via HTTP GET; this project uses GitHub Actions every 2 min instead of Vercel's native cron (Hobby plan caps at once/day).
<!-- VERCEL BEST PRACTICES END -->
