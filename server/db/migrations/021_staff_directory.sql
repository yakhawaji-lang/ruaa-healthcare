-- Unified clinical staff directory ("الكادر الطبي").
-- One record per person. Optional links give that person access to:
--   * the control panel  (admin_id → admins)         — "مستخدم لوحة التحكم"
--   * the telemedicine portal (user_id → users.role='doctor' + doctors row)
-- Home-visit scheduling reads clinician names straight from this table, so the
-- old Settings → clinical_staff JSON list is imported here once and retired.
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(160) NOT NULL,
  name_en VARCHAR(160) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(60) NULL,
  photo VARCHAR(255) NULL,
  profession_ar VARCHAR(80) NULL,          -- primary profession (طبيب / ممرض/ة ...) from Settings → clinician_roles
  profession_en VARCHAR(80) NULL,
  roles_json TEXT NULL,                    -- JSON array of clinician_roles keys (ar) this person can cover for home visits
  title_ar VARCHAR(80) NULL,               -- استشاري / أخصائي (shown before the name)
  title_en VARCHAR(80) NULL,
  specialty_ar VARCHAR(160) NULL,          -- fine specialty (باطنية / جلدية / عناية جروح ...)
  specialty_en VARCHAR(160) NULL,
  bio_ar TEXT NULL,
  bio_en TEXT NULL,
  staff_type VARCHAR(10) NOT NULL DEFAULT 'staff',  -- staff | visiting (contracted / visiting clinician)
  organization VARCHAR(190) NULL,
  license_no VARCHAR(80) NULL,
  contract_start DATE NULL,
  contract_end DATE NULL,
  contract_notes TEXT NULL,
  home_visits TINYINT(1) NOT NULL DEFAULT 1,        -- appears in the home-visit clinician list
  admin_id INT NULL,                                -- control-panel account (admins.id)
  user_id INT NULL,                                 -- telemedicine account (users.id, role='doctor')
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_staff_user (user_id),
  INDEX (admin_id), INDEX (staff_type), INDEX (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
