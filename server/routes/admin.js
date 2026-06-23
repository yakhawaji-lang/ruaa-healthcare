// Authenticated admin endpoints: dashboard, services CRUD, pages, messages,
// settings, image upload. All mounted behind requireAuth in index.js.
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { Settings, Pages, Services, Messages, HeroSlides, Partners, Users, ServiceRequests, InsuranceCases, RequestEvents, Patients, Visits, Threads, Attachments, Analytics, Notifications, Audit, InsurerServices, Admins, PushSubs, isSuperAdmin, parsePerms } from '../db/queries.js';
import { saveDataUrl } from '../upload.js';
import { publicKey as vapidPublicKey } from '../push.js';

const router = Router();

/* ---- Permission guard: page + action (view/create/edit/delete) ---- */
const PAGE_PREFIX = [
  ['/requests', 'requests'], ['/cases', 'cases'], ['/visits', 'visits'], ['/insurers', 'insurers'],
  ['/clients', 'clients'], ['/hero', 'hero'], ['/partners', 'partners'], ['/services', 'services'],
  ['/pages', 'pages'], ['/messages', 'messages'], ['/settings', 'settings'],
];
const ACTION_BY_METHOD = { GET: 'view', POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete' };
const pageFromPath = (p) => { for (const [pre, page] of PAGE_PREFIX) if (p.startsWith(pre)) return page; return 'dashboard'; };

router.use(async (req, res, next) => {
  try {
    const a = await Admins.byId(req.admin.id);
    if (!a) return res.status(401).json({ error: 'unauthorized' });
    if (a.is_active === 0) return res.status(403).json({ error: 'suspended' });
    const sup = isSuperAdmin(a);
    req.adminFull = a;
    req.isSuper = sup;
    const p = req.path;
    if (p.startsWith('/upload') || p.startsWith('/notifications') || p.startsWith('/push')) return next(); // shared (any active admin)
    if (p.startsWith('/admins')) {                        // user management = super only
      if (!sup) return res.status(403).json({ error: 'forbidden' });
      return next();
    }
    if (sup) return next();
    const perms = parsePerms(a) || { pages: {} };
    const page = pageFromPath(p);
    const action = ACTION_BY_METHOD[req.method] || 'view';
    const pp = perms.pages?.[page];
    if (pp && pp[action]) return next();
    return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    return res.status(500).json({ error: 'perm_check_failed' });
  }
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
const parseJSON = (v, fb) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
const STATUS_LABELS = {
  pending: 'تم الاستلام', reviewing: 'قيد المراجعة', approved: 'تم التواصل',
  scheduled: 'تم جدولة الزيارة', visit_scheduled: 'تم جدولة الزيارة', in_progress: 'قيد التنفيذ',
  completed: 'مكتمل', cancelled: 'ملغي', rejected: 'مرفوض', submitted: 'تم الاستلام',
};
const statusLabel = (s) => STATUS_LABELS[s] || s || 'تحديث';

/* ---- Web Push (PWA phone notifications) — any active admin ---- */
router.get('/push/key', (req, res) => res.json({ key: vapidPublicKey() }));
router.post('/push/subscribe', async (req, res) => {
  const s = req.body || {};
  if (!s.endpoint || !s.keys || !s.keys.p256dh || !s.keys.auth) return res.status(400).json({ error: 'invalid_subscription' });
  await PushSubs.add({
    recipient_type: 'admin', recipient_id: req.admin.id,
    endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth,
    ua: (req.headers['user-agent'] || '').slice(0, 250),
  });
  res.json({ ok: true });
});
router.post('/push/unsubscribe', async (req, res) => {
  if (req.body && req.body.endpoint) await PushSubs.removeByEndpoint(req.body.endpoint);
  res.json({ ok: true });
});

/* ---- Image upload (base64 data URL -> /uploads file) ---- */
router.post('/upload', (req, res) => {
  const { data, filename } = req.body || {};
  const m = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,(.+)$/i.exec(data || '');
  if (!m) return res.status(400).json({ error: 'invalid_image' });
  const ext = m[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'too_large' });
  const safe = String(filename || 'img').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'img';
  const name = `${Date.now()}-${safe}.${ext}`;
  const dir = path.join(uploadsDir, 'services');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buf);
  const url = `/uploads/services/${name}`;
  Audit.log(req.admin.id, 'upload', 'image', url);
  res.status(201).json({ url });
});

// Generic attachment upload (images + documents) for correspondence.
router.post('/upload-file', (req, res) => {
  try { res.status(201).json(saveDataUrl(req.body?.data, req.body?.filename)); }
  catch (e) { res.status(400).json({ error: e.code || 'upload_failed' }); }
});

/* ---- Dashboard summary ---- */
router.get('/stats', async (req, res) => {
  const [services, pages, messages, unread, reqCount, reqPending, caseCount, casePending, visitsUpcoming, threadUnread] = await Promise.all([
    Services.listAdmin(), Pages.listAdmin(), Messages.list(), Messages.unreadCount(),
    ServiceRequests.count(), ServiceRequests.pending(), InsuranceCases.count(), InsuranceCases.pending(),
    Visits.upcomingCount(), Threads.unreadForAdmin(),
  ]);
  res.json({
    services: services.length,
    pages: pages.length,
    messages: messages.length,
    unread,
    requests: reqCount, requestsPending: reqPending,
    cases: caseCount, casesPending: casePending,
    visitsUpcoming, threadUnread,
    recent: messages.slice(0, 5),
  });
});

/* ---- Notifications (admin) ---- */
router.get('/notifications', async (req, res) => {
  const [items, unread] = await Promise.all([Notifications.forAdmin(), Notifications.unreadAdmin()]);
  res.json({ items, unread });
});
router.post('/notifications/read', async (req, res) => {
  await Notifications.readAdmin(req.body?.id || null);
  res.json({ ok: true });
});
router.post('/notifications/dismiss', async (req, res) => {
  if (req.body?.id) await Notifications.dismissAdmin(req.body.id);
  res.json({ ok: true });
});
router.post('/notifications/clear', async (req, res) => {
  await Notifications.clearAdmin();
  res.json({ ok: true });
});

/* ---- Analytics (charts) ---- */
router.get('/analytics', async (req, res) => {
  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.k, r.n]));
  const [reqS, caseS, visitS, reqM, caseM] = await Promise.all([
    Analytics.groupByStatus('service_requests', 'deleted_at IS NULL'),
    Analytics.groupByStatus('insurance_cases', 'deleted_at IS NULL'),
    Analytics.groupByStatus('visits', '1=1'),
    Analytics.monthly('service_requests', 'deleted_at IS NULL'),
    Analytics.monthly('insurance_cases', 'deleted_at IS NULL'),
  ]);
  // merge monthly (last 6 months, ascending)
  const months = {};
  for (const r of reqM) (months[r.ym] = months[r.ym] || { ym: r.ym, requests: 0, cases: 0 }).requests = r.n;
  for (const r of caseM) (months[r.ym] = months[r.ym] || { ym: r.ym, requests: 0, cases: 0 }).cases = r.n;
  const monthly = Object.values(months).sort((a, b) => a.ym.localeCompare(b.ym));
  res.json({
    requestsByStatus: toMap(reqS),
    casesByStatus: toMap(caseS),
    visitsByStatus: toMap(visitS),
    monthly,
  });
});

