-- FEAT-3: per-page illustration regenerate for story owners.
-- Each story gets a small budget of free per-page redraws. The count is
-- decremented optimistically by the regenerate endpoint and refunded on
-- failure. Default 3 for new + existing rows.
alter table stories add column if not exists regens_remaining int not null default 3;
