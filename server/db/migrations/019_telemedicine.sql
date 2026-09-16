-- Telemedicine (الاستشارات الطبية عن بُعد): doctor accounts, weekly availability,
-- and video / voice consultations held in an embedded Jitsi room.
-- Doctors are `users` rows with role = 'doctor' (they log in through /login like
-- patients and insurers) plus a profile row here.

CREATE TABLE IF NOT EXISTS doctors (
  user_id INT PRIMARY KEY,
  title_ar VARCHAR(80) NULL,              -- استشاري / أخصائي / طبيب عام
  title_en VARCHAR(80) NULL,
  specialty_ar VARCHAR(160) NULL,
  specialty_en VARCHAR(160) NULL,
  bio_ar TEXT NULL,
  bio_en TEXT NULL,
  photo VARCHAR(255) NULL,
  slot_minutes INT NOT NULL DEFAULT 20,   -- consultation length used to cut the day into slots
  is_published TINYINT(1) NOT NULL DEFAULT 1,  -- visible to patients for self-booking
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly recurring availability rules (0 = Sunday ... 6 = Saturday), local time.
CREATE TABLE IF NOT EXISTS doctor_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_user_id INT NOT NULL,
  weekday TINYINT NOT NULL,
  start_time VARCHAR(5) NOT NULL,         -- 'HH:MM'
  end_time VARCHAR(5) NOT NULL,           -- 'HH:MM'
  INDEX (doctor_user_id, weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Specific days a doctor is unavailable (holidays / leave).
CREATE TABLE IF NOT EXISTS doctor_days_off (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_user_id INT NOT NULL,
  off_date DATE NOT NULL,
  note VARCHAR(160) NULL,
  UNIQUE KEY uq_doc_day (doctor_user_id, off_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consultations (video or voice). scheduled_at is stored as local wall-clock
-- time (Asia/Riyadh) and compared as text on the server to stay timezone-safe.
CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(20) NOT NULL UNIQUE,        -- public tracking code e.g. TM-2026-00012
  user_id INT NOT NULL,                   -- the patient account
  doctor_user_id INT NULL,                -- assigned doctor (users.id, role=doctor)
  mode VARCHAR(10) NOT NULL DEFAULT 'video',   -- video | audio
  source VARCHAR(10) NOT NULL DEFAULT 'self',  -- self | admin
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | scheduled | in_progress | completed | cancelled | no_show
  scheduled_at DATETIME NULL,
  duration_min INT NOT NULL DEFAULT 20,
  patient_name VARCHAR(190) NULL,
  phone VARCHAR(60) NULL,
  complaint TEXT NULL,                    -- reason for the consultation (patient's words)
  preferred_note VARCHAR(255) NULL,       -- free-text preferred time when no slot was chosen
  price DECIMAL(10,2) NULL,
  room VARCHAR(80) NULL,                  -- Jitsi room name (unguessable)
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  doctor_notes TEXT NULL,                 -- clinical summary written by the doctor
  diagnosis VARCHAR(255) NULL,
  prescription TEXT NULL,
  follow_up VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX (user_id), INDEX (doctor_user_id, scheduled_at), INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site settings used by the feature (editable from the admin Settings page).
INSERT IGNORE INTO settings (`key`, value_ar, value_en) VALUES
  ('telemed_enabled', '1', '1'),
  ('telemed_price', '', ''),
  ('telemed_slot_minutes', '20', '20'),
  ('jitsi_domain', 'meet.jit.si', 'meet.jit.si');
