-- Per-provider alert state: tracks when we last emailed about a 402/429
-- so we can debounce alerts to at most once per hour per provider.

create table if not exists provider_alerts (
  provider          text primary key,
  last_alerted_at   timestamptz not null default now(),
  last_status       int,
  last_error        text,
  alert_count       int  not null default 0,
  created_at        timestamptz not null default now()
);

alter table provider_alerts enable row level security;

drop policy if exists "Service role only" on provider_alerts;
create policy "Service role only" on provider_alerts
  for all using (auth.role() = 'service_role');
