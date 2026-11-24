// Insurance-case creation shared by the insurer form, the admin form and the
// Excel import (template, parsing, validation).
// exceljs is loaded on first use so the API still starts if the package is missing
let ExcelJSmod = null;
async function excel() {
  if (!ExcelJSmod) {
    try { ExcelJSmod = (await import('exceljs')).default; }
    catch { throw Object.assign(new Error('excel_unavailable'), { code: 'excel_unavailable' }); }
  }
  return ExcelJSmod;
}
import bcrypt from 'bcryptjs';
import { query } from './db/pool.js';
import { Users, Services, InsuranceCases, RequestEvents, Attachments, InsurerServices } from './db/queries.js';
import { caseReferrerReady } from './caseColumns.js';

export const refCode = (prefix, id) => `${prefix}-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;
const OPEN_STATUSES = ['submitted', 'reviewing', 'approved', 'visit_scheduled', 'in_progress'];
export const MAX_IMPORT_ROWS = 500;

/* ---------------- create ---------------- */
// fields: hospital_name, patient_name, national_id, mobile, city, dob, diagnosis,
//         requested_service, coordinator_name, coordinator_phone
export async function createCase({ companyId, submitter = {}, fields, attachments, source = 'form', status = 'submitted', receivedNote }) {
  const f = fields || {};
  const tmpRef = 'T' + Date.now() + String(Math.floor(Math.random() * 1e5)).padStart(5, '0'); // 19 chars; ref is VARCHAR(20)
  const r = !caseReferrerReady()
    ? await query(
      'INSERT INTO insurance_cases (ref, user_id, hospital_name, patient_name, national_id, mobile, city, dob, diagnosis, requested_service, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [tmpRef, companyId, f.hospital_name || null, f.patient_name, f.national_id || null, f.mobile || null, f.city || null, f.dob || null, f.diagnosis || null, f.requested_service || null, 'submitted'])
    : await query(
    `INSERT INTO insurance_cases (ref, user_id, submitted_by_user_id, submitted_by_name, hospital_name, patient_name, national_id, mobile, city, dob,
       diagnosis, requested_service, coordinator_name, coordinator_phone, source, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [tmpRef, companyId, submitter.user_id || null, submitter.name || null,
      f.hospital_name || null, f.patient_name, f.national_id || null, f.mobile || null, f.city || null, f.dob || null,
      f.diagnosis || null, f.requested_service || null, f.coordinator_name || null, f.coordinator_phone || null, source, 'submitted']);
  const id = r.insertId;
  const ref = refCode('INS', id);
  await query('UPDATE insurance_cases SET ref=? WHERE id=?', [ref, id]);
  if (Array.isArray(attachments) && attachments.length) await Attachments.addMany('insurance_case', id, attachments);
  const by = submitter.name ? ` — أرسلها ${submitter.name}` : '';
  await RequestEvents.add({
    ref_type: 'insurance_case', ref_id: id, status: 'submitted', title_ar: 'تم استلام الحالة',
    note: receivedNote || `تم استلام بيانات المريض${Array.isArray(attachments) && attachments.length ? ' مع ' + attachments.length + ' مرفق' : ''} وستُحوَّل للمراجعة الطبية.${by}`,
    actor: 'النظام',
  });
  let account = null;
  if (status === 'approved') {
    await InsuranceCases.update(id, { status: 'approved' });
    await RequestEvents.add({ ref_type: 'insurance_case', ref_id: id, status: 'approved', title_ar: 'تمت الموافقة على الحالة', note: null, actor: 'الإدارة' });
    account = await ensurePatientAccount({ id, patient_name: f.patient_name, mobile: f.mobile, national_id: f.national_id });
    if (account.user_id) {
      await RequestEvents.add({
        ref_type: 'insurance_case', ref_id: id, status: null,
        title_ar: account.created ? 'تم إنشاء حساب المريض' : 'تم ربط حساب المريض',
        note: `اسم المستخدم (الجوال): ${account.username} — كلمة المرور: رقم هوية المريض`, actor: 'النظام',
      });
    }
  }
  return { id, ref, account };
}

