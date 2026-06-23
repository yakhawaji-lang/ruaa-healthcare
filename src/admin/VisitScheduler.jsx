import { useState, useEffect } from 'react';
import { CalendarPlus, Trash2, Check, X, UserRound, Stethoscope, Clock, Plus } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { VISIT_STATUSES, visitStatusLabel, visitStatusColor, fmtDate,
  VISIT_TYPES_BI, CLINICIAN_ROLES_BI, normBiList, normStaffList, biLabel } from '../account/status.js';
import { useLang } from '../i18n.jsx';
import MultiDateCalendar from './MultiDateCalendar.jsx';

const parseJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };

const T = {
  ar: {
    confirm_delete: 'حذف الزيارة؟', home_visits: 'الزيارات المنزلية', schedule_visit: 'جدولة زيارة',
    date: 'التاريخ', time: 'الوقت', dates: 'أيام الزيارة', add_day: 'إضافة يوم', need_day: 'اختر يومًا واحدًا على الأقل', visit_type: 'نوع الزيارة', clinician_role: 'تخصص الكادر',
    clinician_name: 'اسم الكادر الطبي', clinician_name_ph: 'مثال: أ. سارة العتيبي', select_name: 'اختر الاسم',
    notes: 'ملاحظات الزيارة', notes_ph: 'تفاصيل إضافية عن الزيارة (اختياري)', cancel: 'إلغاء', add_visit: 'إضافة الزيارة',
    no_visits: 'لا توجد زيارات. أضف أول زيارة منزلية.',
    complete: 'إتمام', cancel_visit: 'إلغاء', delete: 'حذف',
  },
  en: {
    confirm_delete: 'Delete the visit?', home_visits: 'Home Visits', schedule_visit: 'Schedule visit',
    date: 'Date', time: 'Time', dates: 'Visit days', add_day: 'Add day', need_day: 'Select at least one day', visit_type: 'Visit type', clinician_role: 'Clinician specialty',
    clinician_name: 'Clinician name', clinician_name_ph: 'e.g. Ms. Sarah Al-Otaibi', select_name: 'Select name',
    notes: 'Visit notes', notes_ph: 'Extra details about the visit (optional)', cancel: 'Cancel', add_visit: 'Add visit',
    no_visits: 'No visits. Add the first home visit.',
    complete: 'Complete', cancel_visit: 'Cancel', delete: 'Delete',
  },
};

const blank = { visit_time: '', clinician_name: '', clinician_role: 'ممرض/ة', visit_type: 'زيارة منزلية', notes: '' };

