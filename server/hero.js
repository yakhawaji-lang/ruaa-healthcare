// Hero-slide schema + seed, done in JS rather than in a .sql migration.
//
// The SQL version of this kept failing on the production MySQL while passing on
// the local MariaDB, and a multi-statement file gives no way to tell which step
// broke. Here every step runs on its own, says what it did, and a failure in one
// never blocks the others — the site keeps working with whatever is in place.
import { query } from './db/pool.js';

const CTA_COLUMNS = [
  ['cta_label_ar', 'VARCHAR(120) NULL'],
  ['cta_label_en', 'VARCHAR(120) NULL'],
  ['cta_href', 'VARCHAR(200) NULL'],
];

export async function heroColumns() {
  const rows = await query(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hero_slides'`
  );
  return new Set(rows.map((r) => r.c || r.COLUMN_NAME));
}

const SEED = [
  {
    image: '/img/slides/home-visit.jpg',
    title_ar: 'الرعاية الطبية تصل إلى بابك',
    title_en: 'Medical care that comes to your door',
    subtitle_ar: 'فريق رؤى يزورك في منزلك بكامل التجهيزات: فحص ومتابعة وعلاج، دون عناء الانتقال أو الانتظار.',
    subtitle_en: "RU-MD's team visits you fully equipped — assessment, follow-up and treatment, without the trip or the waiting room.",
    badge_ar: 'رعاية صحية منزلية مرخّصة', badge_en: 'Licensed home healthcare',
    cta_label_ar: 'اطلب زيارة منزلية', cta_label_en: 'Request a home visit', cta_href: '/services', sort_order: 1,
  },
  {
    image: '/img/slides/telemedicine.jpg',
    title_ar: 'استشارة طبية بالفيديو خلال دقائق',
    title_en: 'A video consultation in minutes',
    subtitle_ar: 'تحدّث مع ممارس معتمد من رؤى عبر مكالمة فيديو أو صوت آمنة، واختر الموعد الذي يناسبك من بوابتك مباشرة.',
    subtitle_en: 'Talk to an accredited RU-MD clinician over a secure video or voice call, at the time that suits you — straight from your portal.',
    badge_ar: 'جديد · الطب الاتصالي', badge_en: 'New · Telemedicine',
    cta_label_ar: 'احجز استشارة الآن', cta_label_en: 'Book a consultation', cta_href: '/telemedicine', sort_order: 2,
  },
  {
    image: '/img/slides/seniors.jpg',
    title_ar: 'متابعة دقيقة لكبار السن والحالات المزمنة',
    title_en: 'Close follow-up for seniors and chronic conditions',
    subtitle_ar: 'خطة رعاية فردية يتابعها الفريق خطوة بخطوة، مع تقارير دورية تطمئن الأسرة على حالة من تحب.',
    subtitle_en: 'An individual care plan the team follows step by step, with regular reports that keep the family reassured.',
    badge_ar: 'رعاية ما بعد الخروج من المستشفى', badge_en: 'Post-hospital care',
    cta_label_ar: 'تعرّف على خدماتنا', cta_label_en: 'Explore our services', cta_href: '/services', sort_order: 3,
  },
  {
    image: '/img/slides/diagnosis.jpg',
    title_ar: 'تشخيص موثوق وخطة علاج واضحة',
    title_en: 'A trusted diagnosis and a clear plan',
    subtitle_ar: 'أطباء وأخصائيون معتمدون يراجعون حالتك وتقاريرك، ويضعون خطة علاج مفهومة تتابعها خطوة بخطوة.',
    subtitle_en: 'Accredited doctors and specialists review your case and reports, then set out a plan you can actually follow.',
    badge_ar: 'فريق طبي معتمد', badge_en: 'Accredited medical team',
    cta_label_ar: 'تواصل معنا', cta_label_en: 'Talk to us', cta_href: '/contact', sort_order: 4,
  },
];

// Adds the per-slide CTA columns when missing, then seeds the redesigned slides
// once. Returns the column set so the query layer knows what it may select.
export async function ensureHeroSlides() {
  let cols;
  try {
    cols = await heroColumns();
  } catch (e) {
    console.warn('[hero] column check skipped:', e.message);
    return new Set();
  }
  if (!cols.size) return cols;                       // table not migrated yet

  for (const [name, type] of CTA_COLUMNS) {
    if (cols.has(name)) continue;
    try {
      await query(`ALTER TABLE hero_slides ADD COLUMN ${name} ${type}`);
      cols.add(name);
      console.log(`[hero] added column ${name}`);
    } catch (e) {
      // duplicate column = someone else added it; anything else is worth seeing
      if (/duplicate column/i.test(e.message)) cols.add(name);
      else console.error(`[hero] could not add ${name}:`, e.message);
    }
  }

  const hasCta = CTA_COLUMNS.every(([n]) => cols.has(n));
  if (!hasCta) return cols;

  for (const s of SEED) {
    try {
      const [dup] = await query('SELECT id FROM hero_slides WHERE title_ar = ? LIMIT 1', [s.title_ar]);
      if (dup) continue;
      await query(
        `INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en,
           cta_label_ar, cta_label_en, cta_href, is_published, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,1,?)`,
        [s.image, s.title_ar, s.title_en, s.subtitle_ar, s.subtitle_en, s.badge_ar, s.badge_en,
          s.cta_label_ar, s.cta_label_en, s.cta_href, s.sort_order]
      );
      console.log(`[hero] seeded slide: ${s.title_ar}`);
    } catch (e) {
      console.error('[hero] seed failed:', e.message);
    }
  }
  return cols;
}