/* ---- Settings ---- */
router.get('/settings', async (req, res) => res.json(await Settings.all()));
router.put('/settings', async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  for (const it of items) await Settings.upsert(it.key, it.value_ar, it.value_en);
  await Audit.log(req.admin.id, 'update', 'settings', null);
  res.json({ ok: true });
});

/* ---- Services CRUD ---- */
router.get('/services', async (req, res) => res.json(await Services.listAdmin()));
router.get('/services/:id', async (req, res) => {
  const s = await Services.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'not_found' });
  res.json({ ...s, body_ar: parseJSON(s.body_ar, []), body_en: parseJSON(s.body_en, []) });
});
function normalizeService(b) {
  return {
    slug: String(b.slug || '').trim(),
    icon: b.icon || 'stethoscope',
    image: b.image || null,
    price: (b.price === '' || b.price == null) ? null : Number(b.price),
    price_note_ar: b.price_note_ar || null,
    price_note_en: b.price_note_en || null,
    title_ar: b.title_ar || '', title_en: b.title_en || '',
    body_ar: JSON.stringify(Array.isArray(b.body_ar) ? b.body_ar : []),
    body_en: JSON.stringify(Array.isArray(b.body_en) ? b.body_en : []),
    is_published: b.is_published ? 1 : 0,
    sort_order: Number(b.sort_order) || 0,
  };
}
router.post('/services', async (req, res) => {
  const data = normalizeService(req.body || {});
  if (!data.slug || !data.title_ar) return res.status(400).json({ error: 'slug_and_title_required' });
  const r = await Services.create(data);
  await Audit.log(req.admin.id, 'create', 'service', r.insertId);
  res.status(201).json({ id: r.insertId });
});
router.put('/services/:id', async (req, res) => {
  const data = normalizeService(req.body || {});
  await Services.update(req.params.id, data);
  await Audit.log(req.admin.id, 'update', 'service', req.params.id);
  res.json({ ok: true });
});
router.delete('/services/:id', async (req, res) => {
  await Services.softDelete(req.params.id);
  await Audit.log(req.admin.id, 'delete', 'service', req.params.id);
  res.json({ ok: true });
});

