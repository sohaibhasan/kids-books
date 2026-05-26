-- Background job state for server-side story generation.
--
-- Today generation runs inside two long-lived SSE streams owned by the
-- /generating tab. Close the tab → the connection dies → the function loses
-- its listener and we never write progress back. This migration moves story
-- and image generation into a Vercel serverless background job (waitUntil +
-- cron sweep), with per-page progress tracked in the `stories` row itself
-- so a cron pickup can resume mid-story.

alter table stories
  add column if not exists status text not null default 'pending',
  add column if not exists email text,
  add column if not exists notify_email_sent_at timestamptz,
  add column if not exists last_progress_at timestamptz not null default now(),
  add column if not exists attempts_total int not null default 0,
  add column if not exists attempts_remaining int not null default 6,
  add column if not exists failure_reason text,
  add column if not exists page_status jsonb not null default '[]'::jsonb;

-- Allow inserting a "pending" row before Claude has written the pages.
-- The pre-existing `pages` column was created by an earlier migration and
-- may already be NOT NULL with no default — but the start route now writes
-- `pages: []` explicitly on insert, so we only backfill any stragglers and
-- leave the column shape unchanged.
update stories set pages = '[]' where pages is null;

-- Status constraint — gated values only. Drop-then-add so re-running the
-- migration after an enum change works cleanly.
alter table stories drop constraint if exists stories_status_check;
alter table stories add constraint stories_status_check
  check (status in ('pending', 'generating_text', 'generating_images', 'complete', 'failed'));

-- Cron sweeper hot path: cheap lookup of stale in-flight jobs.
create index if not exists stories_status_progress_idx
  on stories (status, last_progress_at)
  where status in ('pending', 'generating_text', 'generating_images');

-- Backfill historical rows so /generating works for old slugs and
-- everything pre-migration with images_done=false is treated as failed
-- (its credit was already refunded or it was a free attempt).
update stories set status = 'complete' where images_done = true and status = 'pending';

update stories set status = 'failed', failure_reason = 'pre-migration in-flight'
where images_done = false
  and status = 'pending'
  and id in (
    select s.id from stories s
    left join credit_events e
      on e.story_slug = s.slug and e.reason = 'refund_failed_gen'
    where s.images_done = false and (e.id is not null or s.created_at < now() - interval '1 hour')
  );
