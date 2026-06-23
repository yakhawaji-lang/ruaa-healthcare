-- Sub-users under an insurance company: members share the company's cases.
ALTER TABLE users ADD COLUMN parent_user_id INT NULL AFTER role;
ALTER TABLE users ADD KEY idx_parent_user (parent_user_id);
