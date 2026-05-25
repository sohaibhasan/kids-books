-- Featured-story candidate flag for the home-page showcase.
-- The landing page picks 1 hero + 4 samples at random from the candidate pool
-- at request time, pinned per browser session via a cookie.

alter table stories
  add column if not exists featured_candidate boolean not null default false;

create index if not exists stories_featured_candidate_idx
  on stories (featured_candidate, created_at desc)
  where featured_candidate = true;

-- Tag the stories currently hardcoded on the landing page so the new dynamic
-- query has at least the existing showcase to draw from.
update stories set featured_candidate = true
  where slug in (
    'minha-y0mfr',
    'jake-1uq15',
    'john-tq6l4',
    'aamilah-u9n5m'
  );

-- Backfill: any completed story from the past week is a reasonable candidate.
update stories set featured_candidate = true
  where featured_candidate = false
    and images_done = true
    and created_at > now() - interval '7 days';
