import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, X, ArrowRight, ArrowLeft, FilePlus2, CheckCircle2, Building2, CalendarDays, LayoutGrid, Pencil } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useSite } from '../App.jsx';
import ServiceIcon from '../components/ServiceIcon.jsx';
import Tracking, { StatusPill } from './Tracking.jsx';
import VisitsList from './Visits.jsx';
import Thread from './Thread.jsx';
import { MultiFileUpload, AttachmentList } from './Attachments.jsx';
import MiniStats from './MiniStats.jsx';
import CorrespondenceFeed from './CorrespondenceFeed.jsx';
import { CASE_FLOW } from './status.js';
import { useLang } from '../i18n.jsx';
import DobInput from '../components/DobInput.jsx';
import ServicePickerModal from '../components/ServicePickerModal.jsx';
import MiniVisitsCalendar from './MiniVisitsCalendar.jsx';

const blank = { hospital_name: '', patient_name: '', national_id: '', mobile: '', city: '', dob: '', diagnosis: '', requested_service: '' };

const T = {
  ar: {
    cases_noun: 'الحالات',
    patient_cases: 'حالات المرضى',
    new_case: 'إرسال حالة جديدة',
    no_cases: 'لا توجد حالات بعد. أرسل أول حالة لمريض.',
    none: '—',
    send_patient_case: 'إرسال حالة مريض',
    case_received: 'تم استلام الحالة',
    tracking_no: 'رقم المتابعة:',
    case_followup: 'ستُحوَّل الحالة للمراجعة الطبية ومعالجتها من فريق رؤى.',
    view_cases: 'عرض الحالات',
    hospital_label: 'اسم المستشفى (Hospital)',
    patient_label: 'اسم المريض (Patient)',
    id_label: 'رقم الهوية (ID)',
    mobile_label: 'رقم الجوال (Mobile)',
    city_label: 'مدينة السكن (City)',
    dob_label: 'تاريخ الميلاد (DOB)',
    service_label: 'الخدمة المطلوبة (Service)',
    ph_hospital: 'أدخل اسم المستشفى',
    ph_patient: 'أدخل اسم المريض',
    ph_id: 'أدخل رقم الهوية',
    ph_mobile: 'أدخل رقم الجوال',
    ph_city: 'أدخل مدينة السكن',
    ph_service: 'اختر الخدمة من القائمة',
    ph_diagnosis: 'أدخل التشخيص أو الحالة الطبية',
    choose_service: 'اختيار من قائمة الخدمات',
    choose_service_title: 'اختر الخدمات المطلوبة',
    search_service: 'ابحث عن خدمة...',
    no_services: 'لا توجد خدمات مطابقة.',
    add_selected: 'إضافة المحدد',
    multi_hint: 'يمكنك اختيار أكثر من خدمة',
    custom_service_ph: 'خدمة أخرى غير موجودة بالقائمة؟ اكتبها هنا',
    add_custom: 'إضافة',
    diagnosis_label: 'التشخيص (Diagnosis)',
    cancel: 'إلغاء',
    sending: 'جارٍ الإرسال...',
    send_case: 'إرسال الحالة',
    edit: 'تعديل',
    edit_case_title: 'تعديل بيانات الحالة',
    save_changes: 'حفظ التعديلات',
    saving: 'جارٍ الحفظ...',
    back_to_cases: 'رجوع للحالات',
    row_hospital: 'المستشفى',
    row_patient: 'المريض',
    row_id: 'رقم الهوية',
    row_mobile: 'الجوال',
    row_city: 'المدينة',
    row_dob: 'تاريخ الميلاد',
    row_service: 'الخدمة المطلوبة',
    diagnosis: 'التشخيص',
    sent_attachments: 'المرفقات المرسلة',
    case_followup_title: 'متابعة الحالة',
    visits: 'الزيارات',
    thread_title: 'المراسلات مع إدارة رؤى',
  },
  en: {
    cases_noun: 'cases',
    patient_cases: 'Patient cases',
    new_case: 'Submit a new case',
    no_cases: 'No cases yet. Submit your first patient case.',
    none: '—',
    send_patient_case: 'Submit patient case',
    case_received: 'Case received',
    tracking_no: 'Reference number:',
    case_followup: 'The case will be forwarded to the RU-MD team for medical review and processing.',
    view_cases: 'View cases',
    hospital_label: 'Hospital name',
    patient_label: 'Patient name',
    id_label: 'ID number',
    mobile_label: 'Mobile number',
    city_label: 'City of residence',
    dob_label: 'Date of birth (DOB)',
    service_label: 'Requested service',
    ph_hospital: 'Enter the hospital name',
    ph_patient: 'Enter the patient name',
    ph_id: 'Enter the ID number',
    ph_mobile: 'Enter the mobile number',
    ph_city: 'Enter the city of residence',
    ph_service: 'Choose a service from the list',
    ph_diagnosis: 'Enter the diagnosis or medical condition',
    choose_service: 'Choose from the services list',
    choose_service_title: 'Choose the requested services',
    search_service: 'Search for a service...',
    no_services: 'No matching services.',
    add_selected: 'Add selected',
    multi_hint: 'You can select more than one service',
    custom_service_ph: 'Another service not in the list? Type it here',
    add_custom: 'Add',
    diagnosis_label: 'Diagnosis',
    cancel: 'Cancel',
    sending: 'Sending...',
    send_case: 'Submit case',
    edit: 'Edit',
    edit_case_title: 'Edit case details',
    save_changes: 'Save changes',
    saving: 'Saving...',
    back_to_cases: 'Back to cases',
    row_hospital: 'Hospital',
    row_patient: 'Patient',
    row_id: 'ID number',
    row_mobile: 'Mobile',
    row_city: 'City',
    row_dob: 'Date of birth',
    row_service: 'Requested service',
    diagnosis: 'Diagnosis',
    sent_attachments: 'Submitted attachments',
    case_followup_title: 'Case tracking',
    visits: 'Visits',
    thread_title: 'Messages with RU-MD administration',
  },
};

