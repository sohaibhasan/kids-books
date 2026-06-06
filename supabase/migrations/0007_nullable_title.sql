-- 0006_background_jobs introduced the two-phase flow: /api/stories/start inserts
-- a "pending" row immediately (so the client gets a slug to poll), then the
-- background job fills in title + pages once Claude responds. That migration
-- relaxed `pages` for this flow but left `title` as NOT NULL, so the pending-row
-- insert (title: null) fails the constraint and no story can be created.
alter table stories alter column title drop not null;
