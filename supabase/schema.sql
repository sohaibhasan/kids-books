-- Stories table
create table if not exists stories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  form        jsonb not null,
  pages       jsonb not null,
  images_done boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Public read access (no auth required for the reader)
alter table stories enable row level security;

create policy "Public read" on stories
  for select using (true);

create policy "Service role write" on stories
  for all using (auth.role() = 'service_role');
