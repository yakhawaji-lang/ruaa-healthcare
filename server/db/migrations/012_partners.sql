-- Partners / insurance companies whose logos appear on the homepage ("شركاؤنا").
CREATE TABLE IF NOT EXISTS partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(190) NULL,
  name_en VARCHAR(190) NULL,
  logo VARCHAR(300) NOT NULL,
  url VARCHAR(300) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
