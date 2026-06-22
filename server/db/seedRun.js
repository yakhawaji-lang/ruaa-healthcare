// Seeds the database from seed/content.json (extracted from the original
// WordPress site) and creates the default admin account.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Settings, Pages, Services, Admins, HeroSlides, Partners, Users } from './queries.js';
import { closePool, query } from './pool.js';
import { SERVICES } from './seed/services.js';

// Indicative starting prices (SAR) per service — fully editable from the admin.
const PRICES = {
  'medical-supervision': 300, 'healing-care': 350, 'diagnostic-laboratory-tests': 200,
  'chronic-disease-care': 400, 'medication-management': 150, 'nutritional-care': 250,
  'pain-treatment': 350, 'palliative-care': 500, 'patient-and-family-education': 150,
  'physical-and-occupational-therapy-and-rehabilitation': 300, 'integrated-nursing-services': 250,
  'wound-burn-and-bed-ulcer-care': 300, 'immunization-and-basic-vaccinations': 200, 'respiratory-care': 350,
};

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'content.json'), 'utf8'));

async function seed() {
  // ---- Settings ----
  const s = content.settings;
  const settingRows = [
    ['name', s.name_ar, s.name_en],
    ['tagline', s.tagline_ar, s.tagline_en],
    ['address', s.address_ar, s.address_en],
    ['hours', s.hours_ar, s.hours_en],
    ['phone', s.phone, s.phone],
    ['phone_intl', s.phone_intl, s.phone_intl],
    ['whatsapp', s.whatsapp, s.whatsapp],
    ['email', s.email, s.email],
    ['instagram', s.instagram, s.instagram],
    ['twitter', s.twitter, s.twitter],
    ['founded', s.founded, s.founded],
    // editable banner images
    ['hero_image', '/img/hero.jpg', '/img/hero.jpg'],
    ['about_image', '/img/about.jpg', '/img/about.jpg'],
    ['cta_image', '/img/cta.jpg', '/img/cta.jpg'],
  ];
  for (const [k, ar, en] of settingRows) await Settings.upsert(k, ar, en);
  console.log(`+ settings: ${settingRows.length}`);

  // ---- Pages (home, about stored as structured JSON blocks) ----
  await Pages.upsertBySlug('home', 'الرئيسية', 'Home', JSON.stringify(content.home), 0);
  await Pages.upsertBySlug('about', 'من نحن', 'About Us', JSON.stringify(content.about), 1);
  await Pages.upsertBySlug('services', 'خدماتنا', 'Services', JSON.stringify({}), 2);
  await Pages.upsertBySlug('contact', 'تواصل معنا', 'Contact Us', JSON.stringify({}), 3);
  console.log('+ pages: 4');

  // ---- Services ----
  // content.json is the source of truth for the seed: clear and re-insert so
  // slug changes don't leave stale rows behind.
  await query('DELETE FROM services');
  let count = 0;
  for (let i = 0; i < SERVICES.length; i++) {
    const svc = SERVICES[i];
    await Services.create({
      slug: svc.slug,
      icon: svc.icon,
      image: svc.image || `/img/services/${svc.slug}.jpg`,
      price: svc.price ?? PRICES[svc.slug] ?? null,
      price_note_ar: 'تبدأ من', price_note_en: 'Starting from',
      title_ar: svc.title_ar,
      title_en: svc.title_en,
      body_ar: JSON.stringify(svc.body_ar),
      body_en: JSON.stringify(svc.body_en),
      is_published: 1,
      sort_order: svc.sort_order ?? i,
    });
    count++;
  }
  console.log(`+ services: ${count}`);

  // ---- Hero slides (only if none exist, so admin edits aren't wiped) ----
  if ((await HeroSlides.count()) === 0) {
    const slides = [
      {
        image: '/img/hero.jpg',
        title_ar: 'خدمات مرنة تناسب احتياجك الصحي', title_en: 'Flexible services to suit your health needs',
        subtitle_ar: 'رتبنا لك كل تفاصيل رعايتك الصحية، راحة البال جايتك للبيت', subtitle_en: 'We prepared every detail of your care — peace of mind, delivered home.',
        badge_ar: 'مقدم الرعاية الطبية المنزلية الأول بالمنطقة الشرقية', badge_en: 'The first home health care provider in the Eastern Province',
      },
      {
        image: '/img/services/integrated-nursing-services.jpg',
        title_ar: 'رعاية طبية متكاملة في منزلك', title_en: 'Comprehensive medical care at home',
        subtitle_ar: 'فريق طبي معتمد من أطباء وممرضين وأخصائيين على أعلى مستوى من التدريب', subtitle_en: 'An accredited team of doctors, nurses and specialists at the highest level.',
        badge_ar: 'خدمة موثوقة على مدار الأسبوع', badge_en: 'Trusted care all week long',
      },
      {
        image: '/img/services/medical-supervision.jpg',
        title_ar: 'صحتك تبدأ من بيتك', title_en: 'Your health starts at home',
        subtitle_ar: 'خطط رعاية فردية مصمّمة خصيصًا لحالتك ومتابعة دقيقة من المختصين', subtitle_en: 'Individual care plans tailored to your condition, with close specialist follow-up.',
        badge_ar: 'رعاية صحية منزلية متكاملة', badge_en: 'Integrated home healthcare',
      },
    ];
    let i = 0;
    for (const sl of slides) { await HeroSlides.create({ ...sl, is_published: 1, sort_order: i++ }); }
    console.log(`+ hero slides: ${slides.length}`);
  } else {
    console.log('= hero slides exist (kept)');
  }

  // ---- Partners: auto-import any logo files dropped into uploads/partners ----
  const partnersDir = path.join(__dirname, '..', 'uploads', 'partners');
  if (fs.existsSync(partnersDir)) {
    const existing = await Partners.listAdmin();
    const have = new Set(existing.map((p) => p.logo));
    const files = fs.readdirSync(partnersDir).filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f)).sort();
    let added = 0;
    for (const f of files) {
      const logo = `/uploads/partners/${f}`;
      if (have.has(logo)) continue;
      await Partners.create({ logo, is_published: 1, sort_order: existing.length + added });
      added++;
    }
    console.log(`+ partners imported: ${added} new (${files.length} files present)`);
  } else {
    console.log('= no partners folder yet');
  }

  // ---- Default admin ----
  const email = process.env.ADMIN_EMAIL || 'admin@rumd.me';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const existing = await Admins.byEmail(email);
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await Admins.create('مدير الموقع', email, hash, 'admin');
    console.log(`+ admin created: ${email} / ${password}`);
  } else {
    console.log(`= admin exists: ${email}`);
  }

  // ---- Demo insurance company account (for testing the insurance portal) ----
  const demoEmail = 'insurer@demo.com';
  if (!(await Users.byEmail(demoEmail))) {
    const hash = await bcrypt.hash('Insurer@12345', 10);
    await Users.create({ role: 'insurance', name: 'شركة تأمين تجريبية', company_name: 'Demo Insurance Co.', email: demoEmail, phone: '' }, hash);
    console.log(`+ demo insurer: ${demoEmail} / Insurer@12345`);
  }

  await closePool();
  console.log('Seed complete.');
}

seed().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
