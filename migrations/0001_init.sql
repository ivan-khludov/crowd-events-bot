-- Per-group configuration and pinned-digest bookkeeping.
CREATE TABLE IF NOT EXISTS groups (
    chat_id                  INTEGER PRIMARY KEY,
    username                 TEXT,
    title                    TEXT,
    vote_threshold           INTEGER NOT NULL DEFAULT 10,
    daily_limit              INTEGER NOT NULL DEFAULT 3,
    pinned_digest_message_id INTEGER,
    last_digest_week_start   TEXT,
    created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Submitted events. One row per mention-reply that successfully finished the FSM.
CREATE TABLE IF NOT EXISTS events (
    id                  TEXT    PRIMARY KEY,
    group_chat_id       INTEGER NOT NULL,
    creator_id          INTEGER NOT NULL,
    original_message_id INTEGER NOT NULL,
    title               TEXT    NOT NULL,
    place               TEXT    NOT NULL,
    datetime_utc        TEXT    NOT NULL,
    status              TEXT    NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved')),
    vote_message_id     INTEGER,
    votes_up            INTEGER NOT NULL DEFAULT 0,
    votes_down          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (group_chat_id) REFERENCES groups(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_group_status_dt
    ON events (group_chat_id, status, datetime_utc);

CREATE INDEX IF NOT EXISTS idx_events_creator_created
    ON events (creator_id, created_at);

-- One vote per (event, user). Changing a vote is INSERT OR REPLACE.
CREATE TABLE IF NOT EXISTS votes (
    event_id TEXT    NOT NULL,
    user_id  INTEGER NOT NULL,
    type     TEXT    NOT NULL CHECK (type IN ('up','down')),
    created_at TEXT  NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_votes_event ON votes (event_id);

-- Persistent store for grammY session / conversations state.
CREATE TABLE IF NOT EXISTS sessions (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
