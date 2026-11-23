import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, X, Save, Pencil, LayoutGrid, Trash2, Building2, Search, FileSpreadsheet, UserRound } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import Tracking, { StatusPill } from '../account/Tracking.jsx';
import Thread from '../account/Thread.jsx';
import { AttachmentList } from '../account/Attachments.jsx';
import VisitScheduler from './VisitScheduler.jsx';
import WorkflowPanel from './WorkflowPanel.jsx';
import { CASE_FLOW, CASE_STATUSES, statusLabel, fmtDate } from '../account/status.js';
import ShareButtons from '../components/ShareButtons.jsx';
import ExcelImportModal from '../components/ExcelImportModal.jsx';
import DataTable from '../components/DataTable.jsx';
import { caseText, phonesIn } from '../share/whatsapp.js';
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
    all_insurers: 'كل شركات التأمين', all_statuses: 'كل المراحل', search_ph: 'بحث بالاسم أو الهوية أو الجوال أو رقم الحالة',
    showing: (a, b) => `عرض ${a} من ${b}`, clear: 'مسح الفلتر', no_match: 'لا توجد حالات مطابقة للفلتر.',
    referred_by: 'المحوِّل', coordinator: 'المنسّق', coordinator_name: 'اسم المنسّق', coordinator_phone: 'جوال المنسّق', not_recorded: 'غير مسجّل',
    load_failed: 'تعذّر تحميل الحالات من الخادم.', retry: 'إعادة المحاولة',
    col_visits: 'الزيارات', next: 'القادمة', col_atts: 'المرفقات', col_source: 'المصدر', col_updated: 'آخر تحديث',
    src_form: 'نموذج', src_excel: 'Excel (الشركة)', src_admin_excel: 'Excel (الإدارة)',
    import_xl: 'استيراد من Excel', share: 'مشاركة واتساب', via_excel: 'Excel', created: 'تاريخ الإرسال',
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
    all_insurers: 'All insurance companies', all_statuses: 'All stages', search_ph: 'Search name, ID, mobile or case number',
    showing: (a, b) => `Showing ${a} of ${b}`, clear: 'Clear filters', no_match: 'No cases match the filter.',
    referred_by: 'Referred by', coordinator: 'Coordinator', coordinator_name: 'Coordinator name', coordinator_phone: 'Coordinator mobile', not_recorded: 'Not recorded',
    load_failed: 'Could not load cases from the server.', retry: 'Retry',
    col_visits: 'Visits', next: 'next', col_atts: 'Attachments', col_source: 'Source', col_updated: 'Last update',
    src_form: 'Form', src_excel: 'Excel (insurer)', src_admin_excel: 'Excel (admin)',
    import_xl: 'Import from Excel', share: 'Share on WhatsApp', via_excel: 'Excel', created: 'Submitted',
  },
};

const AR = '٠١٢٣٤٥٦٧٨٩';
const norm = (v) => String(v ?? '').toLowerCase().replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/\s+/g, ' ').trim();
const digitsOnly = (v) => norm(v).replace(/\D/g, '');

