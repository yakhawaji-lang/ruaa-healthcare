-- Each hero slide gets its own call-to-action, so a slide can send the visitor
-- to the page it is actually about (telemedicine, services, contact...).
ALTER TABLE hero_slides ADD COLUMN cta_label_ar VARCHAR(120) NULL;
ALTER TABLE hero_slides ADD COLUMN cta_label_en VARCHAR(120) NULL;
ALTER TABLE hero_slides ADD COLUMN cta_href VARCHAR(200) NULL;

-- Seed the redesigned slideshow. Each INSERT runs only if a slide with that
-- headline is not already there, so re-running the migration changes nothing
-- and any slide the admin edits later is left alone.
INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/home-visit.jpg',
       'الرعاية الطبية تصل إلى بابك',
       'Medical care that comes to your door',
       'فريق رؤى يزورك في منزلك بكامل التجهيزات: فحص ومتابعة وعلاج، دون عناء الانتقال أو الانتظار.',
       'RU-MD''s team visits you fully equipped — assessment, follow-up and treatment, without the trip or the waiting room.',
       'رعاية صحية منزلية مرخّصة', 'Licensed home healthcare',
       'اطلب زيارة منزلية', 'Request a home visit', '/services', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM hero_slides WHERE title_ar = 'الرعاية الطبية تصل إلى بابك');

INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/telemedicine.jpg',
       'استشارة طبية بالفيديو خلال دقائق',
       'A video consultation in minutes',
       'تحدّث مع ممارس معتمد من رؤى عبر مكالمة فيديو أو صوت آمنة، واختر الموعد الذي يناسبك من بوابتك مباشرة.',
       'Talk to an accredited RU-MD clinician over a secure video or voice call, at the time that suits you — straight from your portal.',
       'جديد · الطب الاتصالي', 'New · Telemedicine',
       'احجز استشارة الآن', 'Book a consultation', '/telemedicine', 1, 2
WHERE NOT EXISTS (SELECT 1 FROM hero_slides WHERE title_ar = 'استشارة طبية بالفيديو خلال دقائق');

INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/seniors.jpg',
       'متابعة دقيقة لكبار السن والحالات المزمنة',
       'Close follow-up for seniors and chronic conditions',
       'خطة رعاية فردية يتابعها الفريق خطوة بخطوة، مع تقارير دورية تطمئن الأسرة على حالة من تحب.',
       'An individual care plan the team follows step by step, with regular reports that keep the family reassured.',
       'رعاية ما بعد الخروج من المستشفى', 'Post-hospital care',
       'تعرّف على خدماتنا', 'Explore our services', '/services', 1, 3
WHERE NOT EXISTS (SELECT 1 FROM hero_slides WHERE title_ar = 'متابعة دقيقة لكبار السن والحالات المزمنة');

INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
SELECT '/img/slides/diagnosis.jpg',
       'تشخيص موثوق وخطة علاج واضحة',
       'A trusted diagnosis and a clear plan',
       'أطباء وأخصائيون معتمدون يراجعون حالتك وتقاريرك، ويضعون خطة علاج مفهومة تتابعها خطوة بخطوة.',
       'Accredited doctors and specialists review your case and reports, then set out a plan you can actually follow.',
       'فريق طبي معتمد', 'Accredited medical team',
       'تواصل معنا', 'Talk to us', '/contact', 1, 4
WHERE NOT EXISTS (SELECT 1 FROM hero_slides WHERE title_ar = 'تشخيص موثوق وخطة علاج واضحة');
