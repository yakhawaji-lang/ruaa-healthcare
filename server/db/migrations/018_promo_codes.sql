-- Promotional discount codes, active within a date range, for selected services.
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  discount_type ENUM('percent','amount') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  starts_at DATE NULL,
  ends_at DATE NULL,
  all_services TINYINT(1) NOT NULL DEFAULT 1,
  service_ids JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Record the promo applied to a service request.
ALTER TABLE service_requests ADD COLUMN promo_code VARCHAR(40) NULL;
ALTER TABLE service_requests ADD COLUMN discount DECIMAL(10,2) NULL;
