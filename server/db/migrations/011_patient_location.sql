-- Patient location (typed address already exists; add map coordinates).
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7) NULL;
