// Centralized data-access layer. All SQL lives here; routes call these helpers.
import { query, getPool } from './pool.js';

/* ---------------- Admins ---------------- */
export const Admins = {
  byEmail: (email) =>
    query('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]).then((r) => r[0] || null),
  byId: (id) =>
    query('SELECT id, name, email, role, permissions, is_active FROM admins WHERE id = ? LIMIT 1', [id]).then((r) => r[0] || null),
  create: (name, email, hash, role = 'admin', permissions = null) =>
    query('INSERT INTO admins (name, email, password_hash, role, permissions) VALUES (?,?,?,?,?)', [name, email, hash, role, permissions]),
  list: () =>
    query('SELECT id, name, email, role, permissions, is_active, created_at FROM admins ORDER BY created_at ASC'),
  updateInfo: (id, { name, email, role, permissions }) =>
    query('UPDATE admins SET name=?, email=?, role=?, permissions=? WHERE id=?', [name, email, role, permissions, id]),
  updatePassword: (id, hash) => query('UPDATE admins SET password_hash=? WHERE id=?', [hash, id]),
  setActive: (id, active) => query('UPDATE admins SET is_active=? WHERE id=?', [active ? 1 : 0, id]),
  remove: (id) => query('DELETE FROM admins WHERE id=?', [id]),
  count: () => query('SELECT COUNT(*) AS n FROM admins').then((r) => r[0].n),
};

// Is this admin a super admin (full access)? NULL permissions = legacy super.
export const isSuperAdmin = (a) => !!a && (a.role === 'super' || a.permissions == null);
export const parsePerms = (a) => { try { return a?.permissions ? JSON.parse(a.permissions) : null; } catch { return null; } };
export const ADMIN_PAGES = ['dashboard', 'requests', 'cases', 'visits', 'insurers', 'clients', 'hero', 'partners', 'services', 'pages', 'messages', 'settings'];

/* ---------------- Settings ---------------- */
export const Settings = {
  all: () => query('SELECT `key`, value_ar, value_en FROM settings'),
  asObject: async () => {
    const rows = await query('SELECT `key`, value_ar, value_en FROM settings');
    const out = {};
    for (const r of rows) out[r.key] = { ar: r.value_ar, en: r.value_en };
    return out;
  },
  upsert: (key, ar, en) =>
    query(
      'INSERT INTO settings (`key`, value_ar, value_en) VALUES (?,?,?) ' +
        'ON DUPLICATE KEY UPDATE value_ar = VALUES(value_ar), value_en = VALUES(value_en)',
      [key, ar, en]
    ),
};

/* ---------------- Pages ---------------- */
export const Pages = {
  listPublic: () =>
    query('SELECT slug, title_ar, title_en, content_json FROM pages WHERE deleted_at IS NULL AND is_published = 1 ORDER BY sort_order'),
  listAdmin: () =>
    query('SELECT id, slug, title_ar, title_en, is_published, sort_order, updated_at FROM pages WHERE deleted_at IS NULL ORDER BY sort_order'),
  bySlug: (slug) =>
    query('SELECT * FROM pages WHERE slug = ? AND deleted_at IS NULL LIMIT 1', [slug]).then((r) => r[0] || null),
  byId: (id) =>
    query('SELECT * FROM pages WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0] || null),
  update: (id, { title_ar, title_en, content_json, is_published }) =>
    query(
      'UPDATE pages SET title_ar=?, title_en=?, content_json=?, is_published=? WHERE id=?',
      [title_ar, title_en, content_json, is_published ? 1 : 0, id]
    ),
  upsertBySlug: (slug, title_ar, title_en, content_json, sort_order = 0) =>
    query(
      'INSERT INTO pages (slug, title_ar, title_en, content_json, sort_order) VALUES (?,?,?,?,?) ' +
        'ON DUPLICATE KEY UPDATE title_ar=VALUES(title_ar), title_en=VALUES(title_en), content_json=VALUES(content_json)',
      [slug, title_ar, title_en, content_json, sort_order]
    ),
};

/* ---------------- Services ---------------- */
export const Services = {
  listPublic: () =>
    query('SELECT slug, icon, image, price, price_note_ar, price_note_en, title_ar, title_en, body_ar, body_en FROM services WHERE deleted_at IS NULL AND is_published = 1 ORDER BY sort_order, id'),
  listPublicIds: () =>
    query('SELECT id, slug, icon, image, price, price_note_ar, price_note_en, title_ar, title_en, body_ar, body_en FROM services WHERE deleted_at IS NULL AND is_published = 1 ORDER BY sort_order, id'),
  listAdmin: () =>
    query('SELECT id, slug, icon, image, price, title_ar, title_en, is_published, sort_order, updated_at FROM services WHERE deleted_at IS NULL ORDER BY sort_order, id'),
  bySlug: (slug) =>
    query('SELECT * FROM services WHERE slug = ? AND deleted_at IS NULL LIMIT 1', [slug]).then((r) => r[0] || null),
  byId: (id) =>
    query('SELECT * FROM services WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0] || null),
  create: (s) =>
    query(
      'INSERT INTO services (slug, icon, image, price, price_note_ar, price_note_en, title_ar, title_en, body_ar, body_en, is_published, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [s.slug, s.icon, s.image || null, s.price ?? null, s.price_note_ar || null, s.price_note_en || null, s.title_ar, s.title_en, s.body_ar, s.body_en, s.is_published ? 1 : 0, s.sort_order || 0]
    ),
  update: (id, s) =>
    query(
      'UPDATE services SET slug=?, icon=?, image=?, price=?, price_note_ar=?, price_note_en=?, title_ar=?, title_en=?, body_ar=?, body_en=?, is_published=?, sort_order=? WHERE id=?',
      [s.slug, s.icon, s.image || null, s.price ?? null, s.price_note_ar || null, s.price_note_en || null, s.title_ar, s.title_en, s.body_ar, s.body_en, s.is_published ? 1 : 0, s.sort_order || 0, id]
    ),
  softDelete: (id) => query('UPDATE services SET deleted_at = NOW() WHERE id = ?', [id]),
};

/* ---------- Contracted services per insurance company ---------- */
export const InsurerServices = {
  list: (uid) => query('SELECT service_id FROM insurer_services WHERE user_id = ?', [uid]).then((r) => r.map((x) => x.service_id)),
  set: async (uid, ids) => {
    await query('DELETE FROM insurer_services WHERE user_id = ?', [uid]);
    const clean = Array.isArray(ids) ? [...new Set(ids.map(Number).filter((n) => n > 0))] : [];
    if (clean.length) {
      const placeholders = clean.map(() => '(?,?)').join(',');
      const params = [];
      clean.forEach((sid) => params.push(uid, sid));
      await query(`INSERT INTO insurer_services (user_id, service_id) VALUES ${placeholders}`, params);
    }
  },
};

/* ---------------- Users (visitors + insurance) ---------------- */
export const Users = {
  byEmail: (email) =>
    query('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1', [email]).then((r) => r[0] || null),
  byPhone: (phone) =>
    query("SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 1", [phone]).then((r) => r[0] || null),
  byId: (id) =>
    query('SELECT id, role, name, company_name, email, phone, is_active FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0] || null),
  create: (u, hash) =>
    query('INSERT INTO users (role, name, company_name, email, phone, password_hash) VALUES (?,?,?,?,?,?)',
      [u.role || 'visitor', u.name, u.company_name || null, u.email, u.phone || null, hash]),
  listByRole: (role) =>
    query('SELECT id, role, name, company_name, email, phone, is_active, created_at FROM users WHERE role = ? AND deleted_at IS NULL ORDER BY created_at DESC', [role]),
  setActive: (id, active) => query('UPDATE users SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]),
  updateAccount: (id, f) => query('UPDATE users SET name=?, email=?, phone=? WHERE id=?', [f.name, f.email, f.phone || null, id]),
  updateInsurer: (id, f) => query('UPDATE users SET company_name=?, name=?, email=?, phone=? WHERE id=?', [f.company_name || null, f.name, f.email, f.phone || null, id]),
  updatePassword: (id, hash) => query('UPDATE users SET password_hash=? WHERE id=?', [hash, id]),
  softDelete: (id) => query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]),
};

/* ---------------- Service requests (visitors) ---------------- */
export const ServiceRequests = {
  create: (r) =>
    query('INSERT INTO service_requests (ref, user_id, service_id, service_title, price, status, patient_name, phone, city, preferred_date, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [r.ref, r.user_id, r.service_id || null, r.service_title || null, r.price ?? null, r.status || 'pending', r.patient_name || null, r.phone || null, r.city || null, r.preferred_date || null, r.notes || null]),
  listByUser: (uid) => query('SELECT * FROM service_requests WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [uid]),
  listAll: () =>
    query(`SELECT sr.*, u.name AS user_name, u.email AS user_email FROM service_requests sr JOIN users u ON u.id = sr.user_id WHERE sr.deleted_at IS NULL ORDER BY sr.created_at DESC`),
  byId: (id) => query('SELECT * FROM service_requests WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0] || null),
  byIdForUser: (id, uid) => query('SELECT * FROM service_requests WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1', [id, uid]).then((r) => r[0] || null),
  update: (id, f) => query('UPDATE service_requests SET status=?, price=? WHERE id=?', [f.status, f.price ?? null, id]),
  softDelete: (id) => query('UPDATE service_requests SET deleted_at = NOW() WHERE id=?', [id]),
  count: () => query('SELECT COUNT(*) AS n FROM service_requests WHERE deleted_at IS NULL').then((r) => r[0].n),
  pending: () => query("SELECT COUNT(*) AS n FROM service_requests WHERE deleted_at IS NULL AND status IN ('pending','reviewing')").then((r) => r[0].n),
};

/* ---------------- Insurance cases ---------------- */
export const InsuranceCases = {
  create: (c) =>
    query('INSERT INTO insurance_cases (ref, user_id, hospital_name, patient_name, national_id, mobile, city, dob, diagnosis, requested_service, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [c.ref, c.user_id, c.hospital_name || null, c.patient_name, c.national_id || null, c.mobile || null, c.city || null, c.dob || null, c.diagnosis || null, c.requested_service || null, c.status || 'submitted']),
  listByUser: (uid) => query('SELECT * FROM insurance_cases WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [uid]),
  listAll: () =>
    query(`SELECT ic.*, u.company_name, u.name AS user_name FROM insurance_cases ic JOIN users u ON u.id = ic.user_id WHERE ic.deleted_at IS NULL ORDER BY ic.created_at DESC`),
  byId: (id) => query('SELECT * FROM insurance_cases WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0] || null),
  byIdForUser: (id, uid) => query('SELECT * FROM insurance_cases WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1', [id, uid]).then((r) => r[0] || null),
  update: (id, f) => query('UPDATE insurance_cases SET status=? WHERE id=?', [f.status, id]),
  updateFields: (id, f) => query(
    'UPDATE insurance_cases SET hospital_name=?, patient_name=?, national_id=?, mobile=?, city=?, dob=?, diagnosis=?, requested_service=? WHERE id=?',
    [f.hospital_name || null, f.patient_name, f.national_id || null, f.mobile || null, f.city || null, f.dob || null, f.diagnosis || null, f.requested_service || null, id]),
  setPatientUser: (id, uid) => query('UPDATE insurance_cases SET patient_user_id=? WHERE id=?', [uid, id]),
  softDelete: (id) => query('UPDATE insurance_cases SET deleted_at = NOW() WHERE id=?', [id]),
  count: () => query('SELECT COUNT(*) AS n FROM insurance_cases WHERE deleted_at IS NULL').then((r) => r[0].n),
  pending: () => query("SELECT COUNT(*) AS n FROM insurance_cases WHERE deleted_at IS NULL AND status IN ('submitted','reviewing')").then((r) => r[0].n),
};

/* ---------------- Tracking events ---------------- */
export const RequestEvents = {
  add: (e) => query('INSERT INTO request_events (ref_type, ref_id, status, title_ar, note, actor) VALUES (?,?,?,?,?,?)',
    [e.ref_type, e.ref_id, e.status || null, e.title_ar || null, e.note || null, e.actor || 'النظام']),
  list: (refType, refId) => query('SELECT * FROM request_events WHERE ref_type = ? AND ref_id = ? ORDER BY created_at ASC, id ASC', [refType, refId]),
  removeByRef: (refType, refId) => query('DELETE FROM request_events WHERE ref_type=? AND ref_id=?', [refType, refId]),
};

/* ---------------- Messages ---------------- */
export const Messages = {
  create: (m) =>
    query(
      'INSERT INTO messages (kind, name, phone, email, service, body, lang) VALUES (?,?,?,?,?,?,?)',
      [m.kind || 'contact', m.name, m.phone || null, m.email || null, m.service || null, m.body || null, m.lang || 'ar']
    ),
  list: () =>
    query('SELECT * FROM messages WHERE deleted_at IS NULL ORDER BY created_at DESC'),
  unreadCount: () =>
    query('SELECT COUNT(*) AS n FROM messages WHERE deleted_at IS NULL AND is_read = 0').then((r) => r[0].n),
  markRead: (id, read = 1) => query('UPDATE messages SET is_read = ? WHERE id = ?', [read ? 1 : 0, id]),
  softDelete: (id) => query('UPDATE messages SET deleted_at = NOW() WHERE id = ?', [id]),
};

/* ---------------- Hero slides ---------------- */
const SLIDE_COLS = 'id, image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, is_published, sort_order';
export const HeroSlides = {
  listPublic: () =>
    query(`SELECT ${SLIDE_COLS} FROM hero_slides WHERE deleted_at IS NULL AND is_published = 1 ORDER BY sort_order, id`),
  listAdmin: () =>
    query(`SELECT ${SLIDE_COLS}, updated_at FROM hero_slides WHERE deleted_at IS NULL ORDER BY sort_order, id`),
  byId: (id) =>
    query('SELECT * FROM hero_slides WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0] || null),
  create: (s) =>
    query(
      'INSERT INTO hero_slides (image, title_ar, title_en, subtitle_ar, subtitle_en, badge_ar, badge_en, is_published, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
      [s.image || null, s.title_ar, s.title_en, s.subtitle_ar, s.subtitle_en, s.badge_ar, s.badge_en, s.is_published ? 1 : 0, s.sort_order || 0]
    ),
  update: (id, s) =>
    query(
      'UPDATE hero_slides SET image=?, title_ar=?, title_en=?, subtitle_ar=?, subtitle_en=?, badge_ar=?, badge_en=?, is_published=?, sort_order=? WHERE id=?',
      [s.image || null, s.title_ar, s.title_en, s.subtitle_ar, s.subtitle_en, s.badge_ar, s.badge_en, s.is_published ? 1 : 0, s.sort_order || 0, id]
    ),
  softDelete: (id) => query('UPDATE hero_slides SET deleted_at = NOW() WHERE id = ?', [id]),
  count: () => query('SELECT COUNT(*) AS n FROM hero_slides WHERE deleted_at IS NULL').then((r) => r[0].n),
};

/* ---------------- Partners (insurance companies) ---------------- */
const PARTNER_COLS = 'id, name_ar, name_en, logo, url, is_published, sort_order';
export const Partners = {
  listPublic: () => query(`SELECT ${PARTNER_COLS} FROM partners WHERE deleted_at IS NULL AND is_published = 1 ORDER BY sort_order, id`),
  listAdmin: () => query(`SELECT ${PARTNER_COLS}, created_at FROM partners WHERE deleted_at IS NULL ORDER BY sort_order, id`),
  byId: (id) => query('SELECT * FROM partners WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]).then((r) => r[0] || null),
  create: (p) => query('INSERT INTO partners (name_ar, name_en, logo, url, is_published, sort_order) VALUES (?,?,?,?,?,?)',
    [p.name_ar || null, p.name_en || null, p.logo, p.url || null, p.is_published ? 1 : 0, p.sort_order || 0]),
  update: (id, p) => query('UPDATE partners SET name_ar=?, name_en=?, logo=?, url=?, is_published=?, sort_order=? WHERE id=?',
    [p.name_ar || null, p.name_en || null, p.logo, p.url || null, p.is_published ? 1 : 0, p.sort_order || 0, id]),
  softDelete: (id) => query('UPDATE partners SET deleted_at = NOW() WHERE id = ?', [id]),
  count: () => query('SELECT COUNT(*) AS n FROM partners WHERE deleted_at IS NULL').then((r) => r[0].n),
};

/* ---------------- Patient medical profile ---------------- */
const PROFILE_FIELDS = ['gender', 'dob', 'blood_type', 'address', 'latitude', 'longitude', 'chronic_conditions', 'allergies', 'medications', 'emergency_name', 'emergency_phone'];
export const Patients = {
  get: (userId) => query('SELECT * FROM patient_profiles WHERE user_id = ? LIMIT 1', [userId]).then((r) => r[0] || null),
  upsert: (userId, p) => {
    const vals = PROFILE_FIELDS.map((f) => p[f] ?? null);
    const updates = PROFILE_FIELDS.map((f) => `${f}=VALUES(${f})`).join(', ');
    return query(
      `INSERT INTO patient_profiles (user_id, ${PROFILE_FIELDS.join(', ')}) VALUES (?, ${PROFILE_FIELDS.map(() => '?').join(', ')}) ON DUPLICATE KEY UPDATE ${updates}`,
      [userId, ...vals]
    );
  },
};

/* ---------------- Visits / appointments ---------------- */
export const Visits = {
  create: (v) =>
    query('INSERT INTO visits (user_id, ref_type, ref_id, visit_date, visit_time, clinician_name, clinician_role, visit_type, status, notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [v.user_id || null, v.ref_type, v.ref_id, v.visit_date || null, v.visit_time || null, v.clinician_name || null, v.clinician_role || null, v.visit_type || null, v.status || 'scheduled', v.notes || null]),
  byRef: (refType, refId) => query('SELECT * FROM visits WHERE ref_type = ? AND ref_id = ? ORDER BY visit_date, visit_time, id', [refType, refId]),
  listAll: () => query(`
    SELECT v.*,
      COALESCE(sr.patient_name, ic.patient_name) AS patient_name,
      COALESCE(sr.ref, ic.ref) AS ref,
      COALESCE(sr.service_title, ic.requested_service) AS subject,
      u.company_name AS company_name
    FROM visits v
    LEFT JOIN service_requests sr ON v.ref_type = 'service_request' AND v.ref_id = sr.id
    LEFT JOIN insurance_cases  ic ON v.ref_type = 'insurance_case'  AND v.ref_id = ic.id
    LEFT JOIN users u ON ic.user_id = u.id
    ORDER BY v.visit_date, v.visit_time, v.id`),
  byUser: (userId) => query('SELECT * FROM visits WHERE user_id = ? ORDER BY visit_date DESC, id DESC', [userId]),
  byInsurer: (uid) => query(`
    SELECT v.*, ic.patient_name AS patient_name, ic.ref AS ref
    FROM visits v
    JOIN insurance_cases ic ON v.ref_type = 'insurance_case' AND v.ref_id = ic.id
    WHERE ic.user_id = ? AND ic.deleted_at IS NULL
    ORDER BY v.visit_date, v.visit_time, v.id`, [uid]),
  byId: (id) => query('SELECT * FROM visits WHERE id = ? LIMIT 1', [id]).then((r) => r[0] || null),
  update: (id, v) => query('UPDATE visits SET visit_date=?, visit_time=?, clinician_name=?, clinician_role=?, visit_type=?, status=?, notes=? WHERE id=?',
    [v.visit_date || null, v.visit_time || null, v.clinician_name || null, v.clinician_role || null, v.visit_type || null, v.status || 'scheduled', v.notes || null, id]),
  remove: (id) => query('DELETE FROM visits WHERE id = ?', [id]),
  removeByRef: (refType, refId) => query('DELETE FROM visits WHERE ref_type=? AND ref_id=?', [refType, refId]),
  upcomingCount: () => query("SELECT COUNT(*) AS n FROM visits WHERE status='scheduled' AND visit_date >= CURDATE()").then((r) => r[0].n),
};

/* ---------------- Correspondence thread ---------------- */
export const Threads = {
  list: (refType, refId) =>
    query('SELECT id, ref_type, ref_id, sender_role, sender_name, body, attachment_url, attachment_name, created_at FROM messages_thread WHERE ref_type=? AND ref_id=? ORDER BY created_at, id', [refType, refId]),
  add: (m) =>
    query('INSERT INTO messages_thread (ref_type, ref_id, sender_role, sender_name, body, attachment_url, attachment_name, read_by_admin, read_by_user) VALUES (?,?,?,?,?,?,?,?,?)',
      [m.ref_type, m.ref_id, m.sender_role, m.sender_name || null, m.body || null, m.attachment_url || null, m.attachment_name || null, m.sender_role === 'admin' ? 1 : 0, m.sender_role === 'user' ? 1 : 0]),
  removeByRef: (refType, refId) => query('DELETE FROM messages_thread WHERE ref_type=? AND ref_id=?', [refType, refId]),
  markReadByAdmin: (refType, refId) =>
    query("UPDATE messages_thread SET read_by_admin=1 WHERE ref_type=? AND ref_id=? AND sender_role='user'", [refType, refId]),
  markReadByUser: (refType, refId) =>
    query("UPDATE messages_thread SET read_by_user=1 WHERE ref_type=? AND ref_id=? AND sender_role='admin'", [refType, refId]),
  unreadForAdmin: () =>
    query("SELECT COUNT(*) AS n FROM messages_thread WHERE sender_role='user' AND read_by_admin=0").then((r) => r[0].n),
  // aggregated, read-only feed of all correspondence for an account, labeled with the patient/case
  feedForCases: (userId) =>
    query(`SELECT m.id, m.sender_role, m.sender_name, m.body, m.attachment_url, m.attachment_name, m.created_at,
              ic.id AS case_id, ic.patient_name AS subject, ic.ref AS ref
            FROM messages_thread m JOIN insurance_cases ic ON m.ref_type='insurance_case' AND m.ref_id=ic.id
            WHERE ic.user_id=? AND ic.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 60`, [userId]),
  feedForRequests: (userId) =>
    query(`SELECT m.id, m.sender_role, m.sender_name, m.body, m.attachment_url, m.attachment_name, m.created_at,
              sr.id AS req_id, sr.service_title AS subject, sr.ref AS ref
            FROM messages_thread m JOIN service_requests sr ON m.ref_type='service_request' AND m.ref_id=sr.id
            WHERE sr.user_id=? AND sr.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 60`, [userId]),
};

/* ---------------- Attachments ---------------- */
export const Attachments = {
  byRef: (refType, refId) =>
    query('SELECT id, url, name, created_at FROM attachments WHERE ref_type=? AND ref_id=? ORDER BY id', [refType, refId]),
  addMany: async (refType, refId, list = []) => {
    for (const a of list) {
      if (a?.url) await query('INSERT INTO attachments (ref_type, ref_id, url, name) VALUES (?,?,?,?)', [refType, refId, a.url, a.name || null]);
    }
  },
  removeByRef: (refType, refId) => query('DELETE FROM attachments WHERE ref_type=? AND ref_id=?', [refType, refId]),
};

/* ---------------- Notifications ---------------- */
export const Notifications = {
  add: (n) =>
    query('INSERT INTO notifications (recipient_type, recipient_id, type, title, body, link) VALUES (?,?,?,?,?,?)',
      [n.recipient_type, n.recipient_id ?? null, n.type, n.title, n.body || null, n.link || null]).catch(() => {}),
  notifyAdmin: (type, title, body, link) =>
    query('INSERT INTO notifications (recipient_type, type, title, body, link) VALUES (?,?,?,?,?)', ['admin', type, title, body || null, link || null]).catch(() => {}),
  notifyUser: (uid, type, title, body, link) =>
    query('INSERT INTO notifications (recipient_type, recipient_id, type, title, body, link) VALUES (?,?,?,?,?,?)', ['user', uid, type, title, body || null, link || null]).catch(() => {}),
  forAdmin: () => query("SELECT * FROM notifications WHERE recipient_type='admin' ORDER BY created_at DESC, id DESC LIMIT 40"),
  forUser: (uid) => query("SELECT * FROM notifications WHERE recipient_type='user' AND recipient_id=? ORDER BY created_at DESC, id DESC LIMIT 40", [uid]),
  unreadAdmin: () => query("SELECT COUNT(*) AS n FROM notifications WHERE recipient_type='admin' AND is_read=0").then((r) => r[0].n),
  unreadUser: (uid) => query("SELECT COUNT(*) AS n FROM notifications WHERE recipient_type='user' AND recipient_id=? AND is_read=0", [uid]).then((r) => r[0].n),
  readAdmin: (id) => id ? query("UPDATE notifications SET is_read=1 WHERE id=? AND recipient_type='admin'", [id]) : query("UPDATE notifications SET is_read=1 WHERE recipient_type='admin'"),
  readUser: (uid, id) => id ? query('UPDATE notifications SET is_read=1 WHERE id=? AND recipient_id=?', [id, uid]) : query("UPDATE notifications SET is_read=1 WHERE recipient_type='user' AND recipient_id=?", [uid]),
  dismissAdmin: (id) => query("DELETE FROM notifications WHERE id=? AND recipient_type='admin'", [id]),
  dismissUser: (uid, id) => query("DELETE FROM notifications WHERE id=? AND recipient_type='user' AND recipient_id=?", [id, uid]),
  clearAdmin: () => query("DELETE FROM notifications WHERE recipient_type='admin'"),
  clearUser: (uid) => query("DELETE FROM notifications WHERE recipient_type='user' AND recipient_id=?", [uid]),
};

/* ---------------- Analytics ---------------- */
export const Analytics = {
  groupByStatus: (table, where) =>
    query(`SELECT status AS k, COUNT(*) AS n FROM ${table} WHERE ${where} GROUP BY status`),
  monthly: (table, where) =>
    query(`SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS n FROM ${table} WHERE ${where} GROUP BY ym ORDER BY ym DESC LIMIT 6`),
};

/* ---------------- Audit ---------------- */
export const Audit = {
  log: (adminId, action, entity, entityId) =>
    query('INSERT INTO audit_log (admin_id, action, entity, entity_id) VALUES (?,?,?,?)', [
      adminId || null, action, entity, entityId ? String(entityId) : null,
    ]).catch(() => {}),
};

export { getPool };
