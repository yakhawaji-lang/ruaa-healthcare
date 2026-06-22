-- System notifications for admin and account users (visitors / insurance).
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_type VARCHAR(10) NOT NULL,   -- admin | user
  recipient_id INT NULL,                 -- user id (null for admin)
  type VARCHAR(30) NOT NULL,             -- request | case | message | status | visit
  title VARCHAR(190) NOT NULL,
  body VARCHAR(400) NULL,
  link VARCHAR(190) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (recipient_type, recipient_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
