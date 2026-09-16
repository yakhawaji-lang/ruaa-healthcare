// Telemedicine (video / voice consultation) statuses, flow and small helpers
// shared by the patient portal, the doctor portal and the admin manager.
export const CONS_STATUS = {
  pending:     { ar: 'بانتظار الجدولة',   en: 'Awaiting scheduling', color: '#e08a3c' },
  scheduled:   { ar: 'تم تحديد الموعد',   en: 'Scheduled',           color: '#3b82f6' },
  in_progress: { ar: 'الاستشارة جارية',   en: 'In progress',         color: '#8b5cf6' },
  completed:   { ar: 'اكتملت',            en: 'Completed',           color: '#2e8b57' },
  cancelled:   { ar: 'ملغاة',             en: 'Cancelled',           color: '#c0392b' },
  no_show:     { ar: 'لم يحضر المريض',    en: 'No-show',             color: '#7a8a93' },
};
export const CONS_FLOW = ['pending', 'scheduled', 'in_progress', 'completed'];
export const CONS_STATUSES = Object.keys(CONS_STATUS);
export const consLabel = (s, lang = 'ar') => CONS_STATUS[s]?.[lang] || CONS_STATUS[s]?.ar || s || '';
export const consColor = (s) => CONS_STATUS[s]?.color || '#5a6f7a';
export const isClosed = (s) => ['completed', 'cancelled', 'no_show'].includes(s);

export const MODES = {
  video: { ar: 'مكالمة فيديو', en: 'Video call' },
  audio: { ar: 'مكالمة صوتية', en: 'Voice call' },
};
export const modeLabel = (m, lang = 'ar') => MODES[m]?.[lang] || MODES.video[lang];

export const WEEKDAYS = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
export const WEEKDAYS_SHORT = {
  ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

// Doctor display name with title (د. / Dr.)
export const doctorName = (c, lang = 'ar') => {
  const name = c?.doctor_name || c?.name || '';
  if (!name) return '';
  const title = lang === 'en' ? (c.doctor_title_en || c.title_en) : (c.doctor_title_ar || c.title_ar);
  return title ? `${title} ${name}` : (lang === 'en' ? `Dr. ${name}` : `د. ${name}`);
};
export const doctorSpecialty = (c, lang = 'ar') =>
  (lang === 'en' ? (c?.doctor_specialty_en || c?.specialty_en || c?.doctor_specialty_ar || c?.specialty_ar)
    : (c?.doctor_specialty_ar || c?.specialty_ar || c?.doctor_specialty_en || c?.specialty_en)) || '';

// 'YYYY-MM-DD HH:MM' (local wall-clock) → readable pieces, Latin numerals.
export const splitAt = (at) => {
  if (!at) return { date: '', time: '' };
  const [date, time] = String(at).slice(0, 16).split(' ');
  return { date, time: time || '' };
};
export const fmtAtDate = (at, lang = 'ar') => {
  const { date } = splitAt(at);
  if (!date) return '';
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-latn', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};
export const fmtTime12 = (t, lang = 'ar') => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? (lang === 'en' ? 'PM' : 'م') : (lang === 'en' ? 'AM' : 'ص');
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
};
export const fmtAt = (at, lang = 'ar') => {
  const { date, time } = splitAt(at);
  if (!date) return '';
  const d = new Date(`${date}T12:00:00`);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${fmtTime12(time, lang)}`;
};

// Local "now" as 'YYYY-MM-DD HH:MM' in the browser's clock (used for grouping only).
export const nowLocalStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Minutes from now until `at` (negative = in the past) using the browser clock.
export const minutesUntil = (at) => {
  const { date, time } = splitAt(at);
  if (!date) return null;
  return Math.round((new Date(`${date}T${time || '00:00'}:00`).getTime() - Date.now()) / 60000);
};
// Same rule as the server: 15 min before → 3 h after, or while in progress.
export const canJoinNow = (c) => {
  if (!c) return false;
  if (c.status === 'in_progress') return true;
  if (c.status !== 'scheduled') return false;
  const m = minutesUntil(c.scheduled_at);
  return m !== null && m <= 15 && m >= -180;
};
