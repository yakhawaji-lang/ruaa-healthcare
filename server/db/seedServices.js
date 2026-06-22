// Replace ONLY the services catalog (keeps settings, pages, accounts, cases…).
// Clears insurer_services links too, since service IDs are recreated.
import dotenv from 'dotenv';
import { Services } from './queries.js';
import { closePool, query } from './pool.js';
import { SERVICES } from './seed/services.js';

dotenv.config();

async function run() {
  await query('DELETE FROM insurer_services').catch(() => {});
  await query('DELETE FROM services');
  for (let i = 0; i < SERVICES.length; i++) {
    const s = SERVICES[i];
    await Services.create({
      slug: s.slug,
      icon: s.icon,
      image: s.image || `/img/services/${s.slug}.jpg`,
      price: s.price ?? null,
      price_note_ar: 'تبدأ من', price_note_en: 'Starting from',
      title_ar: s.title_ar,
      title_en: s.title_en,
      body_ar: JSON.stringify(s.body_ar),
      body_en: JSON.stringify(s.body_en),
      is_published: 1,
      sort_order: i,
    });
  }
  console.log(`Services reseeded: ${SERVICES.length}`);
  await closePool();
}

run().catch((e) => { console.error('Services reseed failed:', e.message); process.exit(1); });
