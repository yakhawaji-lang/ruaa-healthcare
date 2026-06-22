-- Accounts (visitors + insurance companies), service requests, insurance cases,
-- and a shared tracking-events timeline. Also adds price to services.

ALTER TABLE services ADD COLUMN price DECIMAL(10,2) NULL AFTER image;
ALTER TABLE services ADD COLUMN price_note_ar VARCHAR(120) NULL AFTER price;
ALTER TABLE services ADD COLUMN price_note_en VARCHAR(120) NULL AFTER price_note_ar;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(20) NOT NULL DEFAULT 'visitor',     -- visitor | insurance
  name VARCHAR(160) NOT NULL,
  company_name VARCHAR(190) NULL,                  -- for insurance accounts
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(60) NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visitor service requests
CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(20) NOT NULL UNIQUE,                 -- public tracking code e.g. RU-2024-000123
  user_id INT NOT NULL,
  service_id INT NULL,
  service_title VARCHAR(255) NULL,                 -- snapshot of title at request time
  price DECIMAL(10,2) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  patient_name VARCHAR(190) NULL,
  phone VARCHAR(60) NULL,
  city VARCHAR(120) NULL,
  preferred_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX (user_id), INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insurance company patient cases
CREATE TABLE IF NOT EXISTS insurance_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NOT NULL,                            -- the insurance company account
  hospital_name VARCHAR(190) NULL,
  patient_name VARCHAR(190) NOT NULL,
  national_id VARCHAR(40) NULL,
  mobile VARCHAR(60) NULL,
  city VARCHAR(120) NULL,
  dob VARCHAR(20) NULL,
  diagnosis TEXT NULL,
  requested_service VARCHAR(190) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX (user_id), INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shared timeline of events for both request types (professional tracking)
CREATE TABLE IF NOT EXISTS request_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref_type VARCHAR(20) NOT NULL,                   -- service_request | insurance_case
  ref_id INT NOT NULL,
  status VARCHAR(30) NULL,
  title_ar VARCHAR(190) NULL,
  note TEXT NULL,
  actor VARCHAR(60) NULL,                          -- العميل | الإدارة | النظام
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (ref_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
