-- Patient program: medical profile (file) + scheduled home visits linked to
-- service requests / insurance cases, with assigned clinician.

CREATE TABLE IF NOT EXISTS patient_profiles (
  user_id INT PRIMARY KEY,
  gender VARCHAR(10) NULL,
  dob VARCHAR(20) NULL,
  blood_type VARCHAR(8) NULL,
  address VARCHAR(255) NULL,
  chronic_conditions TEXT NULL,
  allergies TEXT NULL,
  medications TEXT NULL,
  emergency_name VARCHAR(120) NULL,
  emergency_phone VARCHAR(60) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,                       -- the account that sees this visit (patient / insurer)
  ref_type VARCHAR(20) NOT NULL,          -- service_request | insurance_case
  ref_id INT NOT NULL,
  visit_date DATE NULL,
  visit_time VARCHAR(10) NULL,
  clinician_name VARCHAR(120) NULL,
  clinician_role VARCHAR(80) NULL,        -- طبيب / ممرض / أخصائي علاج طبيعي ...
  visit_type VARCHAR(80) NULL,            -- زيارة منزلية / تقييم / متابعة
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',  -- scheduled | completed | cancelled
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id), INDEX (ref_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
