// Telemedicine routers:
//   patientRouter → /api/account/telemed   (role: visitor / patient)
//   doctorRouter  → /api/account/doctor    (role: doctor)
//   adminRouter   → /api/admin/telemed     (mounted inside admin.js, page key "telemed")
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Users, Doctors, Consultations, RequestEvents, Threads, Patients, Notifications, Audit, Settings, Staff, parsePerms } from '../db/queries.js';
import { requireUser, requireRole } from '../auth.js';
import { freeSlots, slotStatus, joinWindow, joinInfo, nowLocal, normDateTime, isIsoDate, createConsultation, addEvent, notifyParties, consStatusLabel, modeLabelAr, requiresConfirmation, confirmConsultation, providerInfo } from '../telemed.js';

const modeOf = (m) => (m === 'audio' ? 'audio' : 'video');
const CLOSED = ['completed', 'cancelled', 'no_show'];
// Admin holding the telemed → "confirm bookings" permission (super admins always).
const canConfirm = (req) => !!req.isSuper || !!parsePerms(req.adminFull)?.pages?.telemed?.confirm;

/* =====================================================================
   PATIENT (visitor) — /api/account/telemed
   ===================================================================== */
export const patientRouter = Router();
patientRouter.use(requireUser, requireRole('visitor'));

// Feature settings (price, enabled) + published doctors for self-booking.
patientRouter.get('/doctors', async (req, res) => {
  const [docs, s] = await Promise.all([Doctors.listPublic(), Settings.asObject()]);
  res.json({
    enabled: (s.telemed_enabled?.ar ?? '1') !== '0',
    price: s.telemed_price?.ar || null,
    doctors: docs,
  });
});

patientRouter.get('/slots', async (req, res) => {
  const { doctor_id, date } = req.query;
  if (!doctor_id || !isIsoDate(date)) return res.status(400).json({ error: 'bad_query' });
  res.json({ date, slots: await freeSlots(doctor_id, date) });
});

// Next 14 days that have at least one free slot (so the calendar can grey out the rest).
patientRouter.get('/days', async (req, res) => {
  const { doctor_id } = req.query;
  if (!doctor_id) return res.status(400).json({ error: 'bad_query' });
  const today = nowLocal().date;
  const out = [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    const slots = await freeSlots(doctor_id, date);
    if (slots.length) out.push({ date, count: slots.length });
  }
  res.json(out);
});

patientRouter.post('/consultations', async (req, res) => {
  const b = req.body || {};
  if (!b.complaint?.trim()) return res.status(400).json({ error: 'complaint_required' });
  const s = await Settings.asObject();
  if ((s.telemed_enabled?.ar ?? '1') === '0') return res.status(403).json({ error: 'disabled' });
  const u = await Users.byId(req.user.uid);
  try {
    const c = await createConsultation({
      user_id: req.user.uid, doctor_user_id: b.doctor_user_id || null, scheduled_at: b.scheduled_at || null,
      mode: modeOf(b.mode), complaint: b.complaint.trim(), patient_name: b.patient_name || u?.name, phone: b.phone || u?.phone,
      preferred_note: b.preferred_note || null, price: s.telemed_price?.ar ? Number(s.telemed_price.ar) : null, source: 'self',
      requireConfirm: (s.telemed_require_confirm?.ar ?? '1') !== '0',
    });
    const when = c.scheduled_at ? ` — ${c.scheduled_at}` : ' — بانتظار الجدولة';
    await notifyParties(c, {
      admin: c.status === 'unconfirmed'
        ? { title: 'حجز استشارة بانتظار التأكيد', body: `${c.patient_name || ''} (${modeLabelAr(c.mode)})${when}` }
        : { title: 'طلب استشارة عن بُعد جديد', body: `${c.patient_name || ''} (${modeLabelAr(c.mode)})${when}` },
      // the provider is told once the booking is confirmed
      doctor: c.doctor_user_id && c.status === 'scheduled' ? { title: 'استشارة جديدة محجوزة معك', body: `${c.patient_name || ''} — ${c.scheduled_at}` } : null,
    });
    res.status(201).json({ id: c.id, ref: c.ref, status: c.status, scheduled_at: c.scheduled_at });
  } catch (e) {
    const code = e.code || 'failed';
    res.status(code === 'slot_taken' || code === 'slot_unavailable' ? 409 : 400).json({ error: code });
  }
});

