-- Telemedicine providers: any clinician (doctor, nurse, physiotherapist ...) can be
-- granted access, and providers may be in-house staff or visiting / contracted.
ALTER TABLE doctors ADD COLUMN profession_ar VARCHAR(80) NULL AFTER user_id;       -- طبيب / ممرض/ة / أخصائي علاج طبيعي (from Settings → clinician_roles)
ALTER TABLE doctors ADD COLUMN profession_en VARCHAR(80) NULL AFTER profession_ar;
ALTER TABLE doctors ADD COLUMN provider_type VARCHAR(10) NOT NULL DEFAULT 'staff' AFTER profession_en; -- staff | visiting
ALTER TABLE doctors ADD COLUMN staff_ref VARCHAR(190) NULL AFTER provider_type;    -- linked name from Settings → clinical_staff (optional)
ALTER TABLE doctors ADD COLUMN organization VARCHAR(190) NULL;                     -- visiting: hospital / clinic / company
ALTER TABLE doctors ADD COLUMN license_no VARCHAR(80) NULL;                        -- visiting: professional license (SCFHS) number
ALTER TABLE doctors ADD COLUMN contract_start DATE NULL;
ALTER TABLE doctors ADD COLUMN contract_end DATE NULL;
ALTER TABLE doctors ADD COLUMN contract_notes TEXT NULL;