/* ---- Service requests (visitor orders) ---- */
router.get('/requests', async (req, res) => res.json(await ServiceRequests.listAll()));
router.get('/requests/:id', async (req, res) => {
  const r = await ServiceRequests.byId(req.params.id);
  if (!r) return res.status(404).json({ error: 'not_found' });
  const [events, visits, profile, messages] = await Promise.all([
    RequestEvents.list('service_request', r.id),
    Visits.byRef('service_request', r.id),
    Patients.get(r.user_id),
    Threads.list('service_request', r.id),
  ]);
  await Threads.markReadByAdmin('service_request', r.id);
  res.json({ ...r, events, visits, profile: profile || {}, messages });
});
router.post('/requests/:id/messages', async (req, res) => {
  const b = req.body || {};
  if (!b.body?.trim() && !b.attachment_url) return res.status(400).json({ error: 'empty' });
  await Threads.add({ ref_type: 'service_request', ref_id: req.params.id, sender_role: 'admin', sender_name: 'إدارة رؤى', body: b.body?.trim(), attachment_url: b.attachment_url, attachment_name: b.attachment_name });
  const owner = await ServiceRequests.byId(req.params.id);
  if (owner) await Notifications.notifyUser(owner.user_id, 'message', 'رسالة من إدارة رؤى', (b.body || 'مرفق').slice(0, 70), `/portal/requests/${owner.id}`);
  res.status(201).json({ ok: true });
});
router.put('/requests/:id', async (req, res) => {
  const b = req.body || {};
  const cur = await ServiceRequests.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  await ServiceRequests.update(req.params.id, { status: b.status || cur.status, price: b.price ?? cur.price });
  // record a timeline event when status changes or a note/price is set
  if (b.event_title || b.status !== cur.status || b.note) {
    await RequestEvents.add({ ref_type: 'service_request', ref_id: cur.id, status: b.status || cur.status, title_ar: b.event_title || statusLabel(b.status), note: b.note || null, actor: 'الإدارة' });
  }
  if (b.status && b.status !== cur.status) {
    await Notifications.notifyUser(cur.user_id, 'status', 'تحديث حالة طلبك', `${cur.service_title || 'خدمة'}: ${statusLabel(b.status)}`, `/portal/requests/${cur.id}`);
  }
  await Audit.log(req.admin.id, 'update', 'service_request', cur.id);
  res.json({ ok: true });
});
// Delete a request + everything attached (visits, attachments, messages, timeline)
router.delete('/requests/:id', async (req, res) => {
  const id = req.params.id;
  if (!(await ServiceRequests.byId(id))) return res.status(404).json({ error: 'not_found' });
  await Visits.removeByRef('service_request', id);
  await Threads.removeByRef('service_request', id);
  await Attachments.removeByRef('service_request', id);
  await RequestEvents.removeByRef('service_request', id);
  await ServiceRequests.softDelete(id);
  await Audit.log(req.admin.id, 'delete', 'service_request', id);
  res.json({ ok: true });
});

