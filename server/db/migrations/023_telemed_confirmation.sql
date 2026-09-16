-- Self-booked (and non-privileged admin) consultations wait for confirmation by an
-- admin holding the "telemed → confirm" permission before they count as scheduled.
-- New consultations.status value: 'unconfirmed' (between pending and scheduled).
INSERT IGNORE INTO settings (`key`, value_ar, value_en) VALUES ('telemed_require_confirm', '1', '1');
