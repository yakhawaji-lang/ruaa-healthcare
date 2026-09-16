// Staff directory service: one-time import of the legacy lists into the unified
// `staff` table, and the "grant / revoke access" operations that link a staff
// record to a telemedicine account (users.role=doctor) or a control-panel user.
import bcrypt from 'bcryptjs';
import { query } from './db/pool.js';
import { Staff, Settings, Users, Doctors, Admins } from './db/queries.js';

const parseJSON = (v, fb) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
const norm = (s) => String(s || '').trim().toLowerCase();

// Runs once at server start. Safe to call repeatedly: it only imports when the
// directory is still empty, and it never deletes the legacy Settings list.
export async function ensureStaffImported() {
  let count;
  try { count = await Staff.count(); } catch { return; } // table not migrated yet
  if (count > 0) return;
  const settings = await Settings.asObject();
  const roles = parseJSON(settings.clinician_roles?.ar, []) || [];
  const roleEn = (ar) => (roles.find((r) => (typeof r === 'string' ? r : r.ar) === ar) || {}).en || ar;
  const legacy = parseJSON(settings.clinical_staff?.ar, []) || [];
  const admins = await Admins.list();
  const imported = new Map(); // name key -> staff id

  // 1) names from Settings → clinical_staff
  for (const [i, st] of legacy.entries()) {
    const name_ar = typeof st === 'string' ? st : (st.name_ar || st.name || '');
    const name_en = typeof st === 'string' ? '' : (st.name_en || '');
    if (!name_ar && !name_en) continue;
    const rls = Array.isArray(st.roles) ? st.roles : [];
    const r = await Staff.create({ name_ar: name_ar || name_en, name_en, profession_ar: rls[0] || null, profession_en: rls[0] ? roleEn(rls[0]) : null, roles: rls, sort_order: i });
    imported.set(norm(name_ar), r.insertId); if (name_en) imported.set(norm(name_en), r.insertId);
  }

  // 2) existing telemedicine providers (users.role='doctor') → link or create
  const providers = await query("SELECT u.id, u.name, u.email, u.phone, d.* FROM users u LEFT JOIN doctors d ON d.user_id=u.id WHERE u.role='doctor' AND u.deleted_at IS NULL");
  for (const p of providers) {
    let sid = imported.get(norm(p.staff_ref)) || imported.get(norm(p.name));
    const fields = {
      email: p.email, phone: p.phone, photo: p.photo, profession_ar: p.profession_ar, profession_en: p.profession_en,
      title_ar: p.title_ar, title_en: p.title_en, specialty_ar: p.specialty_ar, specialty_en: p.specialty_en, bio_ar: p.bio_ar, bio_en: p.bio_en,
      staff_type: p.provider_type, organization: p.organization, license_no: p.license_no, contract_start: p.contract_start, contract_end: p.contract_end, contract_notes: p.contract_notes,
    };
    if (sid) {
      const cur = await Staff.byId(sid);
      const merged = { ...cur, roles: parseJSON(cur.roles_json, []) };
      for (const [k, v] of Object.entries(fields)) if (v != null && v !== '' && !merged[k]) merged[k] = v;
      if (p.profession_ar && !merged.roles.includes(p.profession_ar)) merged.roles.push(p.profession_ar);
      await Staff.update(sid, merged);
    } else {
      const r = await Staff.create({ name_ar: p.name, name_en: '', roles: p.profession_ar ? [p.profession_ar] : [], ...fields });
      sid = r.insertId; imported.set(norm(p.name), sid);
    }
    await Staff.setUser(sid, p.id);
  }

  // 3) control-panel users: link by exact e-mail only (names differ too much to guess)
  for (const a of admins) {
    const hit = await query('SELECT id FROM staff WHERE admin_id IS NULL AND email IS NOT NULL AND LOWER(email)=? AND deleted_at IS NULL LIMIT 1', [norm(a.email)]);
    if (hit[0]) await Staff.setAdmin(hit[0].id, a.id);
  }
  console.log(`[staff] imported ${imported.size ? [...new Set(imported.values())].length : 0} record(s) into the staff directory`);
}