/* ---- Insurance cases ---- */
router.get('/cases', async (req, res) => res.json(await InsuranceCases.listAll()));
router.get('/cases/:id', async (req, res) => {
  const c = await InsuranceCases.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const [events, visits, messages, attachments] = await Promise.all([
    RequestEvents.list('insurance_case', c.id),
    Visits.byRef('insurance_case', c.id),
    Threads.list('insurance_case', c.id),
    Attachments.byRef('insurance_case', c.id),
  ]);
  await Threads.markReadByAdmin('insurance_case', c.id);
  res.json({ ...c, events, visits, messages, attachments });
});
router.post('/cases/:id/messages', async (req, res) => {
  const b = req.body || {};
  if (!b.body?.trim() && !b.attachment_url) return res.status(400).json({ error: 'empty' });
  await Threads.add({ ref_type: 'insurance_case', ref_id: req.params.id, sender_role: 'admin', sender_name: 'إدارة رؤى', body: b.body?.trim(), attachment_url: b.attachment_url, attachment_name: b.attachment_name });
  const owner = await InsuranceCases.byId(req.params.id);
  if (owner) await Notifications.notifyUser(owner.user_id, 'message', 'رسالة من إدارة رؤى', (b.body || 'مرفق').slice(0, 70), `/portal/cases/${owner.id}`);
  res.status(201).json({ ok: true });
});

/* ---- Visits (scheduled by admin, linked to a request/case) ---- */
router.get('/visits', async (req, res) => res.json(await Visits.listAll()));
const REF_OWNER = {
  service_request: (id) => ServiceRequests.byId(id),
  insurance_case: (id) => InsuranceCases.byId(id),
};
router.post('/visits', async (req, res) => {
  const b = req.body || {};
  if (!b.ref_type || !b.ref_id || !REF_OWNER[b.ref_type]) return res.status(400).json({ error: 'bad_ref' });
  const owner = await REF_OWNER[b.ref_type](b.ref_id);
  if (!owner) return res.status(404).json({ error: 'ref_not_found' });
  // a home visit belongs to the patient — if the case has a linked patient account, use it
  const visitUserId = (b.ref_type === 'insurance_case' && owner.patient_user_id) ? owner.patient_user_id : owner.user_id;
  const r = await Visits.create({ ...b, user_id: visitUserId });
  // reflect the scheduled visit on the public tracking timeline
  const when = [b.visit_date, b.visit_time].filter(Boolean).join(' ');
  const schedStatus = b.ref_type === 'insurance_case' ? 'visit_scheduled' : 'scheduled';
  await RequestEvents.add({
    ref_type: b.ref_type, ref_id: b.ref_id, status: schedStatus,
    title_ar: 'تم جدولة زيارة منزلية',
    note: `${b.visit_type || 'زيارة منزلية'}${when ? ' بتاريخ ' + when : ''}${b.clinician_name ? ' — ' + b.clinician_name : ''}`,
    actor: 'الإدارة',
  });
  // auto-advance the parent to the "scheduled" stage if still earlier
  const earlier = b.ref_type === 'insurance_case' ? ['submitted', 'reviewing', 'approved'] : ['pending', 'reviewing', 'approved'];
  if (earlier.includes(owner.status)) {
    if (b.ref_type === 'insurance_case') await InsuranceCases.update(b.ref_id, { status: schedStatus });
    else await ServiceRequests.update(b.ref_id, { status: schedStatus, price: owner.price });
  }
  if (owner.user_id) {
    const link = b.ref_type === 'insurance_case' ? `/portal/cases/${b.ref_id}` : `/portal/requests/${b.ref_id}`;
    await Notifications.notifyUser(owner.user_id, 'visit', 'تم جدولة زيارة منزلية', `${b.visit_type || 'زيارة'}${when ? ' — ' + when : ''}`, link);
  }
  // also notify the patient on their own portal, if a separate patient account is linked
  if (visitUserId && visitUserId !== owner.user_id) {
    await Notifications.notifyUser(visitUserId, 'visit', 'تم جدولة زيارة منزلية لك', `${b.visit_type || 'زيارة'}${when ? ' — ' + when : ''}`, '/portal');
  }
  await Audit.log(req.admin.id, 'create', 'visit', r.insertId);
  res.status(201).json({ id: r.insertId });
});
router.put('/visits/:id', async (req, res) => {
  const cur = await Visits.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  await Visits.update(req.params.id, { ...cur, ...req.body });
  if (req.body?.status && req.body.status !== cur.status) {
    const lbl = req.body.status === 'completed' ? 'تمت الزيارة المنزلية' : req.body.status === 'cancelled' ? 'تم إلغاء الزيارة' : 'تحديث الزيارة';
    await RequestEvents.add({ ref_type: cur.ref_type, ref_id: cur.ref_id, status: null, title_ar: lbl, note: cur.clinician_name || null, actor: 'الإدارة' });
  }
  res.json({ ok: true });
});
router.delete('/visits/:id', async (req, res) => {
  await Visits.remove(req.params.id);
  res.json({ ok: true });
});

