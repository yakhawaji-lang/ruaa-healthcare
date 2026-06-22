-- Per-admin permissions (JSON) + active flag for the control-panel user management.
-- Existing admins keep full access (NULL permissions = super admin).
ALTER TABLE admins ADD COLUMN permissions TEXT NULL;
ALTER TABLE admins ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
