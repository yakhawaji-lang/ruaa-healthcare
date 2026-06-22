import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, X, Save, Trash2 } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import Tracking, { StatusPill } from '../account/Tracking.jsx';
import Thread from '../account/Thread.jsx';
import VisitScheduler from './VisitScheduler.jsx';
import WorkflowPanel from './WorkflowPanel.jsx';
import { REQUEST_FLOW } from '../account/status.js';
import { useLang } from '../i18n.jsx';

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
  },
  en: {
    title: 'Service Requests', no_requests: 'No requests.',
    ref: 'Ref', client: 'Client', service: 'Service', price: 'Price', status: 'Status',
    sar: 'SAR', request: 'Request', patient: 'Patient', mobile: 'Mobile', city: 'City',
    preferred_date: 'Preferred date', patient_file: 'Patient medical file',
    track_log: 'Tracking log', client_correspondence: 'Correspondence with client',
    delete: 'Delete', confirm_delete: 'Permanently delete this request with all its visits, attachments and messages?',
  },
};

export default function ServiceRequestsManager() {
  const { lang } = useLang();
  const { can } = useAdminAuth();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [params, setParams] = useSearchParams();

  const load = () => AdminAPI.requests().then(setList);
  useEffect(() => { load(); }, []);

  const open = async (id) => setActive(await AdminAPI.request(id));
  const remove = async (e, id) => { e.stopPropagation(); if (confirm(tt.confirm_delete)) { await AdminAPI.deleteRequest(id); load(); } };
  const canDelete = can('requests', 'delete');

  // auto-open a specific request when arriving from a notification (?open=ID)
  const openId = params.get('open');
  useEffect(() => {
    if (openId) { open(openId); params.delete('open'); setParams(params, { replace: true }); }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="page-title">{tt.title}</h1>
      <div className="panel">
        {list.length === 0 ? <p className="empty">{tt.no_requests}</p> : (
          <table className="admin-table">
            <thead><tr><th>{tt.ref}</th><th>{tt.client}</th><th>{tt.service}</th><th>{tt.price}</th><th>{tt.status}</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td dir="ltr">{r.ref}</td>
                  <td>{r.user_name}<br /><small className="muted" dir="ltr">{r.phone || r.user_email}</small></td>
                  <td>{r.service_title || '—'}</td>
                  <td>{r.price ? `${Number(r.price).toLocaleString('en-US')} ${tt.sar}` : '—'}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td className="row-actions">
                    <button className="icon-act" onClick={() => open(r.id)}><Eye size={16} /></button>
                    {canDelete && <button className="icon-act danger" title={tt.delete} onClick={(e) => remove(e, r.id)}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          <button onClick={onClose}><X size={20} /></button>
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