patientRouter.get('/consultations', async (req, res) => res.json(await Consultations.listByUser(req.user.uid)));

patientRouter.get('/consultations/:id', async (req, res) => {
  const c = await Consultations.byIdForUser(req.params.id, req.user.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const [events, messages] = await Promise.all([RequestEvents.list('consultation', c.id), Threads.list('consultation', c.id)]);
  await Threads.markReadByUser('consultation', c.id);
  res.json({ ...c, events, messages, join: joinWindow(c) });
});

patientRouter.post('/consultations/:id/messages', async (req, res) => {
  const c = await Consultations.byIdForUser(req.params.id, req.user.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  if (!b.body?.trim() && !b.attachment_url) return res.status(400).json({ error: 'empty' });
  const u = await Users.byId(req.user.uid);
  await Threads.add({ ref_type: 'consultation', ref_id: c.id, sender_role: 'user', sender_name: u?.name, body: b.body?.trim(), attachment_url: b.attachment_url, attachment_name: b.attachment_name });
  await Notifications.notifyAdmin('message', 'رسالة جديدة (استشارة عن بُعد)', `${u?.name || ''}: ${(b.body || 'مرفق').slice(0, 60)}`, `/admin/telemed?open=${c.id}`);
  res.status(201).json({ ok: true });
});

patientRouter.post('/consultations/:id/cancel', async (req, res) => {
  const c = await Consultations.byIdForUser(req.params.id, req.user.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  if (CLOSED.includes(c.status) || c.status === 'in_progress') return res.status(409).json({ error: 'closed' });
  await Consultations.setStatus(c.id, 'cancelled');
  await addEvent(c.id, 'cancelled', 'تم إلغاء الاستشارة', 'ألغى المريض الاستشارة.', 'العميل');
  await notifyParties(c, {
    admin: { title: 'إلغاء استشارة عن بُعد', body: `${c.patient_name || ''} — ${c.ref}` },
    doctor: { title: 'تم إلغاء استشارة', body: `${c.patient_name || ''} — ${c.scheduled_at || ''}` },
  });
  res.json({ ok: true });
});

patientRouter.get('/consultations/:id/join', async (req, res) => {
  const c = await Consultations.byIdForUser(req.params.id, req.user.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const w = joinWindow(c);
  if (!w.ok) return res.status(409).json({ error: w.reason, minutes: w.minutes });
  const u = await Users.byId(req.user.uid);
  res.json(await joinInfo(c, { name: c.patient_name || u?.name, role: 'patient', email: u?.email }));
});

/* =====================================================================
   DOCTOR — /api/account/doctor
   ===================================================================== */
export const doctorRouter = Router();
doctorRouter.use(requireUser, requireRole('doctor'));

doctorRouter.get('/me', async (req, res) => {
  const [doc, rules, off, dates] = await Promise.all([Doctors.byId(req.user.uid), Doctors.availability(req.user.uid), Doctors.daysOff(req.user.uid), Doctors.dateAvailability(req.user.uid).catch(() => [])]);
  res.json({ profile: doc || {}, availability: rules, days_off: off, date_availability: dates });
});
doctorRouter.put('/me', async (req, res) => {
  const cur = await Doctors.byId(req.user.uid);
  const b = req.body || {};
  const merged = { ...cur, ...b, is_published: cur?.is_published ?? 1, sort_order: cur?.sort_order ?? 0 };
  await Doctors.upsertProfile(req.user.uid, merged);
  await Staff.updateProfileByUser(req.user.uid, merged).catch(() => {});   // staff directory is the master profile
  res.json({ ok: true });
});
doctorRouter.put('/availability', async (req, res) => {
  const n = await Doctors.setAvailability(req.user.uid, req.body?.rules || []);
  let d = 0;
  if (Array.isArray(req.body?.dates)) d = await Doctors.setDateAvailability(req.user.uid, req.body.dates);
  res.json({ ok: true, rules: n, dates: d });
});
doctorRouter.post('/days-off', async (req, res) => {
  const { date, note } = req.body || {};
  if (!isIsoDate(date)) return res.status(400).json({ error: 'bad_date' });
  await Doctors.addDayOff(req.user.uid, date, note);
  res.status(201).json({ ok: true });
});
doctorRouter.delete('/days-off/:id', async (req, res) => {
  await Doctors.removeDayOff(req.user.uid, req.params.id);
  res.json({ ok: true });
});

// All my consultations, split by the client (today / upcoming / past).
doctorRouter.get('/consultations', async (req, res) => {
  const list = await Consultations.listByDoctor(req.user.uid);
  res.json({ now: nowLocal().str, items: list });
});

doctorRouter.get('/consultations/:id', async (req, res) => {
  const c = await Consultations.byIdForDoctor(req.params.id, req.user.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const [events, profile, history] = await Promise.all([
    RequestEvents.list('consultation', c.id),
    Patients.get(c.user_id),
    Consultations.listByUser(c.user_id),
  ]);
  // previous consultations of the same patient (for context), without the current one
  const previous = history.filter((h) => h.id !== c.id && h.status === 'completed').slice(0, 10)
    .map((h) => ({ id: h.id, ref: h.ref, scheduled_at: h.scheduled_at, doctor_name: h.doctor_name, diagnosis: h.diagnosis, doctor_notes: h.doctor_notes }));
  res.json({ ...c, events, profile: profile || {}, previous, join: joinWindow(c) });
});

doctorRouter.get('/consultations/:id/join', async (req, res) => {
  const c = await Consultations.byIdForDoctor(req.params.id, req.user.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const w = joinWindow(c);
  if (!w.ok) return res.status(409).json({ error: w.reason, minutes: w.minutes });
  if (c.status === 'scheduled') {
    await Consultations.markStarted(c.id, nowLocal().str + ':00');
    await addEvent(c.id, 'in_progress', 'بدأت الاستشارة', `انضم الطبيب ${c.doctor_name || ''} إلى الغرفة.`, 'الطبيب');
    await notifyParties(c, { patient: { title: 'الطبيب في انتظارك الآن', body: `${c.doctor_name || 'الطبيب'} انضم إلى غرفة الاستشارة — ادخل الآن.` } });
  }
  const u = await Users.byId(req.user.uid);
  res.json(await joinInfo(c, { name: `د. ${u?.name || ''}`.trim(), role: 'doctor', email: u?.email, avatar: c.doctor_photo }));
});

// Clinical outcome + status (in_progress → completed / no_show).
doctorRouter.put('/consultations/:id', async (req, res) => {
  const c = await Consultations.byIdForDoctor(req.params.id, req.user.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  if (c.status === 'unconfirmed' && b.status && b.status !== c.status) return res.status(409).json({ error: 'unconfirmed' });
  const status = ['completed', 'no_show', 'in_progress', 'scheduled'].includes(b.status) ? b.status : c.status;
  await Consultations.saveOutcome(c.id, {
    status, ended_at: CLOSED.includes(status) ? nowLocal().str + ':00' : null,
    doctor_notes: b.doctor_notes ?? c.doctor_notes, diagnosis: b.diagnosis ?? c.diagnosis,
    prescription: b.prescription ?? c.prescription, follow_up: b.follow_up ?? c.follow_up,
  });
  if (status !== c.status) {
    await addEvent(c.id, status, consStatusLabel(status), b.follow_up ? `متابعة: ${b.follow_up}` : null, 'الطبيب');
    await notifyParties(c, {
      patient: status === 'completed' ? { title: 'اكتملت استشارتك', body: 'يمكنك الاطلاع على ملخص الطبيب من صفحة الاستشارة.' } : null,
      admin: { title: `تحديث استشارة: ${consStatusLabel(status)}`, body: `${c.patient_name || ''} — ${c.ref}` },
    });
  }
  res.json({ ok: true });
});

/* =====================================================================
   ADMIN — mounted at /api/admin/telemed (page key "telemed")
   ===================================================================== */
export const adminRouter = Router();

/* ---- Doctors (accounts + profile + availability) ---- */
adminRouter.get('/doctors', async (req, res) => res.json(await Doctors.listAdmin()));
adminRouter.get('/doctors/:id', async (req, res) => {
  const [doc, rules, off, dates] = await Promise.all([Doctors.byId(req.params.id), Doctors.availability(req.params.id), Doctors.daysOff(req.params.id), Doctors.dateAvailability(req.params.id).catch(() => [])]);
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json({ ...doc, availability: rules, days_off: off, date_availability: dates });
});
adminRouter.post('/doctors', async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email || !b.password) return res.status(400).json({ error: 'missing_fields' });
  if (String(b.password).length < 6) return res.status(400).json({ error: 'weak_password' });
  const email = String(b.email).toLowerCase().trim();
  const live = await Users.byEmail(email);
  if (live) return res.status(409).json({ error: 'email_taken' });
  const any = await Users.byEmailAny(email);
  if (any) await Users.releaseEmail(any.id);
  try {
    const hash = await bcrypt.hash(String(b.password), 10);
    const r = await Users.create({ role: 'doctor', name: b.name, email, phone: b.phone }, hash);
    await Doctors.upsertProfile(r.insertId, b);
    if (Array.isArray(b.availability)) await Doctors.setAvailability(r.insertId, b.availability);
    // mirror into the staff directory (master record for people)
    const sr = await Staff.create({ ...b, name_ar: b.name, name_en: b.name_en || '', email, roles: b.profession_ar ? [b.profession_ar] : [], staff_type: b.provider_type }).catch(() => null);
    if (sr) await Staff.setUser(sr.insertId, r.insertId);
    await Audit.log(req.admin.id, 'create', 'doctor', r.insertId);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    console.error('[telemed] create doctor failed:', e?.sqlMessage || e?.message);
    res.status(500).json({ error: 'db_error' });
  }
});
adminRouter.put('/doctors/:id', async (req, res) => {
  const b = req.body || {};
  const cur = await Doctors.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  if (!b.name || !b.email) return res.status(400).json({ error: 'missing_fields' });
  const email = String(b.email).toLowerCase().trim();
  const live = await Users.byEmail(email);
  if (live && String(live.id) !== String(cur.id)) return res.status(409).json({ error: 'email_taken' });
  await Users.updateAccount(cur.id, { name: b.name, email, phone: b.phone });
  await Doctors.upsertProfile(cur.id, { ...cur, ...b });
  if (Array.isArray(b.availability)) await Doctors.setAvailability(cur.id, b.availability);
  const st = await Staff.byUser(cur.id);
  if (st) await Staff.update(st.id, { ...st, ...b, name_ar: b.name, roles: (() => { try { return JSON.parse(st.roles_json) || []; } catch { return []; } })(), staff_type: b.provider_type || st.staff_type });
  await Audit.log(req.admin.id, 'update', 'doctor', cur.id);
  res.json({ ok: true });
});
adminRouter.put('/doctors/:id/availability', async (req, res) => {
  const n = await Doctors.setAvailability(req.params.id, req.body?.rules || []);
  let d = 0;
  if (Array.isArray(req.body?.dates)) d = await Doctors.setDateAvailability(req.params.id, req.body.dates);
  res.json({ ok: true, rules: n, dates: d });
});
adminRouter.post('/doctors/:id/days-off', async (req, res) => {
  const { date, note } = req.body || {};
  if (!isIsoDate(date)) return res.status(400).json({ error: 'bad_date' });
  await Doctors.addDayOff(req.params.id, date, note);
  res.status(201).json({ ok: true });
});
adminRouter.delete('/doctors/:id/days-off/:offId', async (req, res) => {
  await Doctors.removeDayOff(req.params.id, req.params.offId);
  res.json({ ok: true });
});
adminRouter.put('/doctors/:id/active', async (req, res) => {
  await Users.setActive(req.params.id, req.body?.is_active ? 1 : 0);
  res.json({ ok: true });
});
adminRouter.put('/doctors/:id/password', async (req, res) => {
  const pw = String(req.body?.password || '');
  if (pw.length < 6) return res.status(400).json({ error: 'weak_password' });
  await Users.updatePassword(req.params.id, await bcrypt.hash(pw, 10));
  await Audit.log(req.admin.id, 'update', 'doctor_password', req.params.id);
  res.json({ ok: true });
});
adminRouter.delete('/doctors/:id', async (req, res) => {
  const st = await Staff.byUser(req.params.id);
  if (st) await Staff.setUser(st.id, null);   // keep the person in the directory, drop the access
  await Doctors.removeAll(req.params.id);
  await Users.softDelete(req.params.id);
  await Audit.log(req.admin.id, 'delete', 'doctor', req.params.id);
  res.json({ ok: true });
});

/* ---- Slots (for the admin scheduler) ---- */
adminRouter.get('/provider', async (req, res) => res.json(await providerInfo()));

adminRouter.get('/slots', async (req, res) => {
  const { doctor_id, date } = req.query;
  if (!doctor_id || !isIsoDate(date)) return res.status(400).json({ error: 'bad_query' });
  res.json({ date, slots: await freeSlots(doctor_id, date, { minLeadMinutes: 0 }) });
});

/* ---- Consultations ---- */
adminRouter.get('/consultations', async (req, res) => res.json({ now: nowLocal().str, items: await Consultations.listAll() }));
adminRouter.get('/consultations/:id', async (req, res) => {
  const c = await Consultations.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const [events, messages, profile] = await Promise.all([RequestEvents.list('consultation', c.id), Threads.list('consultation', c.id), Patients.get(c.user_id)]);
  await Threads.markReadByAdmin('consultation', c.id);
  res.json({ ...c, events, messages, profile: profile || {}, join: joinWindow(c) });
});

// Admin books on behalf of a client account.
adminRouter.post('/consultations', async (req, res) => {
  const b = req.body || {};
  if (!b.user_id) return res.status(400).json({ error: 'user_required' });
  const u = await Users.byId(b.user_id);
  if (!u || u.role !== 'visitor') return res.status(400).json({ error: 'bad_user' });
  try {
    const c = await createConsultation({
      user_id: u.id, doctor_user_id: b.doctor_user_id || null, scheduled_at: b.scheduled_at || null, mode: modeOf(b.mode),
      complaint: b.complaint || null, patient_name: b.patient_name || u.name, phone: b.phone || u.phone, preferred_note: b.preferred_note || null,
      price: b.price === '' || b.price == null ? null : Number(b.price), source: 'admin', duration_min: b.duration_min,
      requireConfirm: (await requiresConfirmation()) && !canConfirm(req),
    });
    await notifyParties(c, {
      patient: { title: c.status === 'scheduled' ? 'تم حجز استشارة عن بُعد لك' : c.status === 'unconfirmed' ? 'تم حجز موعد استشارة لك بانتظار التأكيد' : 'تم تسجيل طلب استشارة لك', body: `${modeLabelAr(c.mode)}${c.scheduled_at ? ' — ' + c.scheduled_at : ''}` },
      doctor: c.doctor_user_id && c.status === 'scheduled' ? { title: 'استشارة جديدة مجدولة معك', body: `${c.patient_name || ''} — ${c.scheduled_at || ''}` } : null,
      admin: c.status === 'unconfirmed' ? { title: 'حجز استشارة بانتظار التأكيد', body: `${c.patient_name || ''} — ${c.scheduled_at}` } : null,
    });
    await Audit.log(req.admin.id, 'create', 'consultation', c.id);
    res.status(201).json({ id: c.id, ref: c.ref });
  } catch (e) {
    const code = e.code || 'failed';
    res.status(code === 'slot_taken' ? 409 : 400).json({ error: code });
  }
});

// Schedule / reassign / change status or price.
adminRouter.put('/consultations/:id', async (req, res) => {
  const cur = await Consultations.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  const doctorId = b.doctor_user_id === undefined ? cur.doctor_user_id : (b.doctor_user_id || null);
  const at = b.scheduled_at === undefined ? cur.scheduled_at : normDateTime(b.scheduled_at);
  let status = ['pending', 'unconfirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(b.status) ? b.status : cur.status;
  const confirmer = canConfirm(req);
  if (doctorId && at) {
    const st = await slotStatus(doctorId, at, cur.id);
    if (st === 'taken') return res.status(409).json({ error: 'slot_taken' });
    if (status === 'pending') status = confirmer ? 'scheduled' : 'unconfirmed';
    // moving to "scheduled" from an unconfirmed / pending state is a confirmation → needs the permission
    if (status === 'scheduled' && ['pending', 'unconfirmed'].includes(cur.status) && !confirmer) status = 'unconfirmed';
  } else if (status === 'scheduled' || status === 'unconfirmed') {
    status = 'pending'; // cannot be "scheduled" without a doctor and a time
  }
  const confirmedNow = status === 'scheduled' && cur.status === 'unconfirmed';
  await Consultations.schedule(cur.id, {
    doctor_user_id: doctorId, scheduled_at: at ? at + ':00' : null, duration_min: b.duration_min || cur.duration_min,
    status, price: b.price === undefined ? cur.price : (b.price === '' || b.price == null ? null : Number(b.price)), mode: b.mode || cur.mode,
  });
  const c = await Consultations.byId(cur.id);
  const changedSlot = (c.scheduled_at !== cur.scheduled_at) || (c.doctor_user_id !== cur.doctor_user_id);
  if (confirmedNow) {
    await addEvent(c.id, 'scheduled', changedSlot ? 'تم تأكيد الموعد بعد تعديله' : 'تم تأكيد الموعد', b.note || `${c.doctor_name || ''} — ${c.scheduled_at}`, 'الإدارة');
    await notifyParties(c, {
      patient: { title: 'تم تأكيد موعد استشارتك', body: `${c.doctor_name || 'الطبيب'} — ${c.scheduled_at} (${modeLabelAr(c.mode)})` },
      doctor: { title: 'استشارة مؤكدة معك', body: `${c.patient_name || ''} — ${c.scheduled_at}` },
    });
  } else if (c.status === 'unconfirmed' && (changedSlot || cur.status !== 'unconfirmed')) {
    await addEvent(c.id, 'unconfirmed', cur.status === 'unconfirmed' ? 'تم تعديل الموعد بانتظار التأكيد' : 'تم حجز الموعد بانتظار التأكيد', `${c.doctor_name || ''} — ${c.scheduled_at}`, 'الإدارة');
    await notifyParties(c, {
      patient: { title: 'موعد استشارتك بانتظار التأكيد', body: `${c.doctor_name || 'الطبيب'} — ${c.scheduled_at}` },
      admin: { title: 'حجز استشارة بانتظار التأكيد', body: `${c.patient_name || ''} — ${c.scheduled_at}` },
    });
  } else if (changedSlot && c.status === 'scheduled') {
    await addEvent(c.id, 'scheduled', cur.scheduled_at ? 'تم تعديل موعد الاستشارة' : 'تم تحديد موعد الاستشارة', `${c.doctor_name || ''} — ${c.scheduled_at}`, 'الإدارة');
    await notifyParties(c, {
      patient: { title: cur.scheduled_at ? 'تم تعديل موعد استشارتك' : 'تم تحديد موعد استشارتك', body: `${c.doctor_name || 'الطبيب'} — ${c.scheduled_at} (${modeLabelAr(c.mode)})` },
      doctor: { title: 'استشارة مجدولة معك', body: `${c.patient_name || ''} — ${c.scheduled_at}` },
    });
    if (cur.doctor_user_id && cur.doctor_user_id !== c.doctor_user_id) {
      await Notifications.notifyUser(cur.doctor_user_id, 'telemed', 'تم نقل استشارة من جدولك', `${c.patient_name || ''} — ${cur.scheduled_at || ''}`, '/portal');
    }
  } else if (status !== cur.status) {
    await addEvent(c.id, status, consStatusLabel(status), b.note || null, 'الإدارة');
    await notifyParties(c, {
      patient: { title: 'تحديث حالة استشارتك', body: consStatusLabel(status) },
      doctor: CLOSED.includes(status) ? { title: 'تحديث استشارة', body: `${c.patient_name || ''}: ${consStatusLabel(status)}` } : null,
    });
  }
  await Audit.log(req.admin.id, 'update', 'consultation', c.id);
  res.json({ ok: true });
});

// Confirm or decline a booking that awaits confirmation (permission telemed → confirm).
adminRouter.post('/consultations/:id/confirm', async (req, res) => {
  if (!canConfirm(req)) return res.status(403).json({ error: 'forbidden' });
  const c = await Consultations.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const action = req.body?.action === 'reject' ? 'reject' : 'confirm';
  try {
    const status = await confirmConsultation(c, { action, note: req.body?.note?.trim() || null, actor: `الإدارة — ${req.adminFull?.name || ''}`.trim() });
    await Audit.log(req.admin.id, action, 'consultation', c.id);
    res.json({ ok: true, status });
  } catch (e) {
    const code = e.code || 'failed';
    res.status(code === 'slot_taken' || code === 'not_unconfirmed' ? 409 : 400).json({ error: code });
  }
});

adminRouter.post('/consultations/:id/messages', async (req, res) => {
  const c = await Consultations.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  if (!b.body?.trim() && !b.attachment_url) return res.status(400).json({ error: 'empty' });
  await Threads.add({ ref_type: 'consultation', ref_id: c.id, sender_role: 'admin', sender_name: 'إدارة رؤى', body: b.body?.trim(), attachment_url: b.attachment_url, attachment_name: b.attachment_name });
  await Notifications.notifyUser(c.user_id, 'message', 'رسالة من إدارة رؤى', (b.body || 'مرفق').slice(0, 70), `/portal/consultations/${c.id}`);
  res.status(201).json({ ok: true });
});

adminRouter.get('/consultations/:id/join', async (req, res) => {
  const c = await Consultations.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const w = joinWindow(c);
  if (!w.ok) return res.status(409).json({ error: w.reason, minutes: w.minutes });
  res.json(await joinInfo(c, { name: `إدارة رؤى — ${req.adminFull?.name || ''}`, role: 'admin', email: req.adminFull?.email }));
});

adminRouter.delete('/consultations/:id', async (req, res) => {
  const c = await Consultations.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  await Threads.removeByRef('consultation', c.id);
  await RequestEvents.removeByRef('consultation', c.id);
  await Consultations.softDelete(c.id);
  await Audit.log(req.admin.id, 'delete', 'consultation', c.id);
  res.json({ ok: true });
});