/* ---- Patient medical profile (admin view/edit) ---- */
router.get('/patients/:userId', async (req, res) => res.json(await Patients.get(req.params.userId) || {}));
router.put('/patients/:userId', async (req, res) => {
  await Patients.upsert(req.params.userId, req.body || {});
  await Audit.log(req.admin.id, 'update', 'patient_profile', req.params.userId);
  res.json({ ok: true });
});
// Auto-create (or link) a patient login account for an approved case.
// Username = patient mobile, password = patient national ID. Role: visitor (patient).
async function ensurePatientAccount(c) {
  if (c.patient_user_id) return { skipped: 'exists' };
  const mobile = (c.mobile || '').replace(/\s+/g, '');
  const nid = (c.national_id || '').trim();
  if (!mobile || !nid) return { skipped: 'missing_mobile_or_id' };
  // reuse an existing account on the same mobile, otherwise create one
  let user = (await Users.byEmail(mobile)) || (await Users.byPhone(mobile));
  let created = false;
  if (!user) {
    const hash = await bcrypt.hash(nid, 10);
    const r = await Users.create({ role: 'visitor', name: c.patient_name || 'مريض', email: mobile, phone: mobile }, hash);
    user = { id: r.insertId };
    created = true;
  }
  await InsuranceCases.setPatientUser(c.id, user.id);
  return { user_id: user.id, created, username: mobile };
}

router.put('/cases/:id', async (req, res) => {
  const b = req.body || {};
  const cur = await InsuranceCases.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  await InsuranceCases.update(req.params.id, { status: b.status || cur.status });
  if (b.event_title || b.status !== cur.status || b.note) {
    await RequestEvents.add({ ref_type: 'insurance_case', ref_id: cur.id, status: b.status || cur.status, title_ar: b.event_title || statusLabel(b.status), note: b.note || null, actor: 'الإدارة' });
  }
  if (b.status && b.status !== cur.status) {
    await Notifications.notifyUser(cur.user_id, 'status', 'تحديث حالة المريض', `${cur.patient_name}: ${statusLabel(b.status)}`, `/portal/cases/${cur.id}`);
  }

  // On approval: provision the patient's portal account.
  let patientAccount = null;
  if (b.status === 'approved' && cur.status !== 'approved') {
    try {
      const r = await ensurePatientAccount(cur);
      if (r.user_id) {
        patientAccount = r;
        await RequestEvents.add({
          ref_type: 'insurance_case', ref_id: cur.id, status: null,
          title_ar: r.created ? 'تم إنشاء حساب المريض' : 'تم ربط حساب المريض',
          note: `اسم المستخدم (الجوال): ${r.username} — كلمة المرور: رقم هوية المريض`, actor: 'النظام',
        });
        await Notifications.notifyAdmin('case', r.created ? 'تم إنشاء حساب للمريض' : 'تم ربط حساب المريض',
          `${cur.patient_name} — الدخول بالجوال ${r.username}`, `/admin/cases?open=${cur.id}`);
      }
    } catch (e) { /* never block approval on account errors */ }
  }

  await Audit.log(req.admin.id, 'update', 'insurance_case', cur.id);
  res.json({ ok: true, patientAccount });
});

