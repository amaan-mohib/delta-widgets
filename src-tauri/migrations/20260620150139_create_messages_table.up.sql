-- Add up migration script here
CREATE TABLE IF NOT EXISTS messages (
    id TEXT NOT NULL PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    content JSON,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now')),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create trigger to update updated_at automatically
DROP TRIGGER IF EXISTS update_messages_updated_at;
CREATE TRIGGER update_messages_updated_at
AFTER
UPDATE
    ON messages FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at BEGIN
UPDATE
    messages
SET
    updated_at = unixepoch('now')
WHERE
    id = NEW.id;
END;