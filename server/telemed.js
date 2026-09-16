// Telemedicine helpers shared by the account / doctor / admin routers:
// local-time handling (Asia/Riyadh), free-slot generation, Jitsi room naming
// and join credentials (public meet.jit.si, a self-hosted Jitsi, or 8x8 JaaS).
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Doctors, Consultations, Settings, RequestEvents, Notifications } from './db/queries.js';

export const TZ = process.env.TELEMED_TZ || 'Asia/Riyadh';
const pad = (n) => String(n).padStart(2, '0');

/* ---------------- Local time (wall-clock in TZ, as text) ---------------- */
// Returns { date:'YYYY-MM-DD', time:'HH:MM', str:'YYYY-MM-DD HH:MM', weekday:0-6, ms }
export function nowLocal(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' })
      .formatToParts(d).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  const hour = parts.hour === '24' ? '00' : parts.hour;
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${hour}:${parts.minute}`;
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { date, time, str: `${date} ${time}`, weekday, ms: d.getTime() };
}
export const nowStr = () => nowLocal().str + ':00';

// weekday (0=Sun) of a 'YYYY-MM-DD' date, independent of server timezone
export const weekdayOf = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();
export const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
export const isLocalDateTime = (s) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(String(s || ''));
export const normDateTime = (s) => (isLocalDateTime(s) ? String(s).slice(0, 16) : null); // 'YYYY-MM-DD HH:MM'

const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const toTime = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
// minutes between two 'YYYY-MM-DD HH:MM' local strings (b - a)
export function diffMinutes(a, b) {
  const p = (s) => { const [d, t] = s.split(' '); const [y, mo, da] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number); return Date.UTC(y, mo - 1, da, h, mi); };
  return Math.round((p(b) - p(a)) / 60000);
}

/* ---------------- Free slots ---------------- */
// Cuts the doctor's availability rules for `date` into slots of slot_minutes,
// removing booked starts, days off and (for today) slots starting too soon.
export async function freeSlots(doctorId, date, { minLeadMinutes = 30 } = {}) {
  if (!isIsoDate(date)) return [];
  const doc = await Doctors.byId(doctorId);
  if (!doc || !doc.is_active) return [];
  if (await Doctors.isDayOff(doctorId, date)) return [];
  // weekly rules for that weekday + any date-specific extra hours on that exact date
  const rules = [
    ...(await Doctors.availability(doctorId)).filter((r) => Number(r.weekday) === weekdayOf(date)),
    ...(await Doctors.dateAvailabilityOn(doctorId, date).catch(() => [])),
  ];
  if (!rules.length) return [];
  const step = Math.max(5, Number(doc.slot_minutes) || 20);
  const booked = new Set((await Consultations.bookedOn(doctorId, date)).map((b) => b.t));
  const now = nowLocal(minLeadMinutes);
  const out = [];
  for (const r of rules) {
    for (let m = toMin(r.start_time); m + step <= toMin(r.end_time); m += step) {
      const t = toTime(m);
      if (booked.has(t)) continue;
      if (date < now.date || (date === now.date && t <= now.time)) continue;
      out.push(t);
    }
  }
  return [...new Set(out)].sort();
}

// Is a doctor free at 'YYYY-MM-DD HH:MM' (rule-wise + not booked)? Used for admin
// scheduling too, where the admin may still force a time outside the rules.
export async function slotStatus(doctorId, at, excludeId = null) {
  const [date, time] = at.split(' ');
  const taken = await Consultations.isSlotTaken(doctorId, at + ':00', excludeId);
  if (taken) return 'taken';
  const rules = [
    ...(await Doctors.availability(doctorId)).filter((r) => Number(r.weekday) === weekdayOf(date)),
    ...(await Doctors.dateAvailabilityOn(doctorId, date).catch(() => [])),
  ];
  const inRule = rules.some((r) => time >= r.start_time && time < r.end_time);
  const off = await Doctors.isDayOff(doctorId, date);
  return inRule && !off ? 'free' : 'outside';
}

/* ---------------- Rooms + join credentials ---------------- */
export const newRoomName = (id) => `rumd-tm-${id}-${crypto.randomBytes(6).toString('hex')}`;
export const refCode = (id) => `TM-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;

// Join window: from 15 min before the start until 3 h after (or while in progress).
export function joinWindow(c) {
  if (!c) return { ok: false, reason: 'not_found' };
  if (c.status === 'in_progress') return { ok: true };
  if (c.status !== 'scheduled' || !c.scheduled_at) return { ok: false, reason: 'not_scheduled' };
  const mins = diffMinutes(nowLocal().str, c.scheduled_at); // minutes until start
  if (mins > 15) return { ok: false, reason: 'too_early', minutes: mins };
  if (mins < -180) return { ok: false, reason: 'expired' };
  return { ok: true };
}

async function jitsiDomain() {
  const s = await Settings.asObject();
  const d = (s.jitsi_domain?.ar || s.jitsi_domain?.en || process.env.JITSI_DOMAIN || 'meet.jit.si').trim();
  return d.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// Builds what the browser needs to open the room. With JaaS (8x8.vc) env vars a
// signed JWT is produced so nobody has to "log in as moderator" on meet.jit.si.
export async function joinInfo(c, { name, role, email, avatar } = {}) {
  const appId = process.env.JAAS_APP_ID;
  const keyId = process.env.JAAS_KEY_ID;
  const pk = (process.env.JAAS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const moderator = role === 'doctor' || role === 'admin';
  const base = { id: c.id, ref: c.ref, mode: c.mode, displayName: name || 'RU-MD', moderator, subject: `RU-MD ${c.ref}` };
  if (appId && keyId && pk) {
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({
      aud: 'jitsi', iss: 'chat', sub: appId, room: '*', exp: now + 3 * 3600, nbf: now - 10,
      context: {
        user: { id: `${role}-${c.id}`, name: name || 'RU-MD', email: email || undefined, avatar: avatar || undefined, moderator: moderator ? 'true' : 'false' },
        features: { livestreaming: 'false', recording: moderator ? 'true' : 'false', transcription: 'false', 'outbound-call': 'false' },
      },
    }, pk, { algorithm: 'RS256', header: { kid: keyId, typ: 'JWT' } });
    return { ...base, provider: 'jaas', domain: '8x8.vc', room: `${appId}/${c.room}`, jwt: token };
  }
  return { ...base, provider: 'jitsi', domain: await jitsiDomain(), room: c.room };
}

/* ---------------- Status labels + timeline helpers ---------------- */
export const CONS_STATUS_AR = {
  pending: 'بانتظار الجدولة', scheduled: 'تم تحديد الموعد', in_progress: 'الاستشارة جارية',
  completed: 'اكتملت الاستشارة', cancelled: 'تم إلغاء الاستشارة', no_show: 'لم يحضر المريض',
};
export const consStatusLabel = (s) => CONS_STATUS_AR[s] || s || 'تحديث';
export const modeLabelAr = (m) => (m === 'audio' ? 'مكالمة صوتية' : 'مكالمة فيديو');
export const fmtAt = (at) => (at ? String(at).slice(0, 16) : '');

export const addEvent = (id, status, title_ar, note, actor = 'النظام') =>
  RequestEvents.add({ ref_type: 'consultation', ref_id: id, status, title_ar, note, actor });

// Notify patient + doctor (+ admin) consistently.
export async function notifyParties(c, { patient, doctor, admin }) {
  if (patient && c.user_id) await Notifications.notifyUser(c.user_id, 'telemed', patient.title, patient.body, `/portal/consultations/${c.id}`);
  if (doctor && c.doctor_user_id) await Notifications.notifyUser(c.doctor_user_id, 'telemed', doctor.title, doctor.body, `/portal/consultations/${c.id}`);
  if (admin) await Notifications.notifyAdmin('telemed', admin.title, admin.body, `/admin/telemed?open=${c.id}`);
}

// Shared "book / schedule" core used by the patient (self) and the admin.
export async function createConsultation({ user_id, doctor_user_id, scheduled_at, mode, complaint, patient_name, phone, preferred_note, price, source = 'self', duration_min }) {
  const at = normDateTime(scheduled_at);
  let status = 'pending';
  let doc = null;
  if (doctor_user_id) {
    doc = await Doctors.byId(doctor_user_id);
    if (!doc) throw Object.assign(new Error('doctor_not_found'), { code: 'doctor_not_found' });
  }
  if (at && doc) {
    const st = await slotStatus(doc.id, at);
    if (st === 'taken') throw Object.assign(new Error('slot_taken'), { code: 'slot_taken' });
    if (st === 'outside' && source !== 'admin') throw Object.assign(new Error('slot_unavailable'), { code: 'slot_unavailable' });
    status = 'scheduled';
  }
  const r = await Consultations.create({
    ref: 'TMP-' + Date.now() + Math.floor(Math.random() * 1000),
    user_id, doctor_user_id: doc?.id || null, mode, source, status,
    scheduled_at: at ? at + ':00' : null,
    duration_min: duration_min || doc?.slot_minutes || 20,
    patient_name, phone, complaint, preferred_note, price,
  });
  const id = r.insertId;
  const ref = refCode(id);
  await Consultations.setRef(id, ref);
  await Consultations.setRoom(id, newRoomName(id));
  await addEvent(id, 'pending', 'تم استلام طلب الاستشارة', `${modeLabelAr(mode)}${complaint ? ' — ' + String(complaint).slice(0, 120) : ''}`, source === 'admin' ? 'الإدارة' : 'النظام');
  if (status === 'scheduled') {
    await addEvent(id, 'scheduled', 'تم تحديد موعد الاستشارة', `${doc.name} — ${at}`, source === 'admin' ? 'الإدارة' : 'النظام');
  }
  const c = await Consultations.byId(id);
  return c;
}
