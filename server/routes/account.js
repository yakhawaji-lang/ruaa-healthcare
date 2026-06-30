// Account portal: registration (visitors), unified login, and the two
// portals — visitor service requests and insurance patient cases.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query } from '../db/pool.js';
import { Users, Services, ServiceRequests, InsuranceCases, RequestEvents, Patients, Visits, Threads, Attachments, Notifications, InsurerServices, PromoCodes } from '../db/queries.js';
import { signUserToken, requireUser, requireRole } from '../auth.js';
import { saveDataUrl } from '../upload.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
const refCode = (prefix, id) => `${prefix}-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;

// Insurance sub-users (members) share their parent company's cases & services.
// Resolve the "company root" id for the current request (self if no parent).
async function companyId(req) {
  if (req._cid != null) return req._cid;
  const u = await Users.byId(req.user.uid);
  req._cid = (u && u.parent_user_id) || req.user.uid;
  return req._cid;
}

// Validate a promo code (active, within date range, applies to the service).
const parseJSONsafe = (v, fb) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
async function checkPromo(code, serviceTitle) {
  const p = await PromoCodes.byCode(code);
  if (!p || !p.is_active) return { valid: false, error: 'invalid' };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (p.starts_at && new Date(p.starts_at) > today) return { valid: false, error: 'not_started' };
  if (p.ends_at) { const end = new Date(p.ends_at); end.setHours(23, 59, 59, 999); if (end < today) return { valid: false, error: 'expired' }; }
  if (!p.all_services) {
    const ids = (parseJSONsafe(p.service_ids, []) || []).map(Number);
    const all = await Services.listPublicIds();
    const titles = all.filter((s) => ids.includes(Number(s.id))).flatMap((s) => [s.title_ar, s.title_en]).filter(Boolean);
    const ok = serviceTitle && titles.some((t) => String(serviceTitle).includes(t));
    if (!ok) return { valid: false, error: 'not_applicable' };
  }
  return { valid: true, code: p.code, discount_type: p.discount_type, discount_value: Number(p.discount_value) };
}

router.post('/promo/validate', requireUser, async (req, res) => {
  const { code, service_title } = req.body || {};
  if (!code) return res.status(400).json({ valid: false, error: 'code_required' });
  res.json(await checkPromo(code, service_title));
});

/* ---------------- Auth ---------------- */
// Registration is for visitors only (insurance accounts are created by admin).
router.post('/register', limiter, async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'missing_fields' });
  if (String(password).length < 6) return res.status(400).json({ error: 'weak_password' });
  const exists = await Users.byEmail(String(email).toLowerCase().trim());
  if (exists) return res.status(409).json({ error: 'email_taken' });
  const hash = await bcrypt.hash(password, 10);
  const r = await Users.create({ role: 'visitor', name, email: String(email).toLowerCase().trim(), phone }, hash);
  const user = await Users.byId(r.insertId);
  res.status(201).json({ token: signUserToken(user), user });
});

// Unified login for visitors, patients and insurance companies.
// The identifier may be an email OR a mobile number (patients log in with their mobile).
router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body || {};
  const id = String(email || '').toLowerCase().trim();
  if (!id || !password) return res.status(400).json({ error: 'missing_credentials' });
  const u = (await Users.byEmail(id)) || (await Users.byPhone(id.replace(/\s+/g, '')));
  if (!u || !u.is_active) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
  const user = { id: u.id, role: u.role, name: u.name, company_name: u.company_name, email: u.email, phone: u.phone };
  res.json({ token: signUserToken(u), user });
});

router.get('/me', requireUser, async (req, res) => {
  const user = await Users.byId(req.user.uid);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user });
});

// Self-service account editing: name, email, phone, and optional password change.
router.put('/me', requireUser, async (req, res) => {
  const b = req.body || {};
  const u = await Users.byId(req.user.uid);
  if (!u) return res.status(404).json({ error: 'not_found' });
  if (b.password != null && b.password !== '' && String(b.password).length < 6) {
    return res.status(400).json({ error: 'weak_password' });
  }
  const name = (b.name || '').trim() || u.name;
  const phone = (b.phone || '').trim() || null;
  let email = (b.email || '').toLowerCase().trim() || u.email;
  if (email !== u.email) {
    const exists = await Users.byEmail(email);
    if (exists && exists.id !== u.id) return res.status(409).json({ error: 'email_taken' });
  }
  await Users.updateAccount(u.id, { name, email, phone });
  if (b.password) await Users.updatePassword(u.id, await bcrypt.hash(String(b.password), 10));
  const user = await Users.byId(u.id);
  res.json({ user });
});

/* ---------------- Patient medical profile ---------------- */
router.get('/profile', requireUser, requireRole('visitor'), async (req, res) => {
  res.json(await Patients.get(req.user.uid) || {});
});
router.put('/profile', requireUser, requireRole('visitor'), async (req, res) => {
  await Patients.upsert(req.user.uid, req.body || {});
  res.json({ ok: true });
});

/* ---------------- My visits ---------------- */
router.get('/visits', requireUser, async (req, res) => {
  res.json(await Visits.byUser(req.user.uid));
});
// All visits across the insurance company's own cases (for their portal calendar)
router.get('/case-visits', requireUser, requireRole('insurance'), async (req, res) => {
  res.json(await Visits.byInsurer(await companyId(req)));
});

/* ---------------- Aggregated correspondence feed (read-only) ---------------- */
router.get('/messages', requireUser, async (req, res) => {
  const feed = req.user.role === 'insurance'
    ? await Threads.feedForCases(await companyId(req))
    : await Threads.feedForRequests(req.user.uid);
  res.json(feed);
});

/* ---------------- File upload (attachments) ---------------- */
router.post('/upload', requireUser, (req, res) => {
  try {
    const out = saveDataUrl(req.body?.data, req.body?.filename);
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.code || 'upload_failed' });
  }
});

/* ---------------- Visitor: service requests ---------------- */
router.post('/requests', requireUser, requireRole('visitor'), async (req, res) => {
  const b = req.body || {};
  const svc = b.service_id ? await Services.byId(b.service_id) : null;
  let promo = null;
  if (b.promo_code) { const v = await checkPromo(b.promo_code, svc?.title_ar || b.service_title); if (v.valid) promo = v; }
  const r = await ServiceRequests.create({
    ref: 'TMP-' + Date.now() + Math.floor(Math.random() * 1000),
    user_id: req.user.uid,
    service_id: svc?.id || null,
    service_title: svc?.title_ar || b.service_title || null,
    price: svc?.price ?? null,
    status: 'pending',
    promo_code: promo?.code || null,
    discount: promo?.discount_value ?? null,
    patient_name: b.patient_name, phone: b.phone, city: b.city,
    preferred_date: b.preferred_date || null, notes: b.notes,
  });
  const ref = refCode('RU', r.insertId);
  await query('UPDATE service_requests SET ref=? WHERE id=?', [ref, r.insertId]);
  await RequestEvents.add({ ref_type: 'service_request', ref_id: r.insertId, status: 'pending', title_ar: 'تم استلام الطلب', note: 'تم استلام طلبك بنجاح وسيُراجَع من قبل فريق رؤى.', actor: 'النظام' });
  await Notifications.notifyAdmin('request', 'طلب خدمة جديد', `${svc?.title_ar || b.service_title || 'خدمة'} — ${b.patient_name || ''}`, `/admin/requests?open=${r.insertId}`);
  res.status(201).json({ id: r.insertId, ref });
});

router.get('/requests', requireUser, requireRole('visitor'), async (req, res) => {
  res.json(await ServiceRequests.listByUser(req.user.uid));
});

router.get('/requests/:id', requireUser, requireRole('visitor'), async (req, res) => {
  const r = await ServiceRequests.byIdForUser(req.params.id, req.user.uid);
  if (!r) return res.status(404).json({ error: 'not_found' });
  const [events, visits, messages] = await Promise.all([
    RequestEvents.list('service_request', r.id),
    Visits.byRef('service_request', r.id),
    Threads.list('service_request', r.id),
  ]);
  await Threads.markReadByUser('service_request', r.id);
  res.json({ ...r, events, visits, messages });
});

router.post('/requests/:id/messages', requireUser, requireRole('visitor'), async (req, res) => {
  const r = await ServiceRequests.byIdForUser(req.params.id, req.user.uid);
  if (!r) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  if (!b.body?.trim() && !b.attachment_url) return res.status(400).json({ error: 'empty' });
  const u = await Users.byId(req.user.uid);
  await Threads.add({ ref_type: 'service_request', ref_id: r.id, sender_role: 'user', sender_name: u?.name, body: b.body?.trim(), attachment_url: b.attachment_url, attachment_name: b.attachment_name });
  await Notifications.notifyAdmin('message', 'رسالة جديدة من عميل', `${u?.name || ''}: ${(b.body || 'مرفق').slice(0, 60)}`, `/admin/requests?open=${r.id}`);
  res.status(201).json({ ok: true });
});

/* ---------------- Insurance: patient cases ---------------- */
router.post('/cases', requireUser, requireRole('insurance'), async (req, res) => {
  const b = req.body || {};
  if (!b.patient_name) return res.status(400).json({ error: 'patient_name_required' });
  const r = await InsuranceCases.create({
    ref: 'TMP-' + Date.now() + Math.floor(Math.random() * 1000),
    user_id: await companyId(req),
    hospital_name: b.hospital_name, patient_name: b.patient_name, national_id: b.national_id,
    mobile: b.mobile, city: b.city, dob: b.dob, diagnosis: b.diagnosis,
    requested_service: b.requested_service, status: 'submitted',
  });
  const ref = refCode('INS', r.insertId);
  await query('UPDATE insurance_cases SET ref=? WHERE id=?', [ref, r.insertId]);
  if (Array.isArray(b.attachments) && b.attachments.length) await Attachments.addMany('insurance_case', r.insertId, b.attachments);
  await RequestEvents.add({ ref_type: 'insurance_case', ref_id: r.insertId, status: 'submitted', title_ar: 'تم استلام الحالة', note: `تم استلام بيانات المريض${Array.isArray(b.attachments) && b.attachments.length ? ' مع ' + b.attachments.length + ' مرفق' : ''} وستُحوَّل للمراجعة الطبية.`, actor: 'النظام' });
  await Notifications.notifyAdmin('case', 'حالة تأمين جديدة', `${b.patient_name} — ${b.requested_service || ''}`, `/admin/cases?open=${r.insertId}`);
  res.status(201).json({ id: r.insertId, ref });
});

router.get('/cases', requireUser, requireRole('insurance'), async (req, res) => {
  res.json(await InsuranceCases.listByUser(await companyId(req)));
});

// Services this insurance company is allowed to request (contracted).
// If none configured by admin, all published services are returned (back-compat).
router.get('/my-services', requireUser, requireRole('insurance'), async (req, res) => {
  const [ids, all] = await Promise.all([InsurerServices.list(await companyId(req)), Services.listPublicIds()]);
  res.json(ids.length ? all.filter((s) => ids.includes(s.id)) : all);
});

router.get('/cases/:id', requireUser, requireRole('insurance'), async (req, res) => {
  const c = await InsuranceCases.byIdForUser(req.params.id, await companyId(req));
  if (!c) return res.status(404).json({ error: 'not_found' });
  const [events, visits, messages, attachments] = await Promise.all([
    RequestEvents.list('insurance_case', c.id),
    Visits.byRef('insurance_case', c.id),
    Threads.list('insurance_case', c.id),
    Attachments.byRef('insurance_case', c.id),
  ]);
  await Threads.markReadByUser('insurance_case', c.id);
  res.json({ ...c, events, visits, messages, attachments });
});

router.put('/cases/:id', requireUser, requireRole('insurance'), async (req, res) => {
  const c = await InsuranceCases.byIdForUser(req.params.id, await companyId(req));
  if (!c) return res.status(404).json({ error: 'not_found' });
  if (['completed', 'rejected', 'cancelled'].includes(c.status)) return res.status(409).json({ error: 'case_closed' });
  const b = req.body || {};
  if (!b.patient_name?.trim()) return res.status(400).json({ error: 'patient_name_required' });
  await InsuranceCases.updateFields(c.id, {
    hospital_name: b.hospital_name, patient_name: b.patient_name, national_id: b.national_id,
    mobile: b.mobile, city: b.city, dob: b.dob, diagnosis: b.diagnosis, requested_service: b.requested_service,
  });
  const u = await Users.byId(req.user.uid);
  await RequestEvents.add({ ref_type: 'insurance_case', ref_id: c.id, status: null, title_ar: 'تم تعديل بيانات الحالة', note: null, actor: u?.company_name || u?.name || 'الإدارة' });
  await Notifications.notifyAdmin('case', 'تعديل بيانات حالة تأمين', `${b.patient_name} — ${c.ref}`, `/admin/cases?open=${c.id}`);
  res.json({ ok: true });
});

router.post('/cases/:id/messages', requireUser, requireRole('insurance'), async (req, res) => {
  const c = await InsuranceCases.byIdForUser(req.params.id, await companyId(req));
  if (!c) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  if (!b.body?.trim() && !b.attachment_url) return res.status(400).json({ error: 'empty' });
  const u = await Users.byId(req.user.uid);
  await Threads.add({ ref_type: 'insurance_case', ref_id: c.id, sender_role: 'user', sender_name: u?.company_name || u?.name, body: b.body?.trim(), attachment_url: b.attachment_url, attachment_name: b.attachment_name });
  await Notifications.notifyAdmin('message', 'رسالة جديدة من شركة تأمين', `${u?.company_name || u?.name || ''}: ${(b.body || 'مرفق').slice(0, 60)}`, `/admin/cases?open=${c.id}`);
  res.status(201).json({ ok: true });
});

/* ---------------- Notifications (account) ---------------- */
router.get('/notifications', requireUser, async (req, res) => {
  const [items, unread] = await Promise.all([Notifications.forUser(req.user.uid), Notifications.unreadUser(req.user.uid)]);
  res.json({ items, unread });
});
router.post('/notifications/read', requireUser, async (req, res) => {
  await Notifications.readUser(req.user.uid, req.body?.id || null);
  res.json({ ok: true });
});
router.post('/notifications/dismiss', requireUser, async (req, res) => {
  if (req.body?.id) await Notifications.dismissUser(req.user.uid, req.body.id);
  res.json({ ok: true });
});
router.post('/notifications/clear', requireUser, async (req, res) => {
  await Notifications.clearUser(req.user.uid);
  res.json({ ok: true });
});

export default router;