// Auto-create (or link) a patient login account for an approved case.
// Username = patient's first mobile, password = patient national ID. Role: visitor (patient).
export async function ensurePatientAccount(c) {
  if (c.patient_user_id) return { skipped: 'exists' };
  const mobile = (c.mobile || '').replace(/\s+/g, '');   // same rule as the approval flow in routes/admin.js
  const nid = (c.national_id || '').trim();
  if (!mobile || !nid) return { skipped: 'missing_mobile_or_id' };
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

/* ---------------- helpers ---------------- */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const latin = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
const pad = (n) => String(n).padStart(2, '0');

// all phone numbers found in a free-text field ("0533888187-----0533888178",
// "+966 53 388 8187 / 0540604997"): digit groups split by spaces are joined
// until they make a whole number.
const need = (d) => (d.startsWith('00966') ? 14 : d.startsWith('966') ? 12 : d.startsWith('5') ? 9 : 10);
const normPhone = (d) => (d.startsWith('00966') ? '0' + d.slice(5) : d.startsWith('966') ? '0' + d.slice(3) : d.length === 9 && d.startsWith('5') ? '0' + d : d);
export function mobilesIn(v) {
  const out = [];
  let cur = '';
  for (const t of latin(v).split(/[^\d+]+/)) {
    const d = t.replace(/\D/g, '');
    if (!d) continue;
    if (cur && cur.length < need(cur)) cur += d;
    else { if (cur) out.push(normPhone(cur)); cur = d; }
  }
  if (cur) out.push(normPhone(cur));
  return out;
}
export const firstMobile = (v) => mobilesIn(v)[0] || String(v || '').trim();

// ExcelJS cell value -> plain string
function cellText(v) {
  if (v == null) return '';
  if (v instanceof Date) return `${pad(v.getUTCDate())}/${pad(v.getUTCMonth() + 1)}/${v.getUTCFullYear()}`;
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
    if (v.text != null) return String(v.text);
    if (v.result != null) return cellText(v.result);
    if (v.hyperlink) return String(v.hyperlink);
    return '';
  }
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  return String(v);
}

