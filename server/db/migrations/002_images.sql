-- Add an editable image path to services.
ALTER TABLE services ADD COLUMN image VARCHAR(300) NULL AFTER icon;