// Schedule & manage home visits linked to a service request / insurance case.
export default function VisitScheduler({ refType, refId, visits = [], onChange }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(blank);
  const [dates, setDates] = useState([]); // multiple visit days
  const [busy, setBusy] = useState(false);
  const [vTypes, setVTypes] = useState(VISIT_TYPES_BI);
  const [vRoles, setVRoles] = useState(CLINICIAN_ROLES_BI);
  const [vStaff, setVStaff] = useState([]);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    AdminAPI.settings().then((rs) => {
      const get = (k) => rs.find((r) => r.key === k)?.value_ar;
      setVTypes(normBiList(parseJSON(get('visit_types')), VISIT_TYPES_BI));
      setVRoles(normBiList(parseJSON(get('clinician_roles')), CLINICIAN_ROLES_BI));
      setVStaff(normStaffList(parseJSON(get('clinical_staff')) || []));
    }).catch(() => {});
  }, []);

  // bilingual option list (value = canonical ar; label = current language)
  const biOptions = (list, cur) => {
    const opts = list.map((it) => ({ value: it.ar || it.en, label: biLabel(it, lang) }));
    if (cur && !opts.some((o) => o.value === cur)) opts.unshift({ value: cur, label: cur });
    return opts;
  };
  // staff names configured (in Settings) for the chosen specialty
  const staffForRole = vStaff.filter((s) => (s.name_ar || s.name_en) && (s.roles || []).includes(f.clinician_role));
  const nameOptions = staffForRole.map((s) => ({ value: s.name_ar || s.name_en, label: biLabel({ ar: s.name_ar, en: s.name_en }, lang) }));
  const ensureCur = (opts, cur) => (cur && !opts.some((o) => o.value === cur) ? [{ value: cur, label: nameLabel(cur) }, ...opts] : opts);
  // resolve a stored value to the current-language label
  const typeLabel = (v) => { const it = vTypes.find((x) => x.ar === v || x.en === v); return it ? biLabel(it, lang) : v; };
  const roleLabel = (v) => { const it = vRoles.find((x) => x.ar === v || x.en === v); return it ? biLabel(it, lang) : v; };
  const nameLabel = (v) => { const s = vStaff.find((x) => x.name_ar === v || x.name_en === v); return s ? biLabel({ ar: s.name_ar, en: s.name_en }, lang) : v; };

  const toggleDate = (d) => setDates((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort()));

  const add = async () => {
    if (dates.length === 0) return;
    setBusy(true);
    try {
      // create one visit per selected day (shared time / clinician / notes)
      for (const d of dates) await AdminAPI.createVisit({ ref_type: refType, ref_id: refId, ...f, visit_date: d });
      setF(blank); setDates([]); setAdding(false); onChange();
    } finally { setBusy(false); }
  };
  const setStatus = async (v, status) => { await AdminAPI.updateVisit(v.id, { ...v, status }); onChange(); };
  const remove = async (id) => { if (confirm(tt.confirm_delete)) { await AdminAPI.deleteVisit(id); onChange(); } };

  return (
    <div className="visit-scheduler">
      <div className="vs-head">
        <h3 className="track-title" style={{ margin: 0 }}>{tt.home_visits}</h3>
        {!adding && <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><CalendarPlus size={15} /> {tt.schedule_visit}</button>}
      </div>

      {adding && (
        <div className="vs-form">
          <div className="field"><label>{tt.time}</label><input type="time" dir="ltr" value={f.visit_time} onChange={set('visit_time')} /></div>
          <div className="field-row">
            <div className="field"><label>{tt.visit_type}</label>
              <select value={f.visit_type} onChange={set('visit_type')}>{biOptions(vTypes, f.visit_type).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="field"><label>{tt.clinician_role}</label>
              <select value={f.clinician_role} onChange={(e) => setF((p) => ({ ...p, clinician_role: e.target.value, clinician_name: '' }))}>{biOptions(vRoles, f.clinician_role).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          </div>
          <div className="field"><label>{tt.clinician_name}</label>
            {nameOptions.length > 0 ? (
              <select value={f.clinician_name} onChange={set('clinician_name')}>
                <option value="">{tt.select_name}</option>
                {ensureCur(nameOptions, f.clinician_name).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input value={f.clinician_name} onChange={set('clinician_name')} placeholder={tt.clinician_name_ph} />
            )}
          </div>
          <div className="field"><label>{tt.notes}</label><input value={f.notes} onChange={set('notes')} placeholder={tt.notes_ph} /></div>

          {/* Calendar at the bottom — tap days to select more than one */}
          <div className="field">
            <label>{tt.dates}{dates.length > 0 ? ` (${dates.length})` : ''}</label>
            <MultiDateCalendar selected={dates} onToggle={toggleDate} lang={lang} />
            {dates.length > 0 && (
              <div className="vs-date-chips">
                {dates.map((d) => (
                  <span key={d} className="vs-date-chip" dir="ltr">{fmtDate(d)}<button type="button" onClick={() => toggleDate(d)} aria-label="remove"><X size={12} /></button></span>
                ))}
              </div>
            )}
          </div>

          <div className="vs-form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setF(blank); setDates([]); }}>{tt.cancel}</button>
            <button className="btn btn-primary btn-sm" onClick={add} disabled={busy || dates.length === 0} title={dates.length === 0 ? tt.need_day : undefined}>{busy ? '...' : tt.add_visit}</button>
          </div>
        </div>
      )}

      {visits.length === 0 && !adding && <p className="empty small">{tt.no_visits}</p>}
      <div className="vs-list">
        {visits.map((v) => {
          const c = visitStatusColor(v.status);
          return (
            <div key={v.id} className="vs-row">
              <div className="vs-when">
                <strong dir="ltr">{fmtDate(v.visit_date) || '—'}</strong>
                {v.visit_time && <span><Clock size={12} /> {v.visit_time}</span>}
              </div>
              <div className="vs-meta">
                <span><Stethoscope size={13} /> {typeLabel(v.visit_type)}</span>
                {v.clinician_name && <span><UserRound size={13} /> {nameLabel(v.clinician_name)}{v.clinician_role ? ` — ${roleLabel(v.clinician_role)}` : ''}</span>}
              </div>
              <div className="vs-row-actions">
                <span className="status-pill" style={{ color: c, background: c + '1e' }}>{visitStatusLabel(v.status, lang)}</span>
                {v.status === 'scheduled' && <button title={tt.complete} className="vs-done" onClick={() => setStatus(v, 'completed')}><Check size={15} /></button>}
                {v.status === 'scheduled' && <button title={tt.cancel_visit} className="vs-cancel" onClick={() => setStatus(v, 'cancelled')}><X size={15} /></button>}
                <button title={tt.delete} className="danger" onClick={() => remove(v.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