export default function InsuranceCasesManager() {
  const { lang } = useLang();
  const { can } = useAdminAuth();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [importing, setImporting] = useState(false);
  const [insurers, setInsurers] = useState([]);
  const [params, setParams] = useSearchParams();

  const [loadErr, setLoadErr] = useState(false);
  const load = () => AdminAPI.cases().then((r) => { setList(r); setLoadErr(false); }).catch(() => setLoadErr(true));
  useEffect(() => { load(); }, []);
  const open = async (id) => setActive(await AdminAPI.case(id));
  const remove = async (e, id) => { e.stopPropagation(); if (confirm(tt.confirm_delete)) { await AdminAPI.deleteCase(id); load(); } };
  const canDelete = can('cases', 'delete');
  const canCreate = can('cases', 'create');

  // auto-open a specific case when arriving from a notification (?open=ID)
  const openId = params.get('open');
  useEffect(() => {
    if (openId) { open(openId); params.delete('open'); setParams(params, { replace: true }); }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  // filters live in the URL so they survive opening a case and can be shared
  const fInsurer = params.get('insurer') || '';
  const fStatus = params.get('status') || '';
  const q = params.get('q') || '';
  const setParam = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const insurerOpts = useMemo(() => {
    const m = new Map();
    for (const c of list) {
      const id = String(c.user_id);
      const cur = m.get(id) || { id, name: c.company_name || c.user_name || `#${id}`, n: 0 };
      cur.n++; m.set(id, cur);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  const shown = useMemo(() => {
    const nq = norm(q), dq = digitsOnly(q);
    return list.filter((c) => {
      if (fInsurer && String(c.user_id) !== fInsurer) return false;
      if (fStatus && c.status !== fStatus) return false;
      if (nq) {
        const text = norm([c.ref, c.patient_name, c.hospital_name, c.requested_service, c.submitted_by_name, c.coordinator_name].join(' '));
        const nums = digitsOnly([c.national_id, c.mobile, c.coordinator_phone, c.ref].join(' '));
        if (!text.includes(nq) && !(dq.length >= 3 && nums.includes(dq))) return false;
      }
      return true;
    });
  }, [list, fInsurer, fStatus, q]);
  const filtered = fInsurer || fStatus || q;

  const srcLabel = (v) => (v ? tt['src_' + v] || v : '');
  const dash = (v) => (v == null || v === '' ? '—' : v);
  const columns = [
    { key: 'ref', label: tt.ref, required: true, dir: 'ltr', nowrap: true, render: (c) => <b className="dt-ref">{c.ref}</b> },
    { key: 'created_at', label: tt.created, nowrap: true, value: (c) => c.created_at, render: (c) => <span dir="ltr">{fmtDate(c.created_at)}</span> },
    { key: 'insurer', wide: true, label: tt.insurer, value: (c) => c.company_name || c.user_name, render: (c) => c.company_name || c.user_name },
    { key: 'submitted_by', label: tt.referred_by, value: (c) => c.submitted_by_name, render: (c) => (c.submitted_by_name ? <span className="dt-sub"><UserRound size={12} /> {c.submitted_by_name}</span> : <span className="muted">—</span>) },
    { key: 'coordinator', label: tt.coordinator, default: false, value: (c) => c.coordinator_name, render: (c) => (c.coordinator_name || c.coordinator_phone ? <>{c.coordinator_name}{c.coordinator_phone && <><br /><small className="muted" dir="ltr">{c.coordinator_phone}</small></>}</> : '—') },
    { key: 'hospital', label: tt.hospital, default: false, value: (c) => c.hospital_name, render: (c) => dash(c.hospital_name) },
    { key: 'patient', wide: true, label: tt.patient, required: true, value: (c) => c.patient_name, render: (c) => <>{c.patient_name}<br /><small className="muted" dir="ltr">{c.national_id || ''}</small></> },
    { key: 'national_id', label: tt.national_id, default: false, dir: 'ltr', render: (c) => dash(c.national_id) },
    { key: 'mobile', label: tt.mobile, default: false, dir: 'ltr', nowrap: true, render: (c) => (c.mobile ? phonesIn(c.mobile).map((m) => <div key={m}>{m}</div>) : '—') },
    { key: 'city', label: tt.city, default: false, render: (c) => dash(c.city) },
    { key: 'dob', label: tt.dob, default: false, dir: 'ltr', render: (c) => dash(c.dob) },
    { key: 'service', wide: true, label: tt.service, value: (c) => c.requested_service, render: (c) => <span dir="auto">{c.requested_service || '—'}</span> },
    { key: 'diagnosis', wide: true, label: tt.diagnosis, default: false, value: (c) => c.diagnosis, render: (c) => (c.diagnosis ? <span className="dt-clip" dir="auto" title={c.diagnosis}>{c.diagnosis}</span> : '—') },
    { key: 'visits', label: tt.col_visits, value: (c) => c.next_visit || (c.visits_count ? '~' : ''), render: (c) => (Number(c.visits_count) ? <span className="dt-visits"><b>{c.visits_count}</b>{c.next_visit && <small dir="ltr">{tt.next}: {fmtDate(c.next_visit)} {String(c.next_visit).slice(11, 16)}</small>}</span> : '—') },
    { key: 'attachments', label: tt.col_atts, default: false, value: (c) => Number(c.attachments_count) || 0, render: (c) => (Number(c.attachments_count) || '—') },
    { key: 'source', label: tt.col_source, default: false, value: (c) => c.source, render: (c) => dash(srcLabel(c.source)) },
    { key: 'updated_at', label: tt.col_updated, default: false, nowrap: true, value: (c) => c.updated_at, render: (c) => <span dir="ltr">{fmtDate(c.updated_at)}</span> },
    { key: 'status', label: tt.status, required: true, value: (c) => CASE_STATUSES.indexOf(c.status), render: (c) => <StatusPill status={c.status} /> },
  ];

  const openImport = async () => {
    setImporting(true);
    if (!insurers.length) AdminAPI.importInsurers().then(setInsurers).catch(() => setInsurers(insurerOpts.map((i) => ({ id: i.id, name: i.name }))));
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{tt.title}</h1>
        {canCreate && <button className="btn btn-outline" onClick={openImport}><FileSpreadsheet size={17} /> {tt.import_xl}</button>}
      </div>

      <div className="panel">
        {loadErr ? <div className="form-alert error">{tt.load_failed} <button className="btn btn-ghost btn-sm" onClick={load}>{tt.retry}</button></div> : (
          <DataTable
            id="cases"
            columns={columns}
            rows={shown}
            onRowClick={(c) => open(c.id)}
            empty={<p className="empty">{list.length === 0 ? tt.no_cases : tt.no_match}</p>}
            toolbar={(
              <div className="case-filters">
                <div className="cf-search">
                  <Search size={16} />
                  <input value={q} onChange={(e) => setParam('q', e.target.value)} placeholder={tt.search_ph} />
                </div>
                <select value={fInsurer} onChange={(e) => setParam('insurer', e.target.value)} className={fInsurer ? 'on' : ''}>
                  <option value="">{tt.all_insurers} ({list.length})</option>
                  {insurerOpts.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.n})</option>)}
                </select>
                <select value={fStatus} onChange={(e) => setParam('status', e.target.value)} className={fStatus ? 'on' : ''}>
                  <option value="">{tt.all_statuses}</option>
                  {CASE_STATUSES.map((st) => <option key={st} value={st}>{statusLabel(st, lang)}</option>)}
                </select>
                {filtered && <button className="btn btn-ghost btn-sm" onClick={clearAll}><X size={14} /> {tt.clear}</button>}
                <span className="cf-count">{tt.showing(shown.length, list.length)}</span>
              </div>
            )}
            actions={(c) => (
              <>
                <button className="icon-act" onClick={() => open(c.id)}><Eye size={16} /></button>
                <ShareButtons compact text={() => AdminAPI.case(c.id).then((d) => caseText(d, lang))} />
                {canDelete && <button className="icon-act danger" title={tt.delete} onClick={(e) => remove(e, c.id)}><Trash2 size={16} /></button>}
              </>
            )}
          />
        )}
      </div>
      {active && <CaseDrawer data={active} onClose={() => setActive(null)} onSaved={(d) => { setActive(d); load(); }} />}
      {importing && (
        <ExcelImportModal
          mode="admin"
          insurers={insurers}
          defaultInsurer={fInsurer}
          api={{ template: AdminAPI.casesTemplate, preview: AdminAPI.casesImportPreview, run: AdminAPI.casesImport }}
          onClose={() => setImporting(false)}
          onDone={() => load()}
        />
      )}
    </div>
  );
}

function CaseDrawer({ data, onClose, onSaved }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [editing, setEditing] = useState(false);
  const reload = async () => { const fresh = await AdminAPI.case(data.id); onSaved(fresh); };

  const insurerName = data.company_name || data.user_name;
  const coordinator = [data.coordinator_name, data.coordinator_phone].filter(Boolean).join(' — ');
  const rows = [
    [tt.insurer, insurerName], [tt.referred_by, data.submitted_by_name || tt.not_recorded], [tt.coordinator, coordinator], [tt.hospital, data.hospital_name], [tt.patient, data.patient_name], [tt.national_id, data.national_id],
    [tt.mobile, data.mobile], [tt.city, data.city], [tt.dob, data.dob], [tt.requested_service, data.requested_service],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="case-head-title">
            <h2>{tt.case} {data.ref}</h2>
            {insurerName && <span className="case-insurer-chip" title={tt.insurer}><Building2 size={14} /> {insurerName}</span>}
          </div>
          <div className="modal-head-actions">
            <ShareButtons text={caseText(data, lang)} />
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
    coordinator_name: data.coordinator_name || '', coordinator_phone: data.coordinator_phone || '',
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
          <div className="field-row">
            <div className="field"><label>{tt.coordinator_name}</label><input value={f.coordinator_name} onChange={set('coordinator_name')} /></div>
            <div className="field"><label>{tt.coordinator_phone}</label><input dir="ltr" inputMode="tel" value={f.coordinator_phone} onChange={set('coordinator_phone')} /></div>
          </div>
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
