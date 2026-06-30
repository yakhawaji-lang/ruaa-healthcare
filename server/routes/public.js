// Public (unauthenticated) read endpoints consumed by the website front-end.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Settings, Pages, Services, Messages, HeroSlides, Partners } from '../db/queries.js';

const router = Router();

const parseJSON = (v, fallback) => {
  try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

// Aggregate bootstrap payload: settings + nav pages + services list.
router.get('/bootstrap', async (req, res) => {
  const [settings, pages, services, heroSlides, partners] = await Promise.all([
    Settings.asObject(),
    Pages.listPublic(),
    Services.listPublic(),
    HeroSlides.listPublic(),
    Partners.listPublic(),
  ]);
  // operational/admin-only lists must not leak to the public site
  for (const k of ['visit_types', 'clinician_roles', 'clinical_staff']) delete settings[k];
  res.json({
    settings,
    pages: pages.map((p) => ({ slug: p.slug, title_ar: p.title_ar, title_en: p.title_en })),
    services: services.map((s) => ({
      slug: s.slug, icon: s.icon, image: s.image, title_ar: s.title_ar, title_en: s.title_en,
      price: s.price, price_note_ar: s.price_note_ar, price_note_en: s.price_note_en,
      body_ar: parseJSON(s.body_ar, []), body_en: parseJSON(s.body_en, []),
    })),
    heroSlides,
    partners,
  });
});

router.get('/pages/:slug', async (req, res) => {
  const page = await Pages.bySlug(req.params.slug);
  if (!page || !page.is_published) return res.status(404).json({ error: 'not_found' });
  res.json({
    slug: page.slug, title_ar: page.title_ar, title_en: page.title_en,
    content: parseJSON(page.content_json, {}),
  });
});

router.get('/services/:slug', async (req, res) => {
  const s = await Services.bySlug(req.params.slug);
  if (!s || !s.is_published) return res.status(404).json({ error: 'not_found' });
  res.json({
    slug: s.slug, icon: s.icon, image: s.image, title_ar: s.title_ar, title_en: s.title_en,
    price: s.price_published ? s.price : null, price_note_ar: s.price_note_ar, price_note_en: s.price_note_en,
    body_ar: parseJSON(s.body_ar, []), body_en: parseJSON(s.body_en, []),
  });
});

// Public message submission (contact / appointment / inquiry forms).
const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30 });
router.post('/messages', submitLimiter, async (req, res) => {
  const { name, phone, email, service, body, kind, lang } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'name_required' });
  if (!phone && !email) return res.status(400).json({ error: 'contact_required' });
  await Messages.create({ name, phone, email, service, body, kind, lang });
  res.status(201).json({ ok: true });
});

export default router;
