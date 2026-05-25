-- Close the free-tier concurrent-request race in lib/credits.ts:getEntitlement.
-- Two simultaneous requests from a brand-new device can both pass the
-- `hasUsedFree` check (snapshot reads), then both insert a story with
-- credit_event_id = NULL — bypassing the one-free-per-device cap.
--
-- A partial unique index makes the second concurrent insert fail with a
-- 23505 unique-violation, which app/api/stories/route.ts can catch and
-- treat as "paywall required" without writing a story.
--
-- These indexes are partial (WHERE credit_event_id IS NULL) so paid stories
-- — which already have a non-null credit_event_id — are unconstrained.

create unique index if not exists one_free_per_device
  on stories (device_id)
  where credit_event_id is null and device_id is not null;

create unique index if not exists one_free_per_fallback_hash
  on stories (fallback_hash)
  where credit_event_id is null and fallback_hash is not null;
