-- Per-group bookkeeping for the daily "events today" announcement.
-- Stores the last local day (YYYY-MM-DD in the group's tz) for which the
-- cron loop published a daily digest, so retries and frequent ticks do not
-- post duplicates.
ALTER TABLE groups ADD COLUMN last_daily_digest_day TEXT;
