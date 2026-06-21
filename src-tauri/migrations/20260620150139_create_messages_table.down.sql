-- Add down migration script here
DROP TABLE IF EXISTS messages;
DROP TRIGGER IF EXISTS update_messages_updated_at;