// Admin edit of case patient/details fields
router.put('/cases/:id/details', async (req, res) => {
  const cur = await InsuranceCases.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  if (!b.patient_name?.trim()) return res.status(400).json({ error: 'patient_name_required' });
  await InsuranceCases.updateFields(cur.id, {
    hospital_name: b.hospital_name, patient_name: b.patient_name, national_id: b.national_id,
    mobile: b.mobile, city: b.city, dob: b.dob, diagnosis: b.diagnosis, requested_service: b.requested_service,
  });
  await RequestEvents.add({ ref_type: 'insurance_case', ref_id: cur.id, status: null, title_ar: 'تم تعديل بيانات الحالة', note: null, actor: 'الإدارة' });
  await Audit.log(req.admin.id, 'update', 'insurance_case_details', cur.id);
  res.json({ ok: true });
});
// Delete a case + everything attached (linked patient account, visits, attachments, messages, timeline)
router.delete('/cases/:id', async (req, res) => {
  const id = req.params.id;
  const c = await InsuranceCases.byId(id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  await Visits.removeByRef('insurance_case', id);
  await Threads.removeByRef('insurance_case', id);
  await Attachments.removeByRef('insurance_case', id);
  await RequestEvents.removeByRef('insurance_case', id);
  // note: the linked patient/client account is preserved (not deleted)
  await InsuranceCases.softDelete(id);
  await Audit.log(req.admin.id, 'delete', 'insurance_case', id);
  res.json({ ok: true });
});

/* ---- Insurance company accounts (created by admin) ---- */
router.get('/insurers', async (req, res) => res.json(await Users.listByRole('insurance')));
router.post('/insurers', async (req, res) => {
  const b = req.body || {};
  if (!b.email || !b.password || !(b.company_name || b.name)) return res.status(400).json({ error: 'missing_fields' });
  const email = String(b.email).toLowerCase().trim();
  if (await Users.byEmail(email)) return res.status(409).json({ error: 'email_taken' });
  const hash = await bcrypt.hash(b.password, 10);
  const r = await Users.create({ role: 'insurance', name: b.name || b.company_name, company_name: b.company_name || b.name, email, phone: b.phone }, hash);
  await Audit.log(req.admin.id, 'create', 'insurer', r.insertId);
  res.status(201).json({ id: r.insertId });
});
router.put('/insurers/:id', async (req, res) => {
  const b = req.body || {};
  if (!b.email || !(b.company_name || b.name)) return res.status(400).json({ error: 'missing_fields' });
  const email = String(b.email).toLowerCase().trim();
  const existing = await Users.byEmail(email);
  if (existing && String(existing.id) !== String(req.params.id)) return res.status(409).json({ error: 'email_taken' });
  await Users.updateInsurer(req.params.id, { company_name: b.company_name || b.name, name: b.name || b.company_name, email, phone: b.phone });
  await Audit.log(req.admin.id, 'update', 'insurer', req.params.id);
  res.json({ ok: true });
});
router.put('/insurers/:id/active', async (req, res) => {
  await Users.setActive(req.params.id, req.body?.is_active ? 1 : 0);
  res.json({ ok: true });
});
// Contracted/authorized services for an insurance company
router.get('/insurers/:id/services', async (req, res) => res.json(await InsurerServices.list(req.params.id)));
router.put('/insurers/:id/services', async (req, res) => {
  await InsurerServices.set(req.params.id, req.body?.service_ids || []);
  await Audit.log(req.admin.id, 'update', 'insurer_services', req.params.id);
  res.json({ ok: true });
});
router.put('/insurers/:id/password', async (req, res) => {
  const pw = String(req.body?.password || '');
  if (pw.length < 6) return res.status(400).json({ error: 'weak_password' });
  const hash = await bcrypt.hash(pw, 10);
  await Users.updatePassword(req.params.id, hash);
  await Audit.log(req.admin.id, 'update', 'insurer_password', req.params.id);
  res.json({ ok: true });
});
router.delete('/insurers/:id', async (req, res) => {
  await Users.softDelete(req.params.id);
  await Audit.log(req.admin.id, 'delete', 'insurer', req.params.id);
  res.json({ ok: true });
});

/* ---- Client (visitor) accounts ---- */
router.get('/clients', async (req, res) => res.json(await Users.listByRole('visitor')));
router.post('/clients', async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email || !b.password) return res.status(400).json({ error: 'missing_fields' });
  if (b.password.length < 6) return res.status(400).json({ error: 'weak_password' });
  const email = String(b.email).toLowerCase().trim();
  if (await Users.byEmail(email)) return res.status(409).json({ error: 'email_taken' });
  const hash = await bcrypt.hash(b.password, 10);
  const r = await Users.create({ role: 'visitor', name: b.name, email, phone: b.phone }, hash);
  await Audit.log(req.admin.id, 'create', 'client', r.insertId);
  res.status(201).json({ id: r.insertId });
});
router.put('/clients/:id', async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email) return res.status(400).json({ error: 'missing_fields' });
  const email = String(b.email).toLowerCase().trim();
  const existing = await Users.byEmail(email);
  if (existing && String(existing.id) !== String(req.params.id)) return res.status(409).json({ error: 'email_taken' });
  await Users.updateAccount(req.params.id, { name: b.name, email, phone: b.phone });
  await Audit.log(req.admin.id, 'update', 'client', req.params.id);
  res.json({ ok: true });
});
router.put('/clients/:id/active', async (req, res) => {
  await Users.setActive(req.params.id, req.body?.is_active ? 1 : 0);
  res.json({ ok: true });
});
router.put('/clients/:id/password', async (req, res) => {
  const pw = String(req.body?.password || '');
  if (pw.length < 6) return res.status(400).json({ error: 'weak_password' });
  await Users.updatePassword(req.params.id, await bcrypt.hash(pw, 10));
  await Audit.log(req.admin.id, 'update', 'client_password', req.params.id);
  res.json({ ok: true });
});
router.delete('/clients/:id', async (req, res) => {
  await Users.softDelete(req.params.id);
  await Audit.log(req.admin.id, 'delete', 'client', req.params.id);
  res.json({ ok: true });
});

