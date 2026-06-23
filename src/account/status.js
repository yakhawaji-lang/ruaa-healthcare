// Status labels + ordered tracking steps for the professional timeline.
export const STATUS = {
  pending:        { ar: 'تم الاستلام',       en: 'Received',        color: '#1f7d92' },
  submitted:      { ar: 'تم الاستلام',       en: 'Received',        color: '#1f7d92' },
  reviewing:      { ar: 'قيد المراجعة',      en: 'Under review',    color: '#e08a3c' },
  approved:       { ar: 'تم التواصل',        en: 'Contacted',       color: '#2e8b57' },
  scheduled:      { ar: 'تم جدولة الزيارة',  en: 'Visit scheduled', color: '#3b82f6' },
  visit_scheduled:{ ar: 'تم جدولة الزيارة',  en: 'Visit scheduled', color: '#3b82f6' },
  in_progress:    { ar: 'قيد التنفيذ',       en: 'In progress',     color: '#8b5cf6' },
  completed:      { ar: 'مكتمل',             en: 'Completed',       color: '#2e8b57' },
  cancelled:      { ar: 'ملغي',              en: 'Cancelled',       color: '#c0392b' },
  rejected:       { ar: 'مرفوض',             en: 'Rejected',        color: '#c0392b' },
};

export const REQUEST_FLOW = ['pending', 'reviewing', 'approved', 'scheduled', 'in_progress', 'completed'];
export const CASE_FLOW = ['submitted', 'reviewing', 'approved', 'visit_scheduled', 'in_progress', 'completed'];

// Client-facing wording overrides (visitor/insurance portals only). Admin keeps STATUS.
const CLIENT_OVERRIDE = {
  approved: { ar: 'تم التواصل', en: 'Contacted' },
};
export const statusLabel = (s, lang = 'ar', audience = 'admin') =>
  ((audience === 'client' && CLIENT_OVERRIDE[s]?.[lang]) || STATUS[s]?.[lang] || s || '');
export const statusColor = (s) => STATUS[s]?.color || '#5a6f7a';

// Admin-selectable status options per type.
export const REQUEST_STATUSES = ['pending', 'reviewing', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'];
export const CASE_STATUSES = ['submitted', 'reviewing', 'approved', 'visit_scheduled', 'in_progress', 'completed', 'rejected'];

// Visit (appointment) statuses
export const VISIT_STATUS = {
  scheduled: { ar: 'مجدولة', en: 'Scheduled', color: '#3b82f6' },
  completed: { ar: 'تمت', en: 'Completed', color: '#2e8b57' },
  cancelled: { ar: 'ملغاة', en: 'Cancelled', color: '#c0392b' },
};
export const VISIT_STATUSES = ['scheduled', 'completed', 'cancelled'];
export const visitStatusLabel = (s, lang = 'ar') => VISIT_STATUS[s]?.[lang] || VISIT_STATUS[s]?.ar || s || '';
export const visitStatusColor = (s) => VISIT_STATUS[s]?.color || '#5a6f7a';
export const CLINICIAN_ROLES = ['طبيب', 'ممرض/ة', 'أخصائي علاج طبيعي', 'أخصائي تغذية', 'أخصائي تنفسي', 'فني مختبر'];
export const VISIT_TYPES = ['زيارة منزلية', 'تقييم أولي', 'متابعة', 'إجراء طبي', 'سحب عينات'];

// Bilingual defaults for the admin-configurable lists.
export const VISIT_TYPES_BI = [
  { ar: 'زيارة منزلية', en: 'Home visit' },
  { ar: 'تقييم أولي', en: 'Initial assessment' },
  { ar: 'متابعة', en: 'Follow-up' },
  { ar: 'إجراء طبي', en: 'Medical procedure' },
  { ar: 'سحب عينات', en: 'Sample collection' },
];
export const CLINICIAN_ROLES_BI = [
  { ar: 'طبيب', en: 'Doctor' },
  { ar: 'ممرض/ة', en: 'Nurse' },
  { ar: 'أخصائي علاج طبيعي', en: 'Physiotherapist' },
  { ar: 'أخصائي تغذية', en: 'Dietitian' },
  { ar: 'أخصائي تنفسي', en: 'Respiratory therapist' },
  { ar: 'فني مختبر', en: 'Lab technician' },
];
// Normalizers: accept old string[] or new {ar,en}[] shapes.
export const normBiList = (arr, fb) => {
  if (!Array.isArray(arr) || arr.length === 0) return fb;
  return arr.map((x) => (typeof x === 'string' ? { ar: x, en: x } : { ar: x.ar || x.en || '', en: x.en || x.ar || '' })).filter((x) => x.ar || x.en);
};
export const normStaffList = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => (typeof s === 'string'
    ? { name_ar: s, name_en: s, roles: [] }
    : { name_ar: s.name_ar || s.name || '', name_en: s.name_en || s.name || '', roles: Array.isArray(s.roles) ? s.roles : [] }));
};
export const biLabel = (item, lang) => (lang === 'en' ? (item?.en || item?.ar) : (item?.ar || item?.en)) || '';

// Clean, Latin-numeral date/time formatting (avoids raw ISO timestamps).
export const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
export const fmtDateTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
