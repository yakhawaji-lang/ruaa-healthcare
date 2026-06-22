import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, X, Save, Pencil, LayoutGrid, Trash2 } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import Tracking, { StatusPill } from '../account/Tracking.jsx';
import Thread from '../account/Thread.jsx';
import { AttachmentList } from '../account/Attachments.jsx';
import VisitScheduler from './VisitScheduler.jsx';
import WorkflowPanel from './WorkflowPanel.jsx';
import { CASE_FLOW } from '../account/status.js';
import { useLang } from '../i18n.jsx';
import DobInput from '../components/DobInput.jsx';
import ServicePickerModal from '../components/ServicePickerModal.jsx';

const T = {
  ar: {
    title: 'حالات التأمين', no_cases: 'لا توجد حالات.',
    ref: 'الرقم', insurer: 'شركة التأمين', patient: 'المريض', service: 'الخدمة', status: 'الحالة',
    case: 'حالة', hospital: 'المستشفى', national_id: 'رقم الهوية', mobile: 'الجوال', city: 'المدينة',
    dob: 'تاريخ الميلاد', requested_service: 'الخدمة المطلوبة', diagnosis: 'التشخيص',
    acct_active: 'حساب المريض في البوابة مُفعّل',
    acct_creds_pre: 'اسم المستخدم: ', acct_creds_mid: ' (الجوال) — كلمة المرور: رقم هوية المريض',
    attachments: 'المرفقات المرسلة', track_log: 'سجل المتابعة',
    insurer_correspondence: 'المراسلات مع شركة التأمين',
    edit: 'تعديل', edit_case_title: 'تعديل بيانات الحالة', save_changes: 'حفظ التعديلات',
    saving: 'جارٍ الحفظ...', cancel: 'إلغاء', save_failed: 'تعذّر حفظ التعديلات',
    delete: 'حذف', confirm_delete: 'حذف هذه الحالة نهائيًا مع زياراتها ومرفقاتها ومراسلاتها؟ (لن يُحذف حساب العميل)',
  },
  en: {
    title: 'Insurance Cases', no_cases: 'No cases.',
    ref: 'Ref', insurer: 'Insurance company', patient: 'Patient', service: 'Service', status: 'Status',
    case: 'Case', hospital: 'Hospital', national_id: 'National ID', mobile: 'Mobile', city: 'City',
    dob: 'Date of birth', requested_service: 'Requested service', diagnosis: 'Diagnosis',
    acct_active: 'Patient portal account is active',
    acct_creds_pre: 'Username: ', acct_creds_mid: ' (mobile) — Password: patient national ID',
    attachments: 'Submitted attachments', track_log: 'Tracking log',
    insurer_correspondence: 'Correspondence with insurance company',
    edit: 'Edit', edit_case_title: 'Edit case details', save_changes: 'Save changes',
    saving: 'Saving...', cancel: 'Cancel', save_failed: 'Could not save changes',
    delete: 'Delete', confirm_delete: 'Permanently delete this case with its visits, attachments and messages? (The client account will be kept)',
  },
};

