-- Rename the pinned-digest prefix column to `digest_header` and introduce a
-- matching `digest_footer` block that is appended after the weekly schedule.
ALTER TABLE groups RENAME COLUMN digest_prefix TO digest_header;
ALTER TABLE groups ADD COLUMN digest_footer TEXT;