/* ---- Control-panel users (admins) — super admin only (guarded above) ---- */
const shapeAdminRow = (a) => ({ id: a.id, name: a.name, email: a.email, role: a.role, is_super: isSuperAdmin(a), is_active: a.is_active, permissions: parsePerms(a), created_at: a.created_at });
router.get('/admins', async (req, res) => res.json((await Admins.list()).map(shapeAdminRow)));
router.post('/admins', async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email || !b.password) return res.status(400).json({ error: 'missing_fields' });
  if (b.password.length < 6) return res.status(400).json({ error: 'weak_password' });
  const email = String(b.email).toLowerCase().trim();
  if (await Admins.byEmail(email)) return res.status(409).json({ error: 'email_taken' });
  const hash = await bcrypt.hash(b.password, 10);
  const role = b.is_super ? 'super' : 'staff';
  const permissions = b.is_super ? null : JSON.stringify(b.permissions || { pages: {} });
  const r = await Admins.create(b.name, email, hash, role, permissions);
  await Audit.log(req.admin.id, 'create', 'admin', r.insertId);
  res.status(201).json({ id: r.insertId });
});
router.put('/admins/:id', async (req, res) => {
  const b = req.body || {};
  const id = Number(req.params.id);
  const target = await Admins.byId(id);
  if (!target) return res.status(404).json({ error: 'not_found' });
  if (!b.name || !b.email) return res.status(400).json({ error: 'missing_fields' });
  const email = String(b.email).toLowerCase().trim();
  const existing = await Admins.byEmail(email);
  if (existing && existing.id !== id) return res.status(409).json({ error: 'email_taken' });
  // never let an admin remove their own super status (avoid lock-out)
  const makeSuper = id === req.admin.id ? isSuperAdmin(target) : !!b.is_super;
  const role = makeSuper ? 'super' : 'staff';
  const permissions = makeSuper ? null : JSON.stringify(b.permissions || { pages: {} });
  await Admins.updateInfo(id, { name: b.name, email, role, permissions });
  await Audit.log(req.admin.id, 'update', 'admin', id);
  res.json({ ok: true });
});
router.put('/admins/:id/password', async (req, res) => {
  const pw = String(req.body?.password || '');
  if (pw.length < 6) return res.status(400).json({ error: 'weak_password' });
  await Admins.updatePassword(req.params.id, await bcrypt.hash(pw, 10));
  await Audit.log(req.admin.id, 'update', 'admin_password', req.params.id);
  res.json({ ok: true });
});
router.put('/admins/:id/active', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.admin.id) return res.status(400).json({ error: 'cannot_suspend_self' });
  await Admins.setActive(id, req.body?.is_active ? 1 : 0);
  res.json({ ok: true });
});
router.delete('/admins/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.admin.id) return res.status(400).json({ error: 'cannot_delete_self' });
  if ((await Admins.count()) <= 1) return res.status(400).json({ error: 'last_admin' });
  await Admins.remove(id);
  await Audit.log(req.admin.id, 'delete', 'admin', id);
  res.json({ ok: true });
});

