-- Per-slide call to action, so a slide can link to the page it is about.
--
-- Written to run on both MySQL and MariaDB, and to be safe to re-run: every step
-- checks first. MySQL refuses "INSERT INTO t ... WHERE NOT EXISTS (SELECT ... FROM t)"
-- with error 1093, so each seed wraps that lookup in a derived table; and the
-- columns are added only when missing, in case an earlier run stopped half-way.

SET @db := DATABASE();

SET @e := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='hero_slides' AND COLUMN_NAME='cta_label_ar');
SET @s := IF(@e=0, 'ALTER TABLE hero_slides ADD COLUMN cta_label_ar VARCHAR(120) NULL', 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @e := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='hero_slides' AND COLUMN_NAME='cta_label_en');
SET @s := IF(@e=0, 'ALTER TABLE hero_slides ADD COLUMN cta_label_en VARCHAR(120) NULL', 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @e := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='hero_slides' AND COLUMN_NAME='cta_href');
SET @s := IF(@e=0, 'ALTER TABLE hero_slides ADD COLUMN cta_href VARCHAR(200) NULL', 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/home-visit.jpg',
       'الرعاية الطبية تصل إلى بابك',
       'Medical care that comes to your door',
       'فريق رؤى يزورك في منزلك بكامل التجهيزات: فحص ومتابعة وعلاج، دون عناء الانتقال أو الانتظار.',
       'RU-MD''s team visits you fully equipped — assessment, follow-up and treatment, without the trip or the waiting room.',
       'رعاية صحية منزلية مرخّصة', 'Licensed home healthcare',
       'اطلب زيارة منزلية', 'Request a home visit', '/services', 1, 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT id FROM hero_slides WHERE title_ar = 'الرعاية الطبية تصل إلى بابك') AS x);

INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/telemedicine.jpg',
       'استشارة طبية بالفيديو خلال دقائق',
       'A video consultation in minutes',
       'تحدّث مع ممارس معتمد من رؤى عبر مكالمة فيديو أو صوت آمنة، واختر الموعد الذي يناسبك من بوابتك مباشرة.',
       'Talk to an accredited RU-MD clinician over a secure video or voice call, at the time that suits you — straight from your portal.',
       'جديد · الطب الاتصالي', 'New · Telemedicine',
       'احجز استشارة الآن', 'Book a consultation', '/telemedicine', 1, 2
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT id FROM hero_slides WHERE title_ar = 'استشارة طبية بالفيديو خلال دقائق') AS x);

INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/seniors.jpg',
       'متابعة دقيقة لكبار السن والحالات المزمنة',
       'Close follow-up for seniors and chronic conditions',
       'خطة رعاية فردية يتابعها الفريق خطوة بخطوة، مع تقارير دورية تطمئن الأسرة على حالة من تحب.',
       'An individual care plan the team follows step by step, with regular reports that keep the family reassured.',
       'رعاية ما بعد الخروج من المستشفى', 'Post-hospital care',
       'تعرّف على خدماتنا', 'Explore our services', '/services', 1, 3
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT id FROM hero_slides WHERE title_ar = 'متابعة دقيقة لكبار السن والحالات المزمنة') AS x);

INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/diagnosis.jpg',
       'تشخيص موثوق وخطة علاج واضحة',
       'A trusted diagnosis and a clear plan',
       'أطباء وأخصائيون معتمدون يراجعون حالتك وتقاريرك، ويضعون خطة علاج مفهومة تتابعها خطوة بخطوة.',
       'Accredited doctors and specialists review your case and reports, then set out a plan you can actually follow.',
       'فريق طبي معتمد', 'Accredited medical team',
       'تواصل معنا', 'Talk to us', '/contact', 1, 4
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT id FROM hero_slides WHERE title_ar = 'تشخيص موثوق وخطة علاج واضحة') AS x);
