-- Hero slideshow: multiple slides, each with an image + bilingual promo text.
CREATE TABLE IF NOT EXISTS hero_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image VARCHAR(300),
  title_ar VARCHAR(255), title_en VARCHAR(255),
  subtitle_ar VARCHAR(600), subtitle_en VARCHAR(600),
  badge_ar VARCHAR(255), badge_en VARCHAR(255),
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
