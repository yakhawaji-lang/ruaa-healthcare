-- Services a specific insurance company is contracted/authorized to request.
-- If a company has no rows here, it may request any published service (back-compat).
CREATE TABLE IF NOT EXISTS insurer_services (
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
