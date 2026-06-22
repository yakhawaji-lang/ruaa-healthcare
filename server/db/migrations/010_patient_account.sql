-- Link an insurance case to the patient login account that is auto-created
-- when Ruaa approves the case (username = patient mobile, password = national ID).
ALTER TABLE insurance_cases
  ADD COLUMN IF NOT EXISTS patient_user_id INT NULL AFTER user_id;