export default function InsurancePortal() {
  const { lang } = useLang();
  const tt = T[lang];
  const [cases, setCases] = useState([]);
  const [feed, setFeed] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => {
    AccountAPI.myCases().then(setCases).catch(() => {});
    AccountAPI.allMessages().then(setFeed).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="portal-body">
      {cases.length > 0 && <MiniStats items={cases} noun={tt.cases_noun} />}

      <div className="cases-layout">
        <aside className="corr-col">
          <CorrespondenceFeed items={feed} linkBase="/portal/cases" />
          <MiniVisitsCalendar />
        </aside>

        <section className="cases-col">
          <div className="portal-section-head">
            <h2 className="portal-h2"><Building2 size={20} /> {tt.patient_cases}</h2>
            <button className="btn btn-primary" onClick={() => setOpen(true)}><FilePlus2 size={18} /> {tt.new_case}</button>
          </div>
          {cases.length === 0 ? (
            <div className="panel empty">{tt.no_cases}</div>
          ) : (
            <div className="req-list">
              {cases.map((c) => (
                <Link key={c.id} to={`/portal/cases/${c.id}`} className="req-row">
                  <div>
                    <strong>{c.patient_name}</strong>
                    <small>{c.ref} · {c.requested_service || tt.none} · {new Date(c.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</small>
                  </div>
                  <div className="req-row-end">
                    <StatusPill status={c.status} audience="client" />
                    <ArrowLeft size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {open && <CaseModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function CaseModal({ onClose, onDone }) {
  const { lang } = useLang();
  const tt = T[lang];
  const site = useSite();
  const [services, setServices] = useState([]);
  useEffect(() => { AccountAPI.myServices().then(setServices).catch(() => setServices(site?.services || [])); }, []);
  const [f, setF] = useState(blank);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [pickSvc, setPickSvc] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { setDone(await AccountAPI.createCase({ ...f, attachments: files })); }
    finally { setBusy(false); }
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal portal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.send_patient_case}</h2><button onClick={onClose}><X size={20} /></button></div>
        {done ? (
          <div className="modal-body success-box">
            <CheckCircle2 size={48} className="success-icon" />
            <h3>{tt.case_received}</h3>
            <p>{tt.tracking_no} <b dir="ltr">{done.ref}</b></p>
            <p className="muted">{tt.case_followup}</p>
            <button className="btn btn-primary" onClick={onDone}>{tt.view_cases}</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="field"><label>{tt.hospital_label}</label><input value={f.hospital_name} onChange={set('hospital_name')} placeholder={tt.ph_hospital} /></div>
              <div className="field-row">
                <div className="field"><label>{tt.patient_label}</label><input value={f.patient_name} onChange={set('patient_name')} required placeholder={tt.ph_patient} /></div>
                <div className="field"><label>{tt.id_label}</label><input dir="ltr" inputMode="numeric" value={f.national_id} onChange={set('national_id')} placeholder={tt.ph_id} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>{tt.mobile_label}</label><input dir="ltr" inputMode="tel" value={f.mobile} onChange={set('mobile')} placeholder={tt.ph_mobile} /></div>
                <div className="field"><label>{tt.city_label}</label><input value={f.city} onChange={set('city')} placeholder={tt.ph_city} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>{tt.dob_label}</label><DobInput value={f.dob} onChange={(v) => setF((p) => ({ ...p, dob: v }))} /></div>
                <div className="field"><label>{tt.service_label}</label>
                  <div className="paste-row">
                    <input value={f.requested_service} readOnly onClick={() => setPickSvc(true)} placeholder={tt.ph_service} style={{ cursor: 'pointer' }} />
                    <button type="button" className="btn btn-outline btn-sm svc-pick-btn" onClick={() => setPickSvc(true)} title={tt.choose_service}><LayoutGrid size={16} /></button>
                  </div>
                </div>
              </div>
              <div className="field"><label>{tt.diagnosis_label}</label><textarea rows={3} value={f.diagnosis} onChange={set('diagnosis')} placeholder={tt.ph_diagnosis} /></div>
              <MultiFileUpload items={files} onChange={setFiles} uploadFn={AccountAPI.uploadFile} />
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? tt.sending : tt.send_case}</button>
            </div>
          </form>
        )}
      </div>
    </div>
    {pickSvc && (
      <ServicePickerModal
        services={services}
        initial={f.requested_service}
        onApply={(names) => { setF((p) => ({ ...p, requested_service: names })); setPickSvc(false); }}
        onClose={() => setPickSvc(false)}
      />
    )}
    </>
  );
}

// ServicePickerModal now lives in ../components/ServicePickerModal.jsx (shared with admin).

export function CaseDetail() {
  const { lang } = useLang();
  const tt = T[lang];
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [editing, setEditing] = useState(false);
  const load = () => AccountAPI.case(id).then(setC).catch(() => nav('/portal'));
  useEffect(() => { load(); }, [id]);
  if (!c) return <div className="page-loader"><div className="spinner" /></div>;
  const sendMsg = async (payload) => { await AccountAPI.sendCaseMessage(id, payload); await load(); };
  const canEdit = !['completed', 'rejected', 'cancelled'].includes(c.status);

  const rows = [
    [tt.row_hospital, c.hospital_name], [tt.row_patient, c.patient_name], [tt.row_id, c.national_id],
    [tt.row_mobile, c.mobile], [tt.row_city, c.city], [tt.row_dob, c.dob], [tt.row_service, c.requested_service],
  ];

  return (
    <div className="detail-view wide">
      <button className="back-link" onClick={() => nav('/portal')}><ArrowRight size={16} /> {tt.back_to_cases}</button>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-card-head">
              <div><h2>{c.patient_name}</h2><span className="ref-code" dir="ltr">{c.ref}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {canEdit && <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> {tt.edit}</button>}
                <StatusPill status={c.status} audience="client" />
              </div>
            </div>
            <div className="detail-meta wide">
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><span>{k}</span><b dir="auto">{v}</b></div>
              ))}
            </div>
            {c.diagnosis && <div className="detail-diag"><span>{tt.diagnosis}</span><p dir="ltr">{c.diagnosis}</p></div>}
            {c.attachments?.length > 0 && <div className="detail-atts"><AttachmentList items={c.attachments} label={tt.sent_attachments} /></div>}
          </div>

          <h3 className="track-title">{tt.case_followup_title}</h3>
          <Tracking flow={CASE_FLOW} status={c.status} events={c.events} audience="client" />
        </div>

        <aside className="detail-side">
          {c.visits?.length > 0 && (
            <div className="side-card">
              <div className="side-card-head"><CalendarDays size={18} /> <h3>{tt.visits}</h3></div>
              <div className="side-card-body"><VisitsList visits={c.visits} /></div>
            </div>
          )}
          <Thread messages={c.messages || []} currentRole="user" onSend={sendMsg} onUpload={AccountAPI.uploadFile} title={tt.thread_title} />
        </aside>
      </div>
      {editing && <CaseEditModal c={c} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
    </div>
  );
}

function CaseEditModal({ c, onClose, onSaved }) {
  const { lang } = useLang();
  const tt = T[lang];
  const site = useSite();
  const [services, setServices] = useState([]);
  useEffect(() => { AccountAPI.myServices().then(setServices).catch(() => setServices(site?.services || [])); }, []);
  const [f, setF] = useState({
    hospital_name: c.hospital_name || '', patient_name: c.patient_name || '', national_id: c.national_id || '',
    mobile: c.mobile || '', city: c.city || '', dob: c.dob || '', diagnosis: c.diagnosis || '', requested_service: c.requested_service || '',
  });
  const [pickSvc, setPickSvc] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await AccountAPI.updateCase(c.id, f); onSaved(); }
    finally { setBusy(false); }
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal portal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.edit_case_title}</h2><button onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={save}>
          <div className="modal-body">
            <div className="field"><label>{tt.hospital_label}</label><input value={f.hospital_name} onChange={set('hospital_name')} placeholder={tt.ph_hospital} /></div>
            <div className="field-row">
              <div className="field"><label>{tt.patient_label}</label><input value={f.patient_name} onChange={set('patient_name')} required placeholder={tt.ph_patient} /></div>
              <div className="field"><label>{tt.id_label}</label><input dir="ltr" inputMode="numeric" value={f.national_id} onChange={set('national_id')} placeholder={tt.ph_id} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>{tt.mobile_label}</label><input dir="ltr" inputMode="tel" value={f.mobile} onChange={set('mobile')} placeholder={tt.ph_mobile} /></div>
              <div className="field"><label>{tt.city_label}</label><input value={f.city} onChange={set('city')} placeholder={tt.ph_city} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>{tt.dob_label}</label><DobInput value={f.dob} onChange={(v) => setF((p) => ({ ...p, dob: v }))} /></div>
              <div className="field"><label>{tt.service_label}</label>
                <div className="paste-row">
                  <input value={f.requested_service} readOnly onClick={() => setPickSvc(true)} placeholder={tt.ph_service} style={{ cursor: 'pointer' }} />
                  <button type="button" className="btn btn-outline btn-sm svc-pick-btn" onClick={() => setPickSvc(true)} title={tt.choose_service}><LayoutGrid size={16} /></button>
                </div>
              </div>
            </div>
            <div className="field"><label>{tt.diagnosis_label}</label><textarea rows={3} value={f.diagnosis} onChange={set('diagnosis')} placeholder={tt.ph_diagnosis} /></div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? tt.saving : tt.save_changes}</button>
          </div>
        </form>
      </div>
    </div>
    {pickSvc && (
      <ServicePickerModal
        services={services}
        initial={f.requested_service}
        onApply={(names) => { setF((p) => ({ ...p, requested_service: names })); setPickSvc(false); }}
        onClose={() => setPickSvc(false)}
      />
    )}
    </>
  );
}
