// Admin — Telemedicine: consultations (schedule / assign doctor / status / join)
// and doctor accounts (profile, availability, password, activation).
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Video, Phone, Plus, X, Pencil, KeyRound, Power, Trash2, Stethoscope, CalendarDays, Clock, UserRound, Save, ExternalLink, Trash, Users2, Briefcase, ShieldCheck } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import { useLang } from '../i18n.jsx';
import { isSaudiMobile, digits10, phoneInputProps } from '../validation.js';
import Tracking from '../account/Tracking.jsx';
import Thread from '../account/Thread.jsx';
import DobInput from '../components/DobInput.jsx';
import { ConsPill } from '../telemed/ConsultationCard.jsx';
import AvailabilityEditor from '../telemed/AvailabilityEditor.jsx';
import VideoRoom from '../telemed/VideoRoom.jsx';
import { CONS_FLOW, CONS_STATUSES, consLabel, modeLabel, doctorName, doctorSpecialty, fmtAt, fmtTime12, splitAt, canJoinNow, isClosed } from '../telemed/status.js';
import { CLINICIAN_ROLES_BI, normBiList, normStaffList, biLabel } from '../account/status.js';
import '../telemed/telemed.css';

const T = {
  ar: {
    title: 'الطب الاتصالي', hint: 'إدارة استشارات الفيديو والصوت: الجدولة، تعيين الأطباء، متابعة الحالة، والانضمام للغرفة.',
    tab_cons: 'الاستشارات', tab_docs: 'الممارسون الصحيون', all: 'الكل', pending: 'بانتظار الجدولة', today: 'اليوم', upcoming: 'قادمة', closed: 'منتهية',
    th_ref: 'المرجع', th_patient: 'المريض', th_doctor: 'الممارس', th_when: 'الموعد', th_mode: 'النوع', th_status: 'الحالة', th_actions: 'إجراءات',
    empty: 'لا توجد استشارات.', new_cons: 'استشارة جديدة', tbd: '— غير محدد —', open: 'فتح', delete: 'حذف', confirm_delete: 'حذف الاستشارة نهائيًا؟',
    cons_modal: 'تفاصيل الاستشارة', schedule: 'الجدولة وتعيين الممارس', doctor: 'الممارس الصحي', date: 'اليوم', time: 'الوقت', free_slots: 'الأوقات المتاحة', custom_time: 'وقت مخصص',
    price: 'الرسوم (ريال)', status: 'الحالة', mode: 'نوع الاستشارة', save: 'حفظ', saved: 'تم الحفظ', slot_taken: 'هذا الوقت محجوز لطبيب آخر مريض.', failed: 'تعذّر الحفظ',
    complaint: 'شكوى المريض', preferred: 'الوقت المفضّل للمريض', phone: 'الجوال', join: 'الانضمام للغرفة', join_closed: 'الغرفة غير مفتوحة الآن', tracking: 'سجل الاستشارة', thread: 'المراسلات مع المريض',
    summary: 'ملخص الطبيب', diagnosis: 'التشخيص', notes: 'الملاحظات', prescription: 'الوصفة', follow_up: 'المتابعة', profile: 'الملف الطبي', none: 'لا يوجد',
    client: 'حساب العميل', pick_client: 'اختر العميل...', patient_name: 'اسم المريض', complaint_ph: 'سبب الاستشارة', create: 'إنشاء', client_required: 'اختر حساب العميل',
    // doctors
    add_doctor: 'منح صلاحية الطب الاتصالي', th_name: 'الاسم', th_email: 'البريد / الدخول', th_spec: 'المهنة / التخصص', th_type: 'النوع', th_slot: 'المدة', th_pub: 'الحجز الذاتي', no_docs: 'لا يوجد ممارسون بعد. امنح الصلاحية لأول طبيب أو ممرض/ة أو أخصائي.',
    type_staff: 'كادر رؤى', type_visiting: 'زائر / متعاقد', filter_all: 'الكل',
    source: 'من هو الممارس؟', src_staff: 'من الكادر الطبي (الإعدادات)', src_admin: 'من مستخدمي لوحة التحكم', src_new: 'شخص جديد / متعاقد خارجي',
    pick_staff: 'اختر من قائمة الكادر...', pick_admin: 'اختر مستخدمًا...', profession: 'المهنة', profession_ph: 'اختر المهنة...',
    provider_type: 'نوع الممارس', staff_hint: 'موظف ضمن كادر رؤى', visiting_hint: 'طبيب/ممارس زائر أو متعاقد لتقديم الطب الاتصالي فقط',
    organization: 'الجهة / المنشأة', license_no: 'رقم الترخيص المهني (هيئة التخصصات)', contract_start: 'بداية التعاقد', contract_end: 'نهاية التعاقد', contract_notes: 'ملاحظات التعاقد (الرسوم، النسبة، الشروط...)',
    login_section: 'حساب الدخول للخدمة', login_hint: 'يستخدم هذا البريد وكلمة المرور لتسجيل الدخول من صفحة /login والوصول لبوابة الممارس.',
    need_profession: 'اختر المهنة.', visiting_contract: 'زائر/متعاقد حتى',
    active: 'مُفعّل', suspended: 'موقوف', yes: 'ظاهر', no: 'مخفي', edit: 'تعديل', reset_password: 'تغيير كلمة المرور', toggle: 'تفعيل/إيقاف', confirm_del_doc: 'حذف حساب الطبيب؟ ستبقى استشاراته السابقة في السجل.',
    new_doc: 'منح صلاحية الطب الاتصالي', edit_doc: 'تعديل بيانات الممارس', name: 'الاسم الكامل', email: 'البريد الإلكتروني', password: 'كلمة المرور', password_ph: '6 أحرف على الأقل',
    title_ar: 'اللقب (عربي)', title_en: 'اللقب (إنجليزي)', spec_ar: 'التخصص (عربي)', spec_en: 'التخصص (إنجليزي)', bio_ar: 'نبذة (عربي)', bio_en: 'نبذة (إنجليزي)', slot: 'مدة الاستشارة (دقيقة)', published: 'يظهر للمرضى في الحجز الذاتي',
    availability: 'أوقات التوفر الأسبوعية', required: 'أكمل الحقول المطلوبة', email_taken: 'البريد مستخدم', weak: 'كلمة المرور قصيرة (6 أحرف)', phone_invalid: 'رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05.',
    cancel: 'إلغاء', new_password: 'كلمة المرور الجديدة', pw_done: 'تم تحديث كلمة المرور', pw_modal: 'تغيير كلمة المرور', min: 'د',
    note: 'ملاحظة للمريض (اختياري)',
  },
  en: {
    title: 'Remote Consultations', hint: 'Manage video & voice consultations: scheduling, assigning doctors, status tracking and joining the room.',
    tab_cons: 'Consultations', tab_docs: 'Providers', all: 'All', pending: 'Awaiting scheduling', today: 'Today', upcoming: 'Upcoming', closed: 'Closed',
    th_ref: 'Ref', th_patient: 'Patient', th_doctor: 'Provider', th_when: 'Appointment', th_mode: 'Type', th_status: 'Status', th_actions: 'Actions',
    empty: 'No consultations.', new_cons: 'New consultation', tbd: '— not set —', open: 'Open', delete: 'Delete', confirm_delete: 'Permanently delete this consultation?',
    cons_modal: 'Consultation details', schedule: 'Scheduling & provider', doctor: 'Provider', date: 'Day', time: 'Time', free_slots: 'Free slots', custom_time: 'Custom time',
    price: 'Fee (SAR)', status: 'Status', mode: 'Consultation type', save: 'Save', saved: 'Saved', slot_taken: 'That time is already booked for this doctor.', failed: 'Could not save',
    complaint: "Patient's complaint", preferred: "Patient's preferred time", phone: 'Mobile', join: 'Join the room', join_closed: 'The room is not open now', tracking: 'Consultation log', thread: 'Messages with the patient',
    summary: "Doctor's summary", diagnosis: 'Diagnosis', notes: 'Notes', prescription: 'Prescription', follow_up: 'Follow-up', profile: 'Medical file', none: 'None',
    client: 'Client account', pick_client: 'Choose a client...', patient_name: 'Patient name', complaint_ph: 'Reason for the consultation', create: 'Create', client_required: 'Choose the client account',
    add_doctor: 'Grant telemedicine access', th_name: 'Name', th_email: 'Email / Login', th_spec: 'Profession / Specialty', th_type: 'Type', th_slot: 'Length', th_pub: 'Self-booking', no_docs: 'No providers yet. Grant access to the first doctor, nurse or therapist.',
    type_staff: 'RU-MD staff', type_visiting: 'Visiting / contracted', filter_all: 'All',
    source: 'Who is the provider?', src_staff: 'From clinical staff (Settings)', src_admin: 'From control-panel users', src_new: 'New person / external contractor',
    pick_staff: 'Pick from the staff list...', pick_admin: 'Pick a user...', profession: 'Profession', profession_ph: 'Choose a profession...',
    provider_type: 'Provider type', staff_hint: 'Employee of RU-MD', visiting_hint: 'Visiting or contracted clinician for telemedicine only',
    organization: 'Organization / facility', license_no: 'Professional license no. (SCFHS)', contract_start: 'Contract start', contract_end: 'Contract end', contract_notes: 'Contract notes (fees, share, terms...)',
    login_section: 'Service login account', login_hint: 'This email and password are used to sign in at /login and reach the provider portal.',
    need_profession: 'Choose a profession.', visiting_contract: 'Visiting/contracted until',
    active: 'Active', suspended: 'Suspended', yes: 'Visible', no: 'Hidden', edit: 'Edit', reset_password: 'Change password', toggle: 'Activate / Suspend', confirm_del_doc: "Delete this doctor account? Past consultations stay in the log.",
    new_doc: 'Grant telemedicine access', edit_doc: 'Edit provider', name: 'Full name', email: 'Email', password: 'Password', password_ph: 'At least 6 characters',
    title_ar: 'Title (Arabic)', title_en: 'Title (English)', spec_ar: 'Specialty (Arabic)', spec_en: 'Specialty (English)', bio_ar: 'Bio (Arabic)', bio_en: 'Bio (English)', slot: 'Consultation length (min)', published: 'Visible to patients for self-booking',
    availability: 'Weekly availability', required: 'Please complete required fields', email_taken: 'Email already in use', weak: 'Password too short (6 chars)', phone_invalid: 'Mobile number must be 10 digits starting with 05.',
    cancel: 'Cancel', new_password: 'New password', pw_done: 'Password updated', pw_modal: 'Change password', min: 'min',
    note: 'Note to the patient (optional)',
  },
};

