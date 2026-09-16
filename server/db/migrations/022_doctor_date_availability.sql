-- Date-specific availability for telemedicine providers: extra hours on given
-- calendar dates (in addition to the weekly rules), e.g. a one-off Saturday.
CREATE TABLE IF NOT EXISTS doctor_date_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_user_id INT NOT NULL,
  on_date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  INDEX (doctor_user_id, on_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