/* ---- Hero slides CRUD ---- */
router.get('/hero', async (req, res) => res.json(await HeroSlides.listAdmin()));
router.get('/hero/:id', async (req, res) => {
  const s = await HeroSlides.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'not_found' });
  res.json(s);
});
function normalizeSlide(b) {
  return {
    image: b.image || null,
    title_ar: b.title_ar || '', title_en: b.title_en || '',
    subtitle_ar: b.subtitle_ar || '', subtitle_en: b.subtitle_en || '',
    badge_ar: b.badge_ar || '', badge_en: b.badge_en || '',
    is_published: b.is_published ? 1 : 0,
    sort_order: Number(b.sort_order) || 0,
  };
}
router.post('/hero', async (req, res) => {
  const r = await HeroSlides.create(normalizeSlide(req.body || {}));
  await Audit.log(req.admin.id, 'create', 'hero_slide', r.insertId);
  res.status(201).json({ id: r.insertId });
});
router.put('/hero/:id', async (req, res) => {
  await HeroSlides.update(req.params.id, normalizeSlide(req.body || {}));
  await Audit.log(req.admin.id, 'update', 'hero_slide', req.params.id);
  res.json({ ok: true });
});
router.delete('/hero/:id', async (req, res) => {
  await HeroSlides.softDelete(req.params.id);
  await Audit.log(req.admin.id, 'delete', 'hero_slide', req.params.id);
  res.json({ ok: true });
});

/* ---- Partners (insurance logos) CRUD ---- */
function normalizePartner(b) {
  return {
    name_ar: b.name_ar || '', name_en: b.name_en || '',
    logo: b.logo || '', url: b.url || '',
    is_published: b.is_published ? 1 : 0,
    sort_order: Number(b.sort_order) || 0,
  };
}
router.get('/partners', async (req, res) => res.json(await Partners.listAdmin()));
router.post('/partners', async (req, res) => {
  const b = normalizePartner(req.body || {});
  if (!b.logo) return res.status(400).json({ error: 'logo_required' });
  const r = await Partners.create(b);
  await Audit.log(req.admin.id, 'create', 'partner', r.insertId);
  res.status(201).json({ id: r.insertId });
});
router.put('/partners/:id', async (req, res) => {
  await Partners.update(req.params.id, normalizePartner(req.body || {}));
  await Audit.log(req.admin.id, 'update', 'partner', req.params.id);
  res.json({ ok: true });
});
router.delete('/partners/:id', async (req, res) => {
  await Partners.softDelete(req.params.id);
  await Audit.log(req.admin.id, 'delete', 'partner', req.params.id);
  res.json({ ok: true });
});

/* ---- Pages ---- */
router.get('/pages', async (req, res) => res.json(await Pages.listAdmin()));
router.get('/pages/:id', async (req, res) => {
  const p = await Pages.byId(req.params.id);
  if (!p) return res.status(404).json({ error: 'not_found' });
  res.json({ ...p, content: parseJSON(p.content_json, {}) });
});
router.put('/pages/:id', async (req, res) => {
  const b = req.body || {};
  await Pages.update(req.params.id, {
    title_ar: b.title_ar || '', title_en: b.title_en || '',
    content_json: JSON.stringify(b.content || {}),
    is_published: b.is_published ? 1 : 0,
  });
  await Audit.log(req.admin.id, 'update', 'page', req.params.id);
  res.json({ ok: true });
});

/* ---- Messages ---- */
router.get('/messages', async (req, res) => res.json(await Messages.list()));
router.put('/messages/:id/read', async (req, res) => {
  await Messages.markRead(req.params.id, req.body?.is_read ? 1 : 0);
  res.json({ ok: true });
});
router.delete('/messages/:id', async (req, res) => {
  await Messages.softDelete(req.params.id);
  await Audit.log(req.admin.id, 'delete', 'message', req.params.id);
  res.json({ ok: true });
});

export default router;