// DOB -> DD/MM/YYYY when recognisable, else the text as typed
function normDob(s) {
  const t = latin(s).trim();
  if (!t) return '';
  let m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${pad(m[1])}/${pad(m[2])}/${m[3]}`;
  m = t.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (m) return `${pad(m[3])}/${pad(m[2])}/${m[1]}`;
  if (/^\d{5}(\.\d+)?$/.test(t)) {                    // Excel serial date stored as a number
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(t)) * 86400000);
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  }
  return t;
}
const validDob = (s) => {
  const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return y >= 1900 && dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d && dt <= new Date();
};

/* ---------------- template ---------------- */
// key, Arabic header, English header, width, text-formatted?
export const COLUMNS = [
  ['hospital_name', 'المستشفى', 'Hospital', 24, false],
  ['patient_name', 'اسم المريض *', 'Patient name *', 30, false],
  ['national_id', 'رقم الهوية', 'National ID', 16, true],
  ['mobile', 'الجوال', 'Mobile', 15, true],
  ['mobile2', 'جوال إضافي', 'Mobile 2', 15, true],
  ['city', 'المدينة', 'City', 14, false],
  ['dob', 'تاريخ الميلاد (يوم/شهر/سنة)', 'DOB (DD/MM/YYYY)', 18, true],
  ['requested_service', 'الخدمة المطلوبة', 'Requested service', 30, false],
  ['diagnosis', 'التشخيص', 'Diagnosis', 40, false],
  ['coordinator_name', 'اسم المنسّق', 'Coordinator name', 22, false],
  ['coordinator_phone', 'جوال المنسّق', 'Coordinator mobile', 16, true],
];

export async function servicesFor(companyId) {
  const [ids, all] = await Promise.all([companyId ? InsurerServices.list(companyId) : [], Services.listPublicIds()]);
  return (ids.length ? all.filter((s) => ids.includes(s.id)) : all).map((s) => s.title_ar || s.title_en).filter(Boolean);
}

export async function buildTemplate({ services = [], companyName = '' } = {}) {
  const wb = new (await excel()).Workbook();
  wb.creator = 'RU-MD';
  const ws = wb.addWorksheet('الحالات', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNS.map(([key, ar, en, width]) => ({ key, width, header: `${ar}\n${en}` }));
  const head = ws.getRow(1);
  head.height = 36;
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 11 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3556' } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { bottom: { style: 'thin', color: { argb: 'FF1B9AAA' } } };
  });
  const last = MAX_IMPORT_ROWS + 1;
  // text-format the ID / phone / date columns (column default + each fill-in row) so Excel keeps leading zeros
  COLUMNS.forEach(([, , , , text], i) => {
    if (!text) return;
    ws.getColumn(i + 1).numFmt = '@';
    for (let r = 2; r <= last; r++) ws.getRow(r).getCell(i + 1).numFmt = '@';
  });

  const lists = wb.addWorksheet('Lists', { state: 'veryHidden' });
  lists.getCell('A1').value = 'services';
  services.forEach((s, i) => { lists.getCell(`A${i + 2}`).value = s; });
  const svcCol = COLUMNS.findIndex(([k]) => k === 'requested_service') + 1;
  const svcLetter = ws.getColumn(svcCol).letter;
  if (services.length) {
    for (let r = 2; r <= last; r++) {
      ws.getCell(`${svcLetter}${r}`).dataValidation = {
        type: 'list', allowBlank: true, showErrorMessage: false,
        formulae: [`Lists!$A$2:$A$${services.length + 1}`],
      };
    }
  }
  const nameLetter = ws.getColumn(COLUMNS.findIndex(([k]) => k === 'patient_name') + 1).letter;
  ws.getCell(`${nameLetter}1`).note = 'حقل إلزامي — Required';

  const help = wb.addWorksheet('تعليمات', { views: [{ rightToLeft: true }] });
  help.getColumn(1).width = 110;
  const lines = [
    ['نموذج استيراد حالات المرضى — رؤى للرعاية الصحية المنزلية (RU-MD)', true],
    [companyName ? `شركة التأمين: ${companyName}` : '', false],
    ['', false],
    ['• عبّئ ورقة «الحالات»: صف واحد لكل مريض، ابتداءً من الصف الثاني. لا تغيّر ترتيب الأعمدة أو عناوينها.', false],
    ['• اسم المريض إلزامي، وباقي الحقول اختيارية لكنها تُسرّع معالجة الحالة.', false],
    ['• رقم الهوية والجوال: اكتبها كما هي (مثال 1012345678 و 0551234567). الأعمدة منسّقة كنص فلا يُحذف الصفر.', false],
    ['• جوال إضافي: لرقم ثانٍ للمريض أو لذويه، يظهر بجانب الرقم الأول.', false],
    ['• تاريخ الميلاد بصيغة يوم/شهر/سنة، مثال 03/06/1984.', false],
    ['• الخدمة المطلوبة: اختر من القائمة المنسدلة، أو اكتب الخدمة إن لم تكن فيها.', false],
    ['• اسم المنسّق وجواله: الشخص الذي يُتواصل معه بخصوص الحالة إن لم يكن صاحب الحساب.', false],
    [`• الحد الأعلى ${MAX_IMPORT_ROWS} حالة في الملف الواحد. ستظهر لك معاينة لكل صف قبل الحفظ.`, false],
    ['', false],
    ['Fill the "الحالات" sheet: one patient per row from row 2. Patient name is required. Keep the column order. Max 500 rows per file.', false],
  ];
  lines.forEach(([t, bold], i) => {
    const c = help.getCell(`A${i + 1}`);
    c.value = t;
    c.alignment = { wrapText: true, vertical: 'top' };
    c.font = { name: 'Arial', size: bold ? 14 : 11, bold, color: { argb: bold ? 'FF0B3556' : 'FF333333' } };
  });
  return wb.xlsx.writeBuffer();
}

/* ---------------- parse + validate ---------------- */
// map a header cell to a column key: the longest label it contains wins
// ("جوال المنسّق / Coordinator mobile" -> coordinator_phone, not mobile)
function headerKey(text) {
  const t = String(text || '').toLowerCase().replace(/\s+/g, ' ');
  let best = null, bestLen = 0;
  for (const [key, ar, en] of COLUMNS) {
    for (const label of [ar, en]) {
      const l = label.replace(/\s*\*$/, '').split(' (')[0].toLowerCase().trim();
      if (l && t.includes(l) && l.length > bestLen) { best = key; bestLen = l.length; }
    }
  }
  return best;
}

export async function parseWorkbook(base64) {
  const b64 = String(base64 || '').replace(/^data:[^,]*,/, '');
  const buf = Buffer.from(b64, 'base64');
  if (!buf.length) throw Object.assign(new Error('empty_file'), { code: 'empty_file' });
  const wb = new (await excel()).Workbook();
  try { await wb.xlsx.load(buf); } catch { throw Object.assign(new Error('bad_file'), { code: 'bad_file' }); }
  const ws = wb.getWorksheet('الحالات') || wb.worksheets.find((w) => w.state === 'visible') || wb.worksheets[0];
  if (!ws) throw Object.assign(new Error('bad_file'), { code: 'bad_file' });
  // map columns by header text (falls back to template order)
  const map = {};
  ws.getRow(1).eachCell({ includeEmpty: false }, (c, col) => { const k = headerKey(cellText(c.value)); if (k && !Object.values(map).includes(k)) map[col] = k; });
  if (!Object.values(map).includes('patient_name')) COLUMNS.forEach(([k], i) => { map[i + 1] = k; });
  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    const o = {};
    for (const [col, key] of Object.entries(map)) o[key] = cellText(row.getCell(Number(col)).value).trim();
    if (Object.values(o).some(Boolean)) rows.push({ n, raw: o });
  });
  if (rows.length > MAX_IMPORT_ROWS) throw Object.assign(new Error('too_many_rows'), { code: 'too_many_rows', max: MAX_IMPORT_ROWS });
  return rows;
}

// Clean one row to case fields; returns { data, errors[], warnings[] }
export function cleanRow(raw, services = []) {
  const errors = [], warnings = [];
  const mobs = [...mobilesIn(raw.mobile), ...mobilesIn(raw.mobile2)].filter((v, i, a) => a.indexOf(v) === i);
  const data = {
    hospital_name: (raw.hospital_name || '').trim(),
    patient_name: (raw.patient_name || '').replace(/\s+/g, ' ').trim(),
    national_id: latin(raw.national_id).replace(/\D/g, ''),
    mobile: mobs.join(' , '),
    city: (raw.city || '').trim(),
    dob: normDob(raw.dob),
    requested_service: (raw.requested_service || '').trim(),
    diagnosis: (raw.diagnosis || '').trim(),
    coordinator_name: (raw.coordinator_name || '').trim(),
    coordinator_phone: mobilesIn(raw.coordinator_phone)[0] || latin(raw.coordinator_phone).trim(),
  };
  if (!data.patient_name) errors.push('patient_name_required');
  if (raw.national_id && data.national_id.length !== 10) warnings.push('national_id_format');
  if (!raw.national_id) warnings.push('national_id_missing');
  if (!mobs.length) warnings.push('mobile_missing');
  else if (mobs.some((m) => !/^05\d{8}$/.test(m))) warnings.push('mobile_format');
  if (data.dob && !validDob(data.dob)) warnings.push('dob_format');
  if (data.requested_service && services.length && !services.includes(data.requested_service)) warnings.push('service_not_listed');
  return { data, errors, warnings };
}

// open cases (same company) keyed by national ID — to flag duplicates
export async function openCasesByNid(companyId, nids) {
  const list = [...new Set(nids.filter(Boolean))];
  if (!list.length) return {};
  const rows = await query(
    `SELECT id, ref, national_id, status FROM insurance_cases WHERE user_id = ? AND deleted_at IS NULL
     AND status IN (${OPEN_STATUSES.map(() => '?').join(',')}) AND national_id IN (${list.map(() => '?').join(',')})`,
    [companyId, ...OPEN_STATUSES, ...list]);
  const m = {};
  for (const r of rows) m[r.national_id] = r.ref;
  return m;
}

// Full preview of an uploaded file for a company
export async function previewImport(companyId, base64) {
  const [rows, services] = await Promise.all([parseWorkbook(base64), servicesFor(companyId)]);
  const cleaned = rows.map((r) => ({ n: r.n, ...cleanRow(r.raw, services) }));
  const open = await openCasesByNid(companyId, cleaned.map((r) => r.data.national_id));
  const seen = {};
  for (const r of cleaned) {
    const nid = r.data.national_id;
    if (nid && open[nid]) { r.duplicate = open[nid]; r.warnings.push('open_case_exists'); }
    if (nid && seen[nid]) r.warnings.push('duplicate_in_file');
    if (nid) seen[nid] = true;
  }
  return { rows: cleaned, services };
}

// Create the confirmed rows; rows that fail validation are skipped.
export async function runImport({ companyId, submitter, rows, status = 'submitted', source = 'excel' }) {
  const services = await servicesFor(companyId);
  const created = [], skipped = [];
  for (const r of (Array.isArray(rows) ? rows : []).slice(0, MAX_IMPORT_ROWS)) {
    const { data, errors } = cleanRow({ ...r, mobile2: '' }, services);
    if (errors.length) { skipped.push({ n: r.n, errors }); continue; }
    const c = await createCase({
      companyId, submitter, fields: data, source, status,
      receivedNote: `تم استلام بيانات المريض ضمن ملف Excel${submitter?.name ? ' — رفعه ' + submitter.name : ''}، وستُحوَّل للمراجعة الطبية.`,
    });
    created.push({ n: r.n, id: c.id, ref: c.ref, patient_name: data.patient_name, account: c.account?.user_id ? { created: c.account.created, username: c.account.username } : null });
  }
  return { created, skipped };
}
