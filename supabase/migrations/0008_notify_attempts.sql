-- Tracks how many times the sweeper has attempted to send the success email.
alter table stories add column if not exists notify_attempts int not null default 0;
