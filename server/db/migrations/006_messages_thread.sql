-- Two-way correspondence thread between Ruaa admin and the account owner
-- (insurance company / visitor), attached to a service request or case.
CREATE TABLE IF NOT EXISTS messages_thread (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref_type VARCHAR(20) NOT NULL,        -- insurance_case | service_request
  ref_id INT NOT NULL,
  sender_role VARCHAR(10) NOT NULL,     -- admin | user
  sender_name VARCHAR(160) NULL,
  body TEXT NOT NULL,
  read_by_admin TINYINT(1) NOT NULL DEFAULT 0,
  read_by_user TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (ref_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
