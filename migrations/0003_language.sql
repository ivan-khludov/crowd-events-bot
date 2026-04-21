-- Per-group UI language. Defaults to English.
ALTER TABLE groups ADD COLUMN language TEXT NOT NULL DEFAULT 'en';
