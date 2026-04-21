-- Allowlist of chat ids the bot is allowed to serve. Groups/supergroups that
-- are not in this table cause the bot to leave the chat on sight, preventing
-- unknown chats from consuming Worker/D1 budget.
CREATE TABLE IF NOT EXISTS allowed_chats (
    chat_id    INTEGER PRIMARY KEY,
    added_by   INTEGER NOT NULL,
    note       TEXT,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
