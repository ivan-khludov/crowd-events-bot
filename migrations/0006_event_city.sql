-- Add a `city` column to events. Existing rows default to an empty string so
-- the renderer can fall back to the pre-city layout for them; new events
-- collected via the conversation flow always have a non-empty value.
ALTER TABLE events ADD COLUMN city TEXT NOT NULL DEFAULT '';
