import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, X, Save, Trash2, Search } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import Tracking, { StatusPill } from '../account/Tracking.jsx';
import Thread from '../account/Thread.jsx';
import VisitScheduler from './VisitScheduler.jsx';
import WorkflowPanel from './WorkflowPanel.jsx';
import { REQUEST_FLOW, REQUEST_STATUSES, statusLabel, fmtDate } from '../account/status.js';
import DataTable from '../components/DataTable.jsx';
import { useColLabels } from '../components/colLabels.js';
import { phonesIn } from '../share/whatsapp.js';
import { useLang } from '../i18n.jsx';
import ShareButtons from '../components/ShareButtons.jsx';
import { requestText } from '../share/whatsapp.js';

const PROFILE_LABELS = {
  ar: { gender: 'الجنس', dob: 'الميلاد', blood_type: 'فصيلة الدم', address: 'العنوان', chronic_conditions: 'أمراض مزمنة', allergies: 'حساسية', medications: 'أدوية', emergency_name: 'طوارئ', emergency_phone: 'هاتف طوارئ' },
  en: { gender: 'Gender', dob: 'Date of birth', blood_type: 'Blood type', address: 'Address', chronic_conditions: 'Chronic conditions', allergies: 'Allergies', medications: 'Medications', emergency_name: 'Emergency contact', emergency_phone: 'Emergency phone' },
};

const T = {
  ar: {
    title: 'طلبات الخدمات', no_requests: 'لا توجد طلبات.',
    ref: 'الرقم', client: 'العميل', service: 'الخدمة', price: 'السعر', status: 'الحالة',
    sar: 'ر.س', request: 'طلب', patient: 'المريض', mobile: 'الجوال', city: 'المدينة',
    preferred_date: 'التاريخ المفضّل', patient_file: 'الملف الطبي للمريض',
    track_log: 'سجل المتابعة', client_correspondence: 'المراسلات مع العميل',
    delete: 'حذف', confirm_delete: 'حذف هذا الطلب نهائيًا مع جميع زياراته ومرفقاته ومراسلاته؟',
    search_ph: 'بحث بالرقم أو العميل أو الجوال أو الخدمة', all_statuses: 'كل المراحل',
  },
  en: {
    title: 'Service Requests', no_requests: 'No requests.',
    ref: 'Ref', client: 'Client', service: 'Service', price: 'Price', status: 'Status',
    sar: 'SAR', request: 'Request', patient: 'Patient', mobile: 'Mobile', city: 'City',
    preferred_date: 'Preferred date', patient_file: 'Patient medical file',
    track_log: 'Tracking log', client_correspondence: 'Correspondence with client',
    delete: 'Delete', confirm_delete: 'Permanently delete this request with all its visits, attachments and messages?',
    search_ph: 'Search ref, client, mobile or service', all_statuses: 'All stages',
  },
};

