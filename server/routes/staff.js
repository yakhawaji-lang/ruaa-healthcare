// Admin — unified staff directory (page key "staff"). Mounted at /api/admin/staff
// inside admin.js so the permission guard applies. Access-granting operations
// that create control-panel users are restricted to super admins.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Staff, Users, Admins, Doctors, Audit } from '../db/queries.js';
import { grantTelemed, revokeTelemed, grantAdmin, revokeAdmin } from '../staff.js';

const router = Router();
const fail = (res, e) => {
  const code = e?.code || 'failed';
  const status = ['email_taken', 'admin_linked'].includes(code) ? 409 : code === 'not_found' || code === 'admin_not_found' ? 404 : code === 'failed' ? 500 : 400;
  if (status === 500) console.error('[staff]', e?.sqlMessage || e?.message || e);
  res.status(status).json({ error: code });
};
const shape = (s) => s && ({ ...s, roles: (() => { try { return s.roles_json ? JSON.parse(s.roles_json) : []; } catch { return []; } })(), has_admin: !!s.admin_id, has_telemed: !!s.user_id });

// Compact directory for the home-visit scheduler (any admin with visits/telemed/staff view)
router.get('/directory', async (req, res) => res.json((await Staff.directory()).map(shape)));

router.get('/', async (req, res) => res.json((await Staff.list()).map(shape)));
router.get('/:id', async (req, res) => {
  const s = await Staff.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'not_found' });
  const extra = s.user_id ? { availability: await Doctors.availability(s.user_id), days_off: await Doctors.daysOff(s.user_id) } : {};
  res.json({ ...shape(s), ...extra });
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  if (!b.name_ar && !b.name_en) return res.status(400).json({ error: 'name_required' });
  try {
    const r = await Staff.create({ ...b, name_ar: b.name_ar || b.name_en });
    await Audit.log(req.admin.id, 'create', 'staff', r.insertId);
    // optional: grant access in the same call
    if (b.grant_telemed) await grantTelemed(r.insertId, b.grant_telemed);
    res.status(201).json({ id: r.insertId });
  } catch (e) { fail(res, e); }
});

router.put('/:id', async (req, res) => {
  const cur = await Staff.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  if (!b.name_ar && !b.name_en) return res.status(400).json({ error: 'name_required' });
  try {
    await Staff.update(cur.id, { ...cur, ...b, name_ar: b.name_ar || b.name_en });
    // keep linked accounts' display data in sync
    if (cur.user_id) {
      await Users.updateAccount(cur.user_id, { name: b.name_ar || b.name_en, email: cur.telemed_email, phone: b.phone });
      if (b.slot_minutes !== undefined || b.is_published !== undefined) {
        await Doctors.upsertProfile(cur.user_id, { slot_minutes: b.slot_minutes ?? cur.slot_minutes, is_published: b.is_published ?? cur.is_published, sort_order: b.sort_order ?? cur.sort_order });
      }
      if (Array.isArray(b.availability)) await Doctors.setAvailability(cur.user_id, b.availability);
    }
    await Audit.log(req.admin.id, 'update', 'staff', cur.id);
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
});

router.put('/:id/active', async (req, res) => {
  const cur = await Staff.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  const on = req.body?.is_active ? 1 : 0;
  await Staff.setActive(cur.id, on);
  if (cur.user_id) await Users.setActive(cur.user_id, on);           // telemedicine login follows
  if (cur.admin_id && Number(cur.admin_id) !== Number(req.admin.id) && req.isSuper) await Admins.setActive(cur.admin_id, on);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const cur = await Staff.byId(req.params.id);
  if (!cur) return res.status(404).json({ error: 'not_found' });
  if (cur.user_id) await revokeTelemed(cur.id);
  if (cur.admin_id && req.isSuper) await revokeAdmin(cur.id, { remove: true, actingAdminId: req.admin.id });
  await Staff.softDelete(cur.id);
  await Audit.log(req.admin.id, 'delete', 'staff', cur.id);
  res.json({ ok: true });
});

/* ---- Telemedicine access ---- */
router.post('/:id/telemed', async (req, res) => {
  try { res.status(201).json(await grantTelemed(req.params.id, req.body || {})); await Audit.log(req.admin.id, 'grant', 'staff_telemed', req.params.id); }
  catch (e) { fail(res, e); }
});
router.delete('/:id/telemed', async (req, res) => {
  await revokeTelemed(req.params.id);
  await Audit.log(req.admin.id, 'revoke', 'staff_telemed', req.params.id);
  res.json({ ok: true });
});
router.put('/:id/telemed/password', async (req, res) => {
  const s = await Staff.byId(req.params.id);
  if (!s?.user_id) return res.status(404).json({ error: 'not_found' });
  const pw = String(req.body?.password || '');
  if (pw.length < 6) return res.status(400).json({ error: 'weak_password' });
  await Users.updatePassword(s.user_id, await bcrypt.hash(pw, 10));
  res.json({ ok: true });
});

/* ---- Control-panel access (super admin only) ---- */
router.use('/:id/admin', (req, res, next) => (req.isSuper ? next() : res.status(403).json({ error: 'forbidden' })));
router.post('/:id/admin', async (req, res) => {
  try { res.status(201).json(await grantAdmin(req.params.id, req.body || {})); await Audit.log(req.admin.id, 'grant', 'staff_admin', req.params.id); }
  catch (e) { fail(res, e); }
});
router.delete('/:id/admin', async (req, res) => {
  await revokeAdmin(req.params.id, { remove: !!req.query.remove, actingAdminId: req.admin.id });
  await Audit.log(req.admin.id, 'revoke', 'staff_admin', req.params.id);
  res.json({ ok: true });
});
router.put('/:id/admin/password', async (req, res) => {
  const s = await Staff.byId(req.params.id);
  if (!s?.admin_id) return res.status(404).json({ error: 'not_found' });
  const pw = String(req.body?.password || '');
  if (pw.length < 6) return res.status(400).json({ error: 'weak_password' });
  await Admins.updatePassword(s.admin_id, await bcrypt.hash(pw, 10));
  res.json({ ok: true });
});

export default router;