const adminHash = (id) => query('SELECT password_hash FROM admins WHERE id=? LIMIT 1', [id]).then((r) => r[0]?.password_hash || null);
const userHash = (id) => query('SELECT password_hash FROM users WHERE id=? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0]?.password_hash || null);

// Sets one password for every login the person has (telemedicine + control panel).
export async function setStaffPassword(staffId, password, { actingAdminId, isSuper } = {}) {
  const st = await Staff.byId(staffId);
  if (!st) throw Object.assign(new Error('not_found'), { code: 'not_found' });
  if (!st.user_id && !st.admin_id) throw Object.assign(new Error('not_found'), { code: 'not_found' });
  if (!password || String(password).length < 6) throw Object.assign(new Error('weak_password'), { code: 'weak_password' });
  const hash = await bcrypt.hash(String(password), 10);
  const changed = [];
  if (st.user_id) { await Users.updatePassword(st.user_id, hash); changed.push('telemed'); }
  // a non-super admin may only change control-panel passwords of their own account
  if (st.admin_id && (isSuper || Number(st.admin_id) === Number(actingAdminId))) { await Admins.updatePassword(st.admin_id, hash); changed.push('admin'); }
  return { changed };
}

/* ---------------- Telemedicine access ---------------- */
// Creates (or links) the users.role='doctor' account + doctors row for a staff record.
export async function grantTelemed(staffId, { email, password, slot_minutes, is_published, availability, date_availability }) {
  const st = await Staff.byId(staffId);
  if (!st) throw Object.assign(new Error('not_found'), { code: 'not_found' });
  if (st.user_id) return { user_id: st.user_id, existed: true };
  const mail = norm(email || st.email);
  if (!mail) throw Object.assign(new Error('email_required'), { code: 'email_required' });
  let user = await Users.byEmail(mail);
  if (user && user.role !== 'doctor') throw Object.assign(new Error('email_taken'), { code: 'email_taken' });
  if (!user) {
    // One password for the person: when they already have a control-panel login
    // and no new password is given, reuse that login's password hash.
    let hash = null;
    if (!password && st.admin_id) hash = await adminHash(st.admin_id);
    if (!hash) {
      if (!password || String(password).length < 6) throw Object.assign(new Error('weak_password'), { code: 'weak_password' });
      hash = await bcrypt.hash(String(password), 10);
    }
    const any = await Users.byEmailAny(mail);
    if (any) await Users.releaseEmail(any.id);
    const r = await Users.create({ role: 'doctor', name: st.name_ar || st.name_en, email: mail, phone: st.phone }, hash);
    user = { id: r.insertId };
  }
  await Doctors.upsertProfile(user.id, { slot_minutes: slot_minutes || 20, is_published: is_published === 0 || is_published === false ? 0 : 1, sort_order: st.sort_order });
  if (Array.isArray(availability)) await Doctors.setAvailability(user.id, availability);
  if (Array.isArray(date_availability)) await Doctors.setDateAvailability(user.id, date_availability);
  await Staff.setUser(staffId, user.id);
  if (!st.email) await query('UPDATE staff SET email=? WHERE id=?', [mail, staffId]);
  return { user_id: user.id, existed: false };
}

// Removes the telemedicine account but keeps the person and their past consultations.
export async function revokeTelemed(staffId) {
  const st = await Staff.byId(staffId);
  if (!st || !st.user_id) return;
  await Doctors.removeAll(st.user_id);
  await Users.softDelete(st.user_id);
  await Staff.setUser(staffId, null);
}

/* ---------------- Control-panel access ---------------- */
export async function grantAdmin(staffId, { admin_id, email, password, permissions, is_super }) {
  const st = await Staff.byId(staffId);
  if (!st) throw Object.assign(new Error('not_found'), { code: 'not_found' });
  if (st.admin_id) return { admin_id: st.admin_id, existed: true };
  if (admin_id) {                                   // link an existing control-panel user
    const a = await Admins.byId(admin_id);
    if (!a) throw Object.assign(new Error('admin_not_found'), { code: 'admin_not_found' });
    if (await Staff.byAdmin(admin_id)) throw Object.assign(new Error('admin_linked'), { code: 'admin_linked' });
    await Staff.setAdmin(staffId, admin_id);
    return { admin_id, existed: true };
  }
  const mail = norm(email || st.email);
  if (!mail) throw Object.assign(new Error('email_required'), { code: 'email_required' });
  if (await Admins.byEmail(mail)) throw Object.assign(new Error('email_taken'), { code: 'email_taken' });
  let hash = null;
  if (!password && st.user_id) hash = await userHash(st.user_id);   // reuse the telemedicine password
  if (!hash) {
    if (!password || String(password).length < 6) throw Object.assign(new Error('weak_password'), { code: 'weak_password' });
    hash = await bcrypt.hash(String(password), 10);
  }
  const role = is_super ? 'super' : 'staff';
  const perms = is_super ? null : JSON.stringify(permissions || { pages: { dashboard: { view: true }, visits: { view: true }, telemed: { view: true } } });
  const r = await Admins.create(st.name_ar || st.name_en, mail, hash, role, perms);
  await Staff.setAdmin(staffId, r.insertId);
  if (!st.email) await query('UPDATE staff SET email=? WHERE id=?', [mail, staffId]);
  return { admin_id: r.insertId, existed: false };
}

// Unlinks (and optionally deletes) the control-panel user.
export async function revokeAdmin(staffId, { remove = false, actingAdminId } = {}) {
  const st = await Staff.byId(staffId);
  if (!st || !st.admin_id) return;
  if (remove && Number(st.admin_id) !== Number(actingAdminId) && (await Admins.count()) > 1) await Admins.remove(st.admin_id);
  await Staff.setAdmin(staffId, null);
}
