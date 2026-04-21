-- Per-group customization: IANA timezone and optional pinned-digest prefix.
ALTER TABLE groups ADD COLUMN tz            TEXT NOT NULL DEFAULT 'Europe/Moscow';
ALTER TABLE groups ADD COLUMN digest_prefix TEXT;
