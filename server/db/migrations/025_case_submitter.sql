-- Who referred a case: the insurance account (or admin) that submitted it, an
-- optional coordinator the insurer names, and how it arrived (form / excel / admin).
ALTER TABLE insurance_cases
  ADD COLUMN submitted_by_user_id INT NULL AFTER user_id,
  ADD COLUMN submitted_by_name VARCHAR(190) NULL AFTER submitted_by_user_id,
  ADD COLUMN coordinator_name VARCHAR(190) NULL AFTER requested_service,
  ADD COLUMN coordinator_phone VARCHAR(60) NULL AFTER coordinator_name,
  ADD COLUMN source VARCHAR(20) NULL AFTER coordinator_phone;