export default function ServiceRequestsManager() {
  const { lang } = useLang();
  const { can } = useAdminAuth();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [params, setParams] = useSearchParams();
  const L = useColLabels();
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('');

  const load = () => AdminAPI.requests().then(setList);
  useEffect(() => { load(); }, []);

  const open = async (id) => setActive(await AdminAPI.request(id));
  const remove = async (e, id) => { e.stopPropagation(); if (confirm(tt.confirm_delete)) { await AdminAPI.deleteRequest(id); load(); } };
  const canDelete = can('requests', 'delete');

  const shown = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return list.filter((r) => (!fStatus || r.status === fStatus)
      && (!nq || [r.ref, r.user_name, r.user_email, r.patient_name, r.phone, r.city, r.service_title].join(' ').toLowerCase().includes(nq)));
  }, [list, q, fStatus]);
  const money = (v) => (v != null && v !== '' ? `${Number(v).toLocaleString('en-US')} ${tt.sar}` : '—');
  const columns = [
    { key: 'ref', label: tt.ref, required: true, dir: 'ltr', nowrap: true, render: (r) => <b className="dt-ref">{r.ref}</b> },
    { key: 'created_at', label: L.created, nowrap: true, render: (r) => <span dir="ltr">{fmtDate(r.created_at)}</span> },
    { key: 'client', wide: true, label: tt.client, required: true, value: (r) => r.user_name, render: (r) => <>{r.user_name}<br /><small className="muted" dir="ltr">{r.phone || r.user_email}</small></> },
    { key: 'email', label: L.email, default: false, dir: 'ltr', value: (r) => r.user_email, render: (r) => r.user_email || '—' },
    { key: 'patient', label: tt.patient, default: false, value: (r) => r.patient_name, render: (r) => r.patient_name || '—' },
    { key: 'phone', label: tt.mobile, default: false, dir: 'ltr', nowrap: true, render: (r) => (r.phone ? phonesIn(r.phone).map((m) => <div key={m}>{m}</div>) : '—') },
    { key: 'city', label: tt.city, default: false, render: (r) => r.city || '—' },
    { key: 'service', wide: true, label: tt.service, value: (r) => r.service_title, render: (r) => r.service_title || '—' },
    { key: 'price', label: tt.price, value: (r) => Number(r.price) || 0, render: (r) => money(r.price) },
    { key: 'promo', label: L.promo, default: false, value: (r) => r.promo_code, render: (r) => (r.promo_code ? <span dir="ltr">{r.promo_code}{r.discount ? ` (−${Number(r.discount).toLocaleString('en-US')})` : ''}</span> : '—') },
    { key: 'preferred', label: tt.preferred_date, default: false, value: (r) => r.preferred_date, render: (r) => <span dir="ltr">{r.preferred_date ? fmtDate(r.preferred_date) : '—'}</span> },
    { key: 'visits', label: L.visits, value: (r) => r.next_visit || '', render: (r) => (Number(r.visits_count) ? <span className="dt-visits"><b>{r.visits_count}</b>{r.next_visit && <small dir="ltr">{L.next}: {fmtDate(r.next_visit)} {String(r.next_visit).slice(11, 16)}</small>}</span> : '—') },
    { key: 'notes', wide: true, label: L.notes, default: false, value: (r) => r.notes, render: (r) => (r.notes ? <span className="dt-clip" dir="auto" title={r.notes}>{r.notes}</span> : '—') },
    { key: 'updated_at', label: L.updated, default: false, nowrap: true, render: (r) => <span dir="ltr">{fmtDate(r.updated_at)}</span> },
    { key: 'status', label: tt.status, required: true, value: (r) => REQUEST_STATUSES.indexOf(r.status), render: (r) => <StatusPill status={r.status} /> },
  ];

  // auto-open a specific request when arriving from a notification (?open=ID)
  const openId = params.get('open');
  useEffect(() => {
    if (openId) { open(openId); params.delete('open'); setParams(params, { replace: true }); }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="page-title">{tt.title}</h1>
      <div className="panel">
        <DataTable
          id="requests"
          columns={columns}
          rows={shown}
          onRowClick={(r) => open(r.id)}
          empty={<p className="empty">{tt.no_requests}</p>}
          toolbar={(
            <div className="case-filters">
              <div className="cf-search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt.search_ph} /></div>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={fStatus ? 'on' : ''}>
                <option value="">{tt.all_statuses}</option>
                {REQUEST_STATUSES.map((st) => <option key={st} value={st}>{statusLabel(st, lang)}</option>)}
              </select>
              <span className="cf-count">{shown.length} / {list.length}</span>
            </div>
          )}
          actions={(r) => (
            <>
              <button className="icon-act" onClick={() => open(r.id)}><Eye size={16} /></button>
              <ShareButtons compact text={() => AdminAPI.request(r.id).then((d) => requestText(d, lang))} />
              {canDelete && <button className="icon-act danger" title={tt.delete} onClick={(e) => remove(e, r.id)}><Trash2 size={16} /></button>}
            </>
          )}
        />
      </div>
      {active && <RequestDrawer data={active} onClose={() => setActive(null)} onSaved={(d) => { setActive(d); load(); }} />}
    </div>
  );
}

function RequestDrawer({ data, onClose, onSaved }) {
  const { lang } = useLang();
  const tt = T[lang];
  const reload = async () => { const fresh = await AdminAPI.request(data.id); onSaved(fresh); };
  const profile = data.profile || {};
  const profileEntries = Object.entries(PROFILE_LABELS[lang]).filter(([k]) => profile[k]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{tt.request} {data.ref}</h2>
          <div className="modal-head-actions">
            <ShareButtons text={requestText(data, lang)} />
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        <div className="modal-body">
          <div className="detail-meta">
            <div><span>{tt.service}</span><b>{data.service_title || '—'}</b></div>
            <div><span>{tt.patient}</span><b>{data.patient_name || '—'}</b></div>
            <div><span>{tt.mobile}</span><b dir="ltr">{data.phone || '—'}</b></div>
            <div><span>{tt.city}</span><b>{data.city || '—'}</b></div>
            {data.preferred_date && <div><span>{tt.preferred_date}</span><b>{data.preferred_date}</b></div>}
          </div>
          {data.notes && <p className="detail-notes">{data.notes}</p>}

          {profileEntries.length > 0 && (
            <div className="patient-file">
              <h4>{tt.patient_file}</h4>
              <div className="pf-grid">
                {profileEntries.map(([k, label]) => <div key={k}><span>{label}</span><b dir="auto">{profile[k]}</b></div>)}
              </div>
            </div>
          )}

          <WorkflowPanel kind="request" id={data.id} status={data.status} price={data.price} onDone={reload} />

          <VisitScheduler refType="service_request" refId={data.id} visits={data.visits || []} onChange={reload} />

          <h3 className="track-title">{tt.track_log}</h3>
          <Tracking flow={REQUEST_FLOW} status={data.status} events={data.events || []} />

          <Thread messages={data.messages || []} currentRole="admin" onSend={async (payload) => { await AdminAPI.sendRequestMessage(data.id, payload); await reload(); }} onUpload={AdminAPI.uploadFile} title={tt.client_correspondence} />
        </div>
      </div>
    </div>
  );
}