export default function TelemedManager() {
  const { lang } = useLang();
  const tt = T[lang];
  const [tab, setTab] = useState('cons');
  return (
    <div>
      <div className="page-head">
        <div><h1 className="page-title">{tt.title}</h1><p className="page-hint">{tt.hint}</p></div>
      </div>
      <div className="tm-admin-tabs">
        <button type="button" className={tab === 'cons' ? 'active' : ''} onClick={() => setTab('cons')}><Video size={16} /> {tt.tab_cons}</button>
        <button type="button" className={tab === 'docs' ? 'active' : ''} onClick={() => setTab('docs')}><Users2 size={16} /> {tt.tab_docs}</button>
      </div>
      {tab === 'cons' ? <ConsultationsTab tt={tt} lang={lang} /> : <DoctorsTab tt={tt} lang={lang} />}
    </div>
  );
}

/* =========================== Consultations =========================== */
function ConsultationsTab({ tt, lang }) {
  const { can } = useAdminAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ now: '', items: [] });
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(params.get('open') ? Number(params.get('open')) : null);
  const [creating, setCreating] = useState(false);
  const load = () => AdminAPI.consultations().then(setData).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);
  useEffect(() => { const o = params.get('open'); if (o) setOpenId(Number(o)); }, [params]);

  const today = data.now.slice(0, 10);
  const items = (data.items || []).filter((c) => {
    const d = splitAt(c.scheduled_at).date;
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'today') return d === today && !isClosed(c.status);
    if (filter === 'upcoming') return d > today && !isClosed(c.status);
    if (filter === 'closed') return isClosed(c.status);
    return true;
  });
  const close = () => { setOpenId(null); if (params.get('open')) { params.delete('open'); setParams(params, { replace: true }); } load(); };
  const remove = async (id) => { if (confirm(tt.confirm_delete)) { await AdminAPI.deleteConsultation(id); load(); } };

  return (
    <>
      <div className="page-head" style={{ marginBottom: 10 }}>
        <div className="tm-filters">
          {['all', 'pending', 'today', 'upcoming', 'closed'].map((k) => (
            <button key={k} type="button" className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{tt[k]}</button>
          ))}
        </div>
        {can('telemed', 'create') && <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={18} /> {tt.new_cons}</button>}
      </div>
      <div className="panel">
        {items.length === 0 ? <p className="empty">{tt.empty}</p> : (
          <table className="admin-table">
            <thead><tr><th>{tt.th_ref}</th><th>{tt.th_patient}</th><th>{tt.th_doctor}</th><th>{tt.th_when}</th><th>{tt.th_mode}</th><th>{tt.th_status}</th><th>{tt.th_actions}</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className={canJoinNow(c) ? 'tm-row-live' : ''}>
                  <td dir="ltr">{c.ref}</td>
                  <td>{c.patient_name || c.user_name}<br /><small dir="ltr">{c.phone || c.user_phone || ''}</small></td>
                  <td>{c.doctor_name ? doctorName(c, lang) : <span className="muted">{tt.tbd}</span>}</td>
                  <td dir="ltr">{c.scheduled_at ? fmtAt(c.scheduled_at, lang) : <span className="muted">{tt.tbd}</span>}</td>
                  <td>{c.mode === 'audio' ? <Phone size={15} /> : <Video size={15} />} {modeLabel(c.mode, lang)}</td>
                  <td><ConsPill status={c.status} /></td>
                  <td className="row-actions">
                    <button onClick={() => setOpenId(c.id)} title={tt.open}><Pencil size={16} /></button>
                    {can('telemed', 'delete') && <button onClick={() => remove(c.id)} className="danger" title={tt.delete}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {openId && <ConsultationModal id={openId} tt={tt} lang={lang} onClose={close} />}
      {creating && <NewConsultationModal tt={tt} lang={lang} onClose={() => setCreating(false)} onDone={(id) => { setCreating(false); load(); setOpenId(id); }} />}
    </>
  );
}

// Scheduling widget shared by "open consultation" and "new consultation".
function Scheduler({ tt, lang, doctors, value, onChange }) {
  const [slots, setSlots] = useState([]);
  const [custom, setCustom] = useState(false);
  const { date, time } = splitAt(value.scheduled_at);
  const setAt = (d, t) => onChange({ ...value, scheduled_at: d && t ? `${d} ${t}` : (d ? `${d} ` : '') });
  useEffect(() => {
    if (!value.doctor_user_id || !date) { setSlots([]); return; }
    AdminAPI.telemedSlots(value.doctor_user_id, date).then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [value.doctor_user_id, date]);
  return (
    <div className="tm-sched-box">
      <div className="field"><label>{tt.mode}</label>
        <div className="tm-mode-toggle">
          <button type="button" className={value.mode !== 'audio' ? 'active' : ''} onClick={() => onChange({ ...value, mode: 'video' })}><Video size={15} /> {modeLabel('video', lang)}</button>
          <button type="button" className={value.mode === 'audio' ? 'active' : ''} onClick={() => onChange({ ...value, mode: 'audio' })}><Phone size={15} /> {modeLabel('audio', lang)}</button>
        </div>
      </div>
      <div className="field"><label>{tt.doctor}</label>
        <select value={value.doctor_user_id || ''} onChange={(e) => onChange({ ...value, doctor_user_id: e.target.value ? Number(e.target.value) : null })}>
          <option value="">{tt.tbd}</option>
          {doctors.map((d) => <option key={d.id} value={d.id} disabled={!d.is_active}>{doctorName(d, lang)}{doctorSpecialty(d, lang) ? ` — ${doctorSpecialty(d, lang)}` : ''}</option>)}
        </select>
      </div>
      <div className="field-row">
        <div className="field"><label>{tt.date}</label><DobInput iso value={date} onChange={(v) => setAt(v, custom ? time : '')} /></div>
        <div className="field"><label>{tt.time}</label>
          {custom ? <input type="time" dir="ltr" step={300} value={time} onChange={(e) => setAt(date, e.target.value)} /> : (
            <select value={time} onChange={(e) => setAt(date, e.target.value)} disabled={!date || !value.doctor_user_id}>
              <option value="">{tt.free_slots}…</option>
              {time && !slots.includes(time) && <option value={time}>{fmtTime12(time, lang)}</option>}
              {slots.map((s) => <option key={s} value={s}>{fmtTime12(s, lang)}</option>)}
            </select>
          )}
          <label className="tm-check" style={{ marginTop: 6 }}><input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> <span>{tt.custom_time}</span></label>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>{tt.price}</label><input type="number" dir="ltr" min={0} value={value.price ?? ''} onChange={(e) => onChange({ ...value, price: e.target.value })} /></div>
        <div className="field"><label>{tt.status}</label>
          <select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
            {CONS_STATUSES.map((s) => <option key={s} value={s}>{consLabel(s, lang)}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function ConsultationModal({ id, tt, lang, onClose }) {
  const { can } = useAdminAuth();
  const [c, setC] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [f, setF] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [room, setRoom] = useState(false);
  const load = () => AdminAPI.consultation(id).then((r) => { setC(r); setF({ doctor_user_id: r.doctor_user_id, scheduled_at: r.scheduled_at || '', price: r.price ?? '', status: r.status, mode: r.mode }); });
  useEffect(() => { load(); AdminAPI.doctors().then(setDoctors).catch(() => {}); }, [id]);
  if (!c || !f) return <div className="modal-overlay"><div className="modal"><div className="modal-body"><div className="spinner" /></div></div></div>;

  const save = async () => {
    setBusy(true); setError('');
    try {
      const at = f.scheduled_at && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(f.scheduled_at) ? f.scheduled_at : null;
      await AdminAPI.updateConsultation(id, { ...f, scheduled_at: at, note: note || undefined });
      setSaved(true); setTimeout(() => setSaved(false), 2000); setNote(''); await load();
    } catch (e) {
      setError(e?.response?.data?.error === 'slot_taken' ? tt.slot_taken : tt.failed);
    } finally { setBusy(false); }
  };
  const sendMsg = async (payload) => { await AdminAPI.sendConsultationMessage(id, payload); await load(); };
  const Icon = c.mode === 'audio' ? Phone : Video;
  const p = c.profile || {};
  const canEdit = can('telemed', 'edit');

  if (room) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 1100 }}>
          <div className="modal-body" style={{ padding: 0 }}>
            <VideoRoom fetchJoin={() => AdminAPI.joinConsultation(id)} onLeave={() => { setRoom(false); load(); }} subtitle={`${c.patient_name || ''} — ${c.doctor_name ? doctorName(c, lang) : ''}`} badge={<span className="tm-role-badge">Admin</span>} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 1040 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2><Icon size={18} /> {tt.cons_modal} — <span dir="ltr">{c.ref}</span> <ConsPill status={c.status} /></h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}
          <div className="tm-admin-layout">
            <div>
              <div className="detail-meta" style={{ marginBottom: 12 }}>
                <div><span>{tt.th_patient}</span><b>{c.patient_name || c.user_name}</b></div>
                <div><span>{tt.phone}</span><b dir="ltr">{c.phone || c.user_phone || '—'}</b></div>
                <div><span>{tt.client}</span><b>{c.user_name} <small dir="ltr">({c.user_email})</small></b></div>
                {c.preferred_note && <div><span>{tt.preferred}</span><b>{c.preferred_note}</b></div>}
              </div>
              {c.complaint && <p className="detail-notes"><b>{tt.complaint}:</b> {c.complaint}</p>}

              <h3 className="block-label" style={{ marginTop: 14 }}><CalendarDays size={16} /> {tt.schedule}</h3>
              <Scheduler tt={tt} lang={lang} doctors={doctors} value={f} onChange={setF} />
              <div className="field" style={{ marginTop: 10 }}><label>{tt.note}</label><input value={note} onChange={(e) => setNote(e.target.value)} /></div>
              <div className="tm-actions-row wrap">
                {canEdit && <button type="button" className="btn btn-primary" disabled={busy} onClick={save}><Save size={16} /> {tt.save}</button>}
                <button type="button" className="btn btn-outline" disabled={!canJoinNow(c)} title={canJoinNow(c) ? '' : tt.join_closed} onClick={() => setRoom(true)}><ExternalLink size={16} /> {tt.join}</button>
                {saved && <span className="tm-saved">{tt.saved}</span>}
              </div>

              {(c.diagnosis || c.doctor_notes || c.prescription || c.follow_up) && (
                <div className="detail-card tm-summary-card" style={{ marginTop: 18 }}>
                  <h3><Stethoscope size={18} /> {tt.summary}</h3>
                  {c.diagnosis && <div className="tm-sum-row"><span>{tt.diagnosis}</span><p>{c.diagnosis}</p></div>}
                  {c.doctor_notes && <div className="tm-sum-row"><span>{tt.notes}</span><p>{c.doctor_notes}</p></div>}
                  {c.prescription && <div className="tm-sum-row"><span>{tt.prescription}</span><p>{c.prescription}</p></div>}
                  {c.follow_up && <div className="tm-sum-row"><span>{tt.follow_up}</span><p>{c.follow_up}</p></div>}
                </div>
              )}

              <h3 className="track-title">{tt.tracking}</h3>
              <Tracking flow={CONS_FLOW} status={c.status === 'no_show' ? 'cancelled' : c.status} events={c.events} audience="admin" labelFn={consLabel} />
            </div>
            <div>
              <div className="side-card">
                <div className="side-card-head"><UserRound size={18} /> <h3>{tt.profile}</h3></div>
                <div className="side-card-body">
                  <dl className="tm-dl">
                    <dt>DOB</dt><dd dir="ltr">{p.dob || '—'}</dd>
                    <dt>{lang === 'en' ? 'Blood' : 'الفصيلة'}</dt><dd dir="ltr">{p.blood_type || '—'}</dd>
                    <dt>{lang === 'en' ? 'Chronic' : 'مزمنة'}</dt><dd>{p.chronic_conditions || tt.none}</dd>
                    <dt>{lang === 'en' ? 'Allergies' : 'حساسية'}</dt><dd>{p.allergies || tt.none}</dd>
                    <dt>{lang === 'en' ? 'Medications' : 'أدوية'}</dt><dd>{p.medications || tt.none}</dd>
                  </dl>
                </div>
              </div>
              <Thread messages={c.messages || []} currentRole="admin" onSend={sendMsg} onUpload={AdminAPI.uploadFile} title={tt.thread} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewConsultationModal({ tt, lang, onClose, onDone }) {
  const [clients, setClients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [f, setF] = useState({ user_id: '', patient_name: '', phone: '', complaint: '', doctor_user_id: null, scheduled_at: '', price: '', status: 'pending', mode: 'video' });
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { AdminAPI.clients().then(setClients).catch(() => {}); AdminAPI.doctors().then(setDoctors).catch(() => {}); }, []);
  const pick = (u) => setF((p) => ({ ...p, user_id: u.id, patient_name: p.patient_name || u.name, phone: p.phone || u.phone || '' }));
  const filtered = clients.filter((u) => !q || `${u.name} ${u.email} ${u.phone || ''}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const save = async () => {
    if (!f.user_id) { setError(tt.client_required); return; }
    if (f.phone && !isSaudiMobile(f.phone)) { setError(tt.phone_invalid); return; }
    setBusy(true); setError('');
    try {
      const at = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(f.scheduled_at) ? f.scheduled_at : null;
      const r = await AdminAPI.createConsultation({ ...f, scheduled_at: at });
      onDone(r.id);
    } catch (e) { setError(e?.response?.data?.error === 'slot_taken' ? tt.slot_taken : tt.failed); }
    finally { setBusy(false); }
  };
  const sel = clients.find((u) => u.id === f.user_id);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.new_cons}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}
          <div className="field"><label>{tt.client}</label>
            <input value={sel ? `${sel.name} — ${sel.email}` : q} onChange={(e) => { setQ(e.target.value); setF((p) => ({ ...p, user_id: '' })); }} placeholder={tt.pick_client} />
            {!sel && q && (
              <div className="tm-doctor-list" style={{ marginTop: 8 }}>
                {filtered.map((u) => <button key={u.id} type="button" className="tm-doctor" onClick={() => pick(u)}><span className="tm-doctor-body"><strong>{u.name}</strong><small dir="ltr">{u.email} · {u.phone || ''}</small></span></button>)}
              </div>
            )}
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.patient_name}</label><input value={f.patient_name} onChange={(e) => setF((p) => ({ ...p, patient_name: e.target.value }))} /></div>
            <div className="field"><label>{tt.phone}</label><input {...phoneInputProps} value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} /></div>
          </div>
          <div className="field"><label>{tt.complaint}</label><textarea rows={2} value={f.complaint} onChange={(e) => setF((p) => ({ ...p, complaint: e.target.value }))} placeholder={tt.complaint_ph} /></div>
          <Scheduler tt={tt} lang={lang} doctors={doctors} value={f} onChange={setF} />
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : tt.create}</button>
        </div>
      </div>
    </div>
  );
}

/* =============================== Doctors =============================== */
function DoctorsTab({ tt, lang }) {
  const { can } = useAdminAuth();
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null);
  const [pwUser, setPwUser] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const load = () => AdminAPI.doctors().then(setList).catch(() => {});
  useEffect(() => { load(); }, []);
  const toggle = async (d) => { await AdminAPI.setDoctorActive(d.id, !d.is_active); load(); };
  const remove = async (id) => { if (confirm(tt.confirm_del_doc)) { await AdminAPI.deleteDoctor(id); load(); } };
  const shown = list.filter((d) => typeFilter === 'all' || (d.provider_type || 'staff') === typeFilter);
  return (
    <>
      <div className="page-head" style={{ marginBottom: 10 }}>
        <div className="tm-filters">
          {[['all', tt.filter_all], ['staff', tt.type_staff], ['visiting', tt.type_visiting]].map(([k, l]) => (
            <button key={k} type="button" className={typeFilter === k ? 'active' : ''} onClick={() => setTypeFilter(k)}>{l}</button>
          ))}
        </div>
        {can('telemed', 'create') && <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}><Plus size={18} /> {tt.add_doctor}</button>}
      </div>
      <div className="panel">
        {shown.length === 0 ? <p className="empty">{tt.no_docs}</p> : (
          <table className="admin-table">
            <thead><tr><th>{tt.th_name}</th><th>{tt.th_email}</th><th>{tt.th_spec}</th><th>{tt.th_type}</th><th>{tt.th_slot}</th><th>{tt.th_pub}</th><th>{tt.th_status}</th><th>{tt.th_actions}</th></tr></thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td><div className="tm-doc-card"><span className="tm-avatar">{d.photo ? <img src={d.photo} alt="" /> : <UserRound size={18} />}</span><div>{doctorName(d, lang)}<small dir="ltr">{d.phone || ''}</small></div></div></td>
                  <td dir="ltr">{d.email}</td>
                  <td>{doctorSpecialty(d, lang) || '—'}</td>
                  <td>{(d.provider_type || 'staff') === 'visiting'
                    ? <span className="badge tm-badge-visiting" title={d.organization || ''}><Briefcase size={12} /> {tt.type_visiting}{d.contract_end ? <small dir="ltr"> · {d.contract_end}</small> : null}</span>
                    : <span className="badge ok"><ShieldCheck size={12} /> {tt.type_staff}</span>}</td>
                  <td dir="ltr">{d.slot_minutes || 20} {tt.min}</td>
                  <td>{d.is_published ? <span className="badge ok">{tt.yes}</span> : <span className="badge off">{tt.no}</span>}</td>
                  <td>{d.is_active ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.suspended}</span>}</td>
                  <td className="row-actions">
                    {can('telemed', 'edit') && <button onClick={() => setModal({ mode: 'edit', doctor: d })} title={tt.edit}><Pencil size={16} /></button>}
                    {can('telemed', 'edit') && <button onClick={() => setPwUser(d)} title={tt.reset_password}><KeyRound size={16} /></button>}
                    {can('telemed', 'edit') && <button onClick={() => toggle(d)} title={tt.toggle}><Power size={16} /></button>}
                    {can('telemed', 'delete') && <button onClick={() => remove(d.id)} className="danger" title={tt.delete}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && <DoctorModal mode={modal.mode} doctor={modal.doctor} tt={tt} lang={lang} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {pwUser && <PasswordModal user={pwUser} tt={tt} onClose={() => setPwUser(null)} />}
    </>
  );
}

function DoctorModal({ mode, doctor, tt, lang, onClose, onDone }) {
  const isEdit = mode === 'edit';
  const [f, setF] = useState({
    name: doctor?.name || '', email: doctor?.email || '', phone: doctor?.phone || '', password: '',
    profession_ar: doctor?.profession_ar || '', profession_en: doctor?.profession_en || '',
    provider_type: doctor?.provider_type || 'staff', staff_ref: doctor?.staff_ref || '',
    organization: doctor?.organization || '', license_no: doctor?.license_no || '', contract_start: doctor?.contract_start || '', contract_end: doctor?.contract_end || '', contract_notes: doctor?.contract_notes || '',
    title_ar: doctor?.title_ar || '', title_en: doctor?.title_en || '', specialty_ar: doctor?.specialty_ar || '', specialty_en: doctor?.specialty_en || '',
    bio_ar: doctor?.bio_ar || '', bio_en: doctor?.bio_en || '', slot_minutes: doctor?.slot_minutes || 20, is_published: doctor ? !!doctor.is_published : true, sort_order: doctor?.sort_order || 0,
  });
  const [source, setSource] = useState(isEdit ? 'new' : 'staff'); // staff | admin | new
  const [roles, setRoles] = useState(CLINICIAN_ROLES_BI);
  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [rules, setRules] = useState([]);
  const [off, setOff] = useState([]);
  const [newOff, setNewOff] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const parse = (v) => { try { return JSON.parse(v); } catch { return null; } };

  useEffect(() => {
    if (isEdit) AdminAPI.doctor(doctor.id).then((r) => { setRules(r.availability || []); setOff(r.days_off || []); });
    // professions + staff names come from Settings (same lists used for home visits)
    AdminAPI.settings().then((rs) => {
      const get = (k) => rs.find((r) => r.key === k)?.value_ar;
      setRoles(normBiList(parse(get('clinician_roles')), CLINICIAN_ROLES_BI));
      setStaff(normStaffList(parse(get('clinical_staff')) || []));
    }).catch(() => {});
    AdminAPI.admins().then(setAdmins).catch(() => setAdmins([])); // super admin only; silently empty otherwise
  }, [doctor?.id]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const roleEn = (ar) => roles.find((r) => r.ar === ar)?.en || ar;
  const pickStaff = (key) => {
    const st = staff.find((x) => (x.name_ar || x.name_en) === key);
    if (!st) { setF((p) => ({ ...p, staff_ref: '' })); return; }
    const prof = (st.roles || [])[0] || '';
    setF((p) => ({ ...p, name: st.name_ar || st.name_en, staff_ref: st.name_ar || st.name_en, profession_ar: prof, profession_en: roleEn(prof), provider_type: 'staff' }));
  };
  const pickAdmin = (id) => {
    const a = admins.find((x) => String(x.id) === String(id));
    if (!a) return;
    setF((p) => ({ ...p, name: a.name, email: a.email, provider_type: 'staff' }));
  };
  const setProfession = (ar) => setF((p) => ({ ...p, profession_ar: ar, profession_en: roleEn(ar) }));

  const save = async () => {
    if (!f.name || !f.email || (!isEdit && !f.password)) { setError(tt.required); return; }
    if (!f.profession_ar) { setError(tt.need_profession); return; }
    if (f.phone && !isSaudiMobile(f.phone)) { setError(tt.phone_invalid); return; }
    setBusy(true); setError('');
    try {
      const payload = { ...f, is_published: f.is_published ? 1 : 0, availability: rules.filter((r) => r.start_time < r.end_time) };
      if (isEdit) await AdminAPI.updateDoctor(doctor.id, payload); else await AdminAPI.createDoctor(payload);
      onDone();
    } catch (e) {
      const code = e?.response?.data?.error;
      setError(code === 'email_taken' ? tt.email_taken : code === 'weak_password' ? tt.weak : tt.failed);
    } finally { setBusy(false); }
  };
  const addOff = async () => { if (!newOff) return; await AdminAPI.addDoctorDayOff(doctor.id, newOff); setNewOff(''); AdminAPI.doctor(doctor.id).then((r) => setOff(r.days_off || [])); };
  const removeOff = async (id) => { await AdminAPI.removeDoctorDayOff(doctor.id, id); AdminAPI.doctor(doctor.id).then((r) => setOff(r.days_off || [])); };
  const visiting = f.provider_type === 'visiting';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{isEdit ? tt.edit_doc : tt.new_doc}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}

          {/* 1) who: existing staff name, control-panel user, or a brand-new / external person */}
          {!isEdit && (
            <div className="tm-sched-box" style={{ marginTop: 0, marginBottom: 14 }}>
              <div className="field"><label>{tt.source}</label>
                <div className="tm-mode-toggle">
                  <button type="button" className={source === 'staff' ? 'active' : ''} onClick={() => setSource('staff')}><Stethoscope size={15} /> {tt.src_staff}</button>
                  {admins.length > 0 && <button type="button" className={source === 'admin' ? 'active' : ''} onClick={() => setSource('admin')}><Users2 size={15} /> {tt.src_admin}</button>}
                  <button type="button" className={source === 'new' ? 'active' : ''} onClick={() => { setSource('new'); setF((p) => ({ ...p, staff_ref: '' })); }}><Briefcase size={15} /> {tt.src_new}</button>
                </div>
              </div>
              {source === 'staff' && (
                <div className="field"><label>{tt.pick_staff}</label>
                  <select value={f.staff_ref} onChange={(e) => pickStaff(e.target.value)}>
                    <option value="">{tt.pick_staff}</option>
                    {staff.map((st) => { const k = st.name_ar || st.name_en; return <option key={k} value={k}>{biLabel({ ar: st.name_ar, en: st.name_en }, lang)}{st.roles?.length ? ` — ${st.roles.map((r) => biLabel(roles.find((x) => x.ar === r) || { ar: r }, lang)).join('، ')}` : ''}</option>; })}
                  </select>
                </div>
              )}
              {source === 'admin' && (
                <div className="field"><label>{tt.pick_admin}</label>
                  <select defaultValue="" onChange={(e) => pickAdmin(e.target.value)}>
                    <option value="">{tt.pick_admin}</option>
                    {admins.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 2) profession + type */}
          <div className="field-row">
            <div className="field"><label>{tt.profession}</label>
              <select value={f.profession_ar} onChange={(e) => setProfession(e.target.value)}>
                <option value="">{tt.profession_ph}</option>
                {f.profession_ar && !roles.some((r) => r.ar === f.profession_ar) && <option value={f.profession_ar}>{f.profession_ar}</option>}
                {roles.map((r) => <option key={r.ar} value={r.ar}>{biLabel(r, lang)}</option>)}
              </select>
            </div>
            <div className="field"><label>{tt.provider_type}</label>
              <div className="tm-mode-toggle">
                <button type="button" className={!visiting ? 'active' : ''} title={tt.staff_hint} onClick={() => setF((p) => ({ ...p, provider_type: 'staff' }))}><ShieldCheck size={15} /> {tt.type_staff}</button>
                <button type="button" className={visiting ? 'active' : ''} title={tt.visiting_hint} onClick={() => setF((p) => ({ ...p, provider_type: 'visiting' }))}><Briefcase size={15} /> {tt.type_visiting}</button>
              </div>
            </div>
          </div>

          {/* 3) visiting / contracted details */}
          {visiting && (
            <div className="tm-sched-box" style={{ marginTop: 0, marginBottom: 14 }}>
              <div className="field-row">
                <div className="field"><label>{tt.organization}</label><input value={f.organization} onChange={set('organization')} /></div>
                <div className="field"><label>{tt.license_no}</label><input dir="ltr" value={f.license_no} onChange={set('license_no')} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>{tt.contract_start}</label><DobInput iso value={f.contract_start} onChange={(v) => setF((p) => ({ ...p, contract_start: v }))} /></div>
                <div className="field"><label>{tt.contract_end}</label><DobInput iso value={f.contract_end} onChange={(v) => setF((p) => ({ ...p, contract_end: v }))} /></div>
              </div>
              <div className="field"><label>{tt.contract_notes}</label><textarea rows={2} value={f.contract_notes} onChange={set('contract_notes')} /></div>
            </div>
          )}

          {/* 4) identity + login */}
          <h3 className="block-label"><KeyRound size={16} /> {tt.login_section}</h3>
          <p className="muted" style={{ marginTop: 0, fontSize: '0.85rem' }}>{tt.login_hint}</p>
          <div className="field-row">
            <div className="field"><label>{tt.name}</label><input value={f.name} onChange={set('name')} /></div>
            <div className="field"><label>{tt.email}</label><input type="email" dir="ltr" value={f.email} onChange={set('email')} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.phone}</label><input {...phoneInputProps} value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} /></div>
            {!isEdit && <div className="field"><label>{tt.password}</label><input type="text" dir="ltr" value={f.password} onChange={set('password')} placeholder={tt.password_ph} /></div>}
          </div>

          {/* 5) profile shown to patients */}
          <div className="field-row">
            <div className="field"><label>{tt.title_ar}</label><input value={f.title_ar} onChange={set('title_ar')} placeholder="استشاري / أخصائي" /></div>
            <div className="field"><label>{tt.title_en}</label><input dir="ltr" value={f.title_en} onChange={set('title_en')} placeholder="Consultant / Specialist" /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.spec_ar}</label><input value={f.specialty_ar} onChange={set('specialty_ar')} /></div>
            <div className="field"><label>{tt.spec_en}</label><input dir="ltr" value={f.specialty_en} onChange={set('specialty_en')} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.bio_ar}</label><textarea rows={2} value={f.bio_ar} onChange={set('bio_ar')} /></div>
            <div className="field"><label>{tt.bio_en}</label><textarea rows={2} dir="ltr" value={f.bio_en} onChange={set('bio_en')} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.slot}</label><input type="number" dir="ltr" min={5} step={5} value={f.slot_minutes} onChange={set('slot_minutes')} /></div>
            <div className="field"><label>&nbsp;</label><label className="tm-check"><input type="checkbox" checked={f.is_published} onChange={(e) => setF((p) => ({ ...p, is_published: e.target.checked }))} /> <span>{tt.published}</span></label></div>
          </div>
          <h3 className="block-label"><Clock size={16} /> {tt.availability}</h3>
          <AvailabilityEditor rules={rules} onChange={setRules} />
          {isEdit && (
            <div style={{ marginTop: 16 }}>
              <h3 className="block-label">{lang === 'en' ? 'Days off' : 'أيام الإجازة'}</h3>
              {off.length > 0 && <ul className="tm-off-list">{off.map((o) => <li key={o.id}><b dir="ltr">{o.off_date}</b>{o.note && <span> — {o.note}</span>}<button type="button" className="tm-icon-btn danger" onClick={() => removeOff(o.id)}><Trash size={15} /></button></li>)}</ul>}
              <div className="tm-off-add" style={{ gridTemplateColumns: 'auto auto' }}>
                <DobInput iso value={newOff} onChange={setNewOff} />
                <button type="button" className="btn btn-outline btn-sm" onClick={addOff} disabled={!newOff}><Plus size={15} /> {lang === 'en' ? 'Add' : 'إضافة'}</button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : tt.save}</button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ user, tt, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (password.length < 6) { setError(tt.weak); return; }
    setBusy(true); setError('');
    try { await AdminAPI.setDoctorPassword(user.id, password); setDone(true); }
    catch { setError(tt.failed); } finally { setBusy(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.pw_modal}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {done ? <div className="form-alert ok">{tt.pw_done}</div> : (
            <>
              {error && <div className="form-alert error">{error}</div>}
              <p className="muted" style={{ marginTop: 0 }}>{user.name} — <span dir="ltr">{user.email}</span></p>
              <div className="field"><label>{tt.new_password}</label>
                <input type="text" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tt.password_ph} autoFocus /></div>
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          {!done && <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : tt.save}</button>}
        </div>
      </div>
    </div>
  );
}
