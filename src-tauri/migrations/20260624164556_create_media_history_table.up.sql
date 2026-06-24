-- Add up migration script here
CREATE TABLE IF NOT EXISTS media_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT NOT NULL DEFAULT '',
    duration_ms INTEGER,
    thumbnail BLOB,
    play_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now'))
    UNIQUE(player_name, title, artist)
);

CREATE TABLE IF NOT EXISTS media_plays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL REFERENCES media_history(id) ON DELETE CASCADE,
  duration_ms INTEGER,
  played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
