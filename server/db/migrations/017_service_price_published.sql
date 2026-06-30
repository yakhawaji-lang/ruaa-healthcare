-- Per-service control of whether the price is shown publicly (site + client portal).
ALTER TABLE services ADD COLUMN price_published TINYINT(1) NOT NULL DEFAULT 1 AFTER price;
