// Ready-to-send WhatsApp texts for cases, service requests and visits.
// Phone numbers and IDs go on their own lines so they copy with one tap.

const AR = '٠١٢٣٤٥٦٧٨٩';
const latin = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
const need = (d) => (d.startsWith('00966') ? 14 : d.startsWith('966') ? 12 : d.startsWith('5') ? 9 : 10);
const normPhone = (d) => (d.startsWith('00966') ? '0' + d.slice(5) : d.startsWith('966') ? '0' + d.slice(3) : d.length === 9 && d.startsWith('5') ? '0' + d : d);

// every phone number inside a free-text field ("0533888187-----0533888178")
export function phonesIn(v) {
  const out = [];
  let cur = '';
  for (const t of latin(v).split(/[^\d+]+/)) {
    const d = t.replace(/\D/g, '');
    if (!d) continue;
    if (cur && cur.length < need(cur)) cur += d;
    else { if (cur) out.push(normPhone(cur)); cur = d; }
  }
  if (cur) out.push(normPhone(cur));
  return out.length ? out : (String(v || '').trim() ? [String(v).trim()] : []);
}

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');
const line = (label, value) => (value ? `${label}: ${value}` : null);
const join = (arr) => arr.filter((x) => x != null).join('\n');

const L = {
  ar: {
    case: 'حالة', request: 'طلب خدمة', visit: 'زيارة منزلية', insurer: 'شركة التأمين', referred_by: 'المحوِّل', coordinator: 'المنسّق',
    hospital: 'المستشفى', patient: 'المريض', nid: 'رقم الهوية', mobile: 'الجوال', mobile_n: (i) => `جوال ${i}`, city: 'المدينة',
    dob: 'تاريخ الميلاد', service: 'الخدمة المطلوبة', diagnosis: 'التشخيص', link: 'رابط الحالة', req_link: 'رابط الطلب',
    preferred: 'التاريخ المفضّل', date: 'التاريخ', time: 'الوقت', type: 'نوع الزيارة', clinician: 'الكادر', address: 'العنوان', map: 'الموقع على الخريطة', notes: 'ملاحظات', ref: 'المرجع',
  },
  en: {
    case: 'Case', request: 'Service request', visit: 'Home visit', insurer: 'Insurance company', referred_by: 'Referred by', coordinator: 'Coordinator',
    hospital: 'Hospital', patient: 'Patient', nid: 'National ID', mobile: 'Mobile', mobile_n: (i) => `Mobile ${i}`, city: 'City',
    dob: 'Date of birth', service: 'Requested service', diagnosis: 'Diagnosis', link: 'Case link', req_link: 'Request link',
    preferred: 'Preferred date', date: 'Date', time: 'Time', type: 'Visit type', clinician: 'Clinician', address: 'Address', map: 'Map location', notes: 'Notes', ref: 'Ref',
  },
};

const phoneLines = (t, v) => phonesIn(v).map((p, i) => `${i === 0 ? t.mobile : t.mobile_n(i + 1)}: ${p}`);

export function caseText(c, lang = 'ar', { link = true } = {}) {
  const t = L[lang] || L.ar;
  const insurer = c.company_name || c.user_name;
  const coord = [c.coordinator_name, c.coordinator_phone].filter(Boolean).join(' — ');
  return join([
    `*${t.case} ${c.ref || ''}*`,
    line(t.insurer, insurer),
    line(t.referred_by, c.submitted_by_name),
    line(t.coordinator, coord),
    '',
    line(t.hospital, c.hospital_name),
    line(t.patient, c.patient_name),
    line(t.nid, c.national_id),
    ...phoneLines(t, c.mobile),
    line(t.city, c.city),
    line(t.dob, c.dob),
    line(t.service, c.requested_service),
    line(t.diagnosis, c.diagnosis),
    link && c.id ? `\n${t.link}: ${origin()}/admin/cases?open=${c.id}` : null,
  ]).replace(/\n{3,}/g, '\n\n');
}

export function requestText(r, lang = 'ar', { link = true } = {}) {
  const t = L[lang] || L.ar;
  return join([
    `*${t.request} ${r.ref || ''}*`,
    line(t.service, r.service_title),
    '',
    line(t.patient, r.patient_name || r.user_name),
    ...phoneLines(t, r.phone || r.user_phone),
    line(t.city, r.city),
    line(t.address, r.profile?.address),
    line(t.map, r.profile?.latitude && r.profile?.longitude ? `https://maps.google.com/?q=${r.profile.latitude},${r.profile.longitude}` : null),
    line(t.preferred, r.preferred_date ? String(r.preferred_date).slice(0, 10) : null),
    line(t.notes, r.notes),
    link && r.id ? `\n${t.req_link}: ${origin()}/admin/requests?open=${r.id}` : null,
  ]).replace(/\n{3,}/g, '\n\n');
}

export function visitText(v, lang = 'ar', { typeLabel = (x) => x, clinician = '' } = {}) {
  const t = L[lang] || L.ar;
  const map = v.patient_lat && v.patient_lng ? `https://maps.google.com/?q=${v.patient_lat},${v.patient_lng}` : null;
  return join([
    `*${t.visit}${v.ref ? ' — ' + v.ref : ''}*`,
    line(t.date, (v.visit_date || '').slice(0, 10)),
    line(t.time, v.visit_time ? String(v.visit_time).slice(0, 5) : null),
    line(t.type, typeLabel(v.visit_type)),
    line(t.clinician, clinician),
    '',
    line(t.patient, v.patient_name),
    ...phoneLines(t, v.patient_mobile),
    line(t.city, v.patient_city),
    line(t.address, v.patient_address),
    line(t.map, map),
    line(t.insurer, v.company_name),
    line(t.notes, v.notes),
  ]).replace(/\n{3,}/g, '\n\n');
}

// WhatsApp opens its own chat picker (groups included) on phone and desktop.
export const whatsappUrl = (text) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
export function openWhatsApp(text) {
  window.open(whatsappUrl(text), '_blank', 'noopener');
}
// When the text has to be fetched first: open the tab inside the click (so popup
// blockers allow it), then point it at WhatsApp once the text is ready.
export async function openWhatsAppAsync(getText) {
  const w = window.open('', '_blank');
  try {
    const s = await getText();
    if (!s) { w?.close(); return; }
    if (w) { w.opener = null; w.location.href = whatsappUrl(s); } else openWhatsApp(s);
  } catch { w?.close(); }
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    return ok;
  }
}
