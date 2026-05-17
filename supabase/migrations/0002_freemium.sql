-- Freemium gating: tag stories with the device that created them, ledger of credits,
-- and magic-link tokens for cross-device recovery. Additive only — existing rows safe.

alter table stories
  add column if not exists device_id text,
  add column if not exists fallback_hash text,
  add column if not exists credit_event_id uuid;

create index if not exists stories_device_id_idx     on stories(device_id);
create index if not exists stories_fallback_hash_idx on stories(fallback_hash);

create table if not exists credit_events (
  id              uuid primary key default gen_random_uuid(),
  device_id       text not null,
  delta           int  not null,
  reason          text not null,
  stripe_session  text unique,
  story_slug      text,
  email           text,
  created_at      timestamptz not null default now()
);
create index if not exists credit_events_device_idx on credit_events(device_id);

create table if not exists credit_claim_tokens (
  token         text primary key,
  email         text not null,
  source_device text not null,
  expires_at    timestamptz not null,
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table credit_events       enable row level security;
alter table credit_claim_tokens enable row level security;

create policy "Service role only" on credit_events
  for all using (auth.role() = 'service_role');

create policy "Service role only" on credit_claim_tokens
  for all using (auth.role() = 'service_role');
