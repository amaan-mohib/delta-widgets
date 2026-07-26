-- Add down migration script here
DROP TABLE IF EXISTS chats;
DROP TRIGGER IF EXISTS update_chats_updated_at;