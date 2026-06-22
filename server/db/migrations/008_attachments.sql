-- Generic file attachments linked to a case / request (e.g. medical reports).
CREATE TABLE IF NOT EXISTS attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref_type VARCHAR(20) NOT NULL,   -- insurance_case | service_request
  ref_id INT NOT NULL,
  url VARCHAR(300) NOT NULL,
  name VARCHAR(190) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (ref_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
