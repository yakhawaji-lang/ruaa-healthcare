-- Allow file attachments on correspondence messages.
ALTER TABLE messages_thread ADD COLUMN attachment_url VARCHAR(300) NULL AFTER body;
ALTER TABLE messages_thread ADD COLUMN attachment_name VARCHAR(190) NULL AFTER attachment_url;
-- body may be empty when only a file is sent
ALTER TABLE messages_thread MODIFY body TEXT NULL;
