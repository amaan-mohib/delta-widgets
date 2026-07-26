-- Add up migration script here
CREATE TABLE IF NOT EXISTS chats (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT,
    data JSON,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now')),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now'))
);

-- Create trigger to update updated_at automatically
DROP TRIGGER IF EXISTS update_chats_updated_at;
CREATE TRIGGER update_chats_updated_at
AFTER
UPDATE
    ON chats FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at BEGIN
UPDATE
    chats
SET
    updated_at = unixepoch('now')
WHERE
    id = NEW.id;
END;