export default function InsuranceCasesManager() {
  const { lang } = useLang();
  const { can } = useAdminAuth();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [params, setParams] = useSearchParams();

  const load = () => AdminAPI.cases().then(setList);
  useEffect(() => { load(); }, []);
  const open = async (id) => setActive(await AdminAPI.case(id));
  const remove = async (e, id) => { e.stopPropagation(); if (confirm(tt.confirm_delete)) { await AdminAPI.deleteCase(id); load(); } };
  const canDelete = can('cases', 'delete');

  // auto-open a specific case when arriving from a notification (?open=ID)
  const openId = params.get('open');
  useEffect(() => {
    if (openId) { open(openId); params.delete('open'); setParams(params, { replace: true }); }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="page-title">{tt.title}</h1>
      <div className="panel">
        {list.length === 0 ? <p className="empty">{tt.no_cases}</p> : (
          <table className="admin-table">
            <thead><tr><th>{tt.ref}</th><th>{tt.insurer}</th><th>{tt.patient}</th><th>{tt.service}</th><th>{tt.status}</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td dir="ltr">{c.ref}</td>
                  <td>{c.company_name || c.user_name}</td>
                  <td>{c.patient_name}<br /><small className="muted" dir="ltr">{c.national_id || ''}</small></td>
                  <td dir="ltr">{c.requested_service || '—'}</td>
                  <td><StatusPill status={c.status} /></td>
                  <td className="row-actions">
                    <button className="icon-act" onClick={() => open(c.id)}><Eye size={16} /></button>
                    {canDelete && <button className="icon-act danger" title={tt.delete} onClick={(e) => remove(e, c.id)}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {active && <CaseDrawer data={active} onClose={() => setActive(null)} onSaved={(d) => { setActive(d); load(); }} />}
    </div>
  );
}

function CaseDrawer({ data, onClose, onSaved }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [editing, setEditing] = useState(false);
  const reload = async () => { const fresh = await AdminAPI.case(data.id); onSaved(fresh); };

  const rows = [
    [tt.hospital, data.hospital_name], [tt.patient, data.patient_name], [tt.national_id, data.national_id],
    [tt.mobile, data.mobile], [tt.city, data.city], [tt.dob, data.dob], [tt.requested_service, data.requested_service],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{tt.case} {data.ref}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> {tt.edit}</button>
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        {editing && <CaseAdminEditModal data={data} onClose={() => setEditing(false)} onSaved={async () => { setEditing(false); await reload(); }} />}
        <div className="modal-body">
          <div className="detail-meta wide">
            {rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><span>{k}</span><b dir="auto">{v}</b></div>)}
          </div>
          {data.diagnosis && <div className="detail-diag"><span>{tt.diagnosis}</span><p dir="ltr">{data.diagnosis}</p></div>}
          {data.patient_user_id && (
            <div className="patient-acct">
              <strong>{tt.acct_active}</strong>
              <span>{tt.acct_creds_pre}<b dir="ltr">{data.mobile}</b>{tt.acct_creds_mid}</span>
            </div>
          )}
          {data.attachments?.length > 0 && <div className="detail-atts"><AttachmentList items={data.attachments} label={tt.attachments} /></div>}

          <WorkflowPanel kind="case" id={data.id} status={data.status} onDone={reload} />

          <VisitScheduler refType="insurance_case" refId={data.id} visits={data.visits || []} onChange={reload} />

          <h3 className="track-title">{tt.track_log}</h3>
          <Tracking flow={CASE_FLOW} status={data.status} events={data.events || []} />

          <Thread messages={data.messages || []} currentRole="admin" onSend={async (payload) => { await AdminAPI.sendCaseMessage(data.id, payload); await reload(); }} onUpload={AdminAPI.uploadFile} title={tt.insurer_correspondence} />
        </div>
      </div>
    </div>
  );
}

function CaseAdminEditModal({ data, onClose, onSaved }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [f, setF] = useState({
    hospital_name: data.hospital_name || '', patient_name: data.patient_name || '', national_id: data.national_id || '',
    mobile: data.mobile || '', city: data.city || '', dob: data.dob || '', diagnosis: data.diagnosis || '', requested_service: data.requested_service || '',
  });
  const [services, setServices] = useState([]);
  const [pickSvc, setPickSvc] = useState(false);
  useEffect(() => { AdminAPI.services().then(setServices).catch(() => {}); }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    if (!f.patient_name.trim()) { setError(tt.save_failed); return; }
    setBusy(true); setError('');
    try { await AdminAPI.updateCaseDetails(data.id, f); onSaved(); }
    catch (e) { setError(tt.save_failed); }
    finally { setBusy(false); }
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.edit_case_title}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}
          <div className="field"><label>{tt.hospital}</label><input value={f.hospital_name} onChange={set('hospital_name')} /></div>
          <div className="field-row">
            <div className="field"><label>{tt.patient}</label><input value={f.patient_name} onChange={set('patient_name')} required /></div>
            <div className="field"><label>{tt.national_id}</label><input dir="ltr" inputMode="numeric" value={f.national_id} onChange={set('national_id')} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.mobile}</label><input dir="ltr" inputMode="tel" value={f.mobile} onChange={set('mobile')} /></div>
            <div className="field"><label>{tt.city}</label><input value={f.city} onChange={set('city')} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.dob}</label><DobInput value={f.dob} onChange={(v) => setF((p) => ({ ...p, dob: v }))} /></div>
            <div className="field"><label>{tt.requested_service}</label>
              <div className="paste-row">
                <input value={f.requested_service} readOnly onClick={() => setPickSvc(true)} style={{ cursor: 'pointer' }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setPickSvc(true)}><LayoutGrid size={16} /></button>
              </div>
            </div>
          </div>
          <div className="field"><label>{tt.diagnosis}</label><textarea rows={3} value={f.diagnosis} onChange={set('diagnosis')} /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}><Save size={16} /> {busy ? tt.saving : tt.save_changes}</button>
        </div>
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
