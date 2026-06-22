import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, X, ArrowRight, ArrowLeft, ClipboardList, CheckCircle2, CalendarDays, LayoutGrid } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useSite } from '../App.jsx';
import { useAccount } from './AccountContext.jsx';
import Tracking, { StatusPill } from './Tracking.jsx';
import VisitsList from './Visits.jsx';
import Thread from './Thread.jsx';
import MedicalProfile from './MedicalProfile.jsx';
import AccountSettings from './AccountSettings.jsx';
import MiniStats from './MiniStats.jsx';
import { REQUEST_FLOW } from './status.js';
import { useLang } from '../i18n.jsx';
import ServiceIcon from '../components/ServiceIcon.jsx';
import DobInput from '../components/DobInput.jsx';
import ServicePickerModal from '../components/ServicePickerModal.jsx';

const T = {
  ar: {
    upcoming_visits: 'زياراتي القادمة',
    request_service_from: 'اطلب خدمة من رؤى',
    request_intro: 'اختر الخدمة المناسبة وسيتواصل معك فريق رؤى لتأكيد التفاصيل',
    request_service_btn: 'طلب خدمة',
    new_request_title: 'طلب خدمة جديد',
    services_label: 'الخدمات المطلوبة',
    ph_services: 'اختر خدمة أو أكثر من القائمة',
    choose_services: 'اختيار الخدمات',
    need_service: 'اختر خدمة واحدة على الأقل',
    sar: 'ريال',
    upon_assessment: 'حسب التقييم',
    request_service: 'اطلب الخدمة',
    requests_noun: 'الطلبات',
    my_requests: 'طلباتي',
    no_requests: 'لا توجد طلبات بعد. اختر خدمة بالأعلى لإرسال طلبك.',
    service: 'خدمة',
    request_prefix: 'طلب: ',
    request_sent: 'تم إرسال طلبك بنجاح',
    tracking_no: 'رقم المتابعة:',
    request_followup: 'سيتواصل معك فريق رؤى لتأكيد التفاصيل والسعر.',
    view_my_requests: 'عرض طلباتي',
    price: 'السعر',
    patient_name: 'اسم المريض',
    phone: 'رقم الجوال',
    city: 'المدينة',
    preferred_date: 'التاريخ المفضّل للزيارة',
    extra_notes: 'ملاحظات إضافية',
    cancel: 'إلغاء',
    sending: 'جارٍ الإرسال...',
    send_request: 'إرسال الطلب',
    back_to_requests: 'رجوع لطلباتي',
    patient: 'المريض',
    phone_short: 'الجوال',
    preferred_date_short: 'التاريخ المفضّل',
    request_followup_title: 'متابعة الطلب',
    visits: 'الزيارات',
    thread_title: 'المراسلات مع إدارة رؤى',
  },
  en: {
    upcoming_visits: 'My upcoming visits',
    request_service_from: 'Request a service from RU-MD',
    request_intro: 'Choose the right service and the RU-MD team will contact you to confirm the details',
    request_service_btn: 'Request a service',
    new_request_title: 'New service request',
    services_label: 'Requested services',
    ph_services: 'Choose one or more services',
    choose_services: 'Choose services',
    need_service: 'Select at least one service',
    sar: 'SAR',
    upon_assessment: 'Upon assessment',
    request_service: 'Request service',
    requests_noun: 'requests',
    my_requests: 'My Requests',
    no_requests: 'No requests yet. Choose a service above to submit your request.',
    service: 'Service',
    request_prefix: 'Request: ',
    request_sent: 'Your request was sent successfully',
    tracking_no: 'Reference number:',
    request_followup: 'The RU-MD team will contact you to confirm the details and price.',
    view_my_requests: 'View my requests',
    price: 'Price',
    patient_name: 'Patient name',
    phone: 'Mobile number',
    city: 'City',
    preferred_date: 'Preferred visit date',
    extra_notes: 'Additional notes',
    cancel: 'Cancel',
    sending: 'Sending...',
    send_request: 'Send request',
    back_to_requests: 'Back to my requests',
    patient: 'Patient',
    phone_short: 'Mobile',
    preferred_date_short: 'Preferred date',
    request_followup_title: 'Request tracking',
    visits: 'Visits',
    thread_title: 'Messages with RU-MD administration',
  },
};

export default function VisitorPortal() {
  const site = useSite();
  const { user } = useAccount();
  const { lang, pick } = useLang();
  const tt = T[lang];
  const [requests, setRequests] = useState([]);
  const [visits, setVisits] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const services = site?.services || [];

  const load = () => {
    AccountAPI.myRequests().then(setRequests).catch(() => {});
    AccountAPI.myVisits().then(setVisits).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const upcoming = visits.filter((v) => v.status === 'scheduled');

  return (
    <div className="portal-body">
      <AccountSettings />
      <MedicalProfile />

      {upcoming.length > 0 && (
        <section className="portal-section">
          <h2 className="portal-h2"><CalendarDays size={20} /> {tt.upcoming_visits}</h2>
          <VisitsList visits={upcoming} />
        </section>
      )}

      {/* Request a service */}
      <section className="portal-section">
        <div className="svc-order-head">
          <h2 className="portal-h2"><ClipboardList size={20} /> {tt.request_service_from}</h2>
          <span className="svc-order-sub">{tt.request_intro}</span>
        </div>
        <button type="button" className="btn btn-primary svc-request-btn" onClick={() => setRequesting(true)}>
          <Plus size={18} /> {tt.request_service_btn}
        </button>
      </section>

      {requests.length > 0 && <MiniStats items={requests} noun={tt.requests_noun} />}

      {/* My requests */}
      <section className="portal-section">
        <h2 className="portal-h2">{tt.my_requests}</h2>
        {requests.length === 0 ? (
          <div className="panel empty">{tt.no_requests}</div>
        ) : (
          <div className="req-list">
            {requests.map((r) => (
              <Link key={r.id} to={`/portal/requests/${r.id}`} className="req-row">
                <div>
                  <strong>{r.service_title || tt.service}</strong>
                  <small>{r.ref} · {new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</small>
                </div>
                <div className="req-row-end">
                  {r.price ? <span className="req-price">{Number(r.price).toLocaleString('en-US')} {tt.sar}</span> : null}
                  <StatusPill status={r.status} audience="client" />
                  <ArrowLeft size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {requesting && <RequestModal user={user} services={services} onClose={() => setRequesting(false)} onDone={() => { setRequesting(false); load(); }} />}
    </div>
  );
}

function RequestModal({ user, services, onClose, onDone }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [f, setF] = useState({ requested_service: '', patient_name: user?.name || '', phone: user?.phone || '', city: '', preferred_date: '', notes: '' });
  const [pickSvc, setPickSvc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.requested_service.trim()) { setError(tt.need_service); return; }
    setBusy(true); setError('');
    try {
      const r = await AccountAPI.createRequest({ service_title: f.requested_service, patient_name: f.patient_name, phone: f.phone, city: f.city, preferred_date: f.preferred_date, notes: f.notes });
      setDone(r);
    } finally { setBusy(false); }
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal portal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.new_request_title}</h2><button onClick={onClose}><X size={20} /></button></div>
        {done ? (
          <div className="modal-body success-box">
            <CheckCircle2 size={48} className="success-icon" />
            <h3>{tt.request_sent}</h3>
            <p>{tt.tracking_no} <b dir="ltr">{done.ref}</b></p>
            <p className="muted">{tt.request_followup}</p>
            <button className="btn btn-primary" onClick={onDone}>{tt.view_my_requests}</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="modal-body">
              {error && <div className="form-alert error">{error}</div>}
              <div className="field"><label>{tt.services_label}</label>
                <div className="paste-row">
                  <input value={f.requested_service} readOnly onClick={() => setPickSvc(true)} placeholder={tt.ph_services} style={{ cursor: 'pointer' }} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setPickSvc(true)} title={tt.choose_services}><LayoutGrid size={16} /></button>
                </div>
              </div>
              <div className="field"><label>{tt.patient_name}</label><input value={f.patient_name} onChange={set('patient_name')} required /></div>
              <div className="field-row">
                <div className="field"><label>{tt.phone}</label><input dir="ltr" inputMode="tel" value={f.phone} onChange={set('phone')} required /></div>
                <div className="field"><label>{tt.city}</label><input value={f.city} onChange={set('city')} /></div>
              </div>
              <div className="field"><label>{tt.preferred_date}</label><DobInput iso value={f.preferred_date} onChange={(v) => setF((p) => ({ ...p, preferred_date: v }))} /></div>
              <div className="field"><label>{tt.extra_notes}</label><textarea rows={3} value={f.notes} onChange={set('notes')} /></div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? tt.sending : tt.send_request}</button>
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

export function RequestDetail() {
  const { lang } = useLang();
  const tt = T[lang];
  const { id } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  const load = () => AccountAPI.request(id).then(setR).catch(() => nav('/portal'));
  useEffect(() => { load(); }, [id]);
  if (!r) return <div className="page-loader"><div className="spinner" /></div>;
  const sendMsg = async (payload) => { await AccountAPI.sendRequestMessage(id, payload); await load(); };

  return (
    <div className="detail-view wide">
      <button className="back-link" onClick={() => nav('/portal')}><ArrowRight size={16} /> {tt.back_to_requests}</button>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h2>{r.service_title || tt.service}</h2>
                <span className="ref-code" dir="ltr">{r.ref}</span>
              </div>
              <StatusPill status={r.status} audience="client" />
            </div>
            <div className="detail-meta">
              {r.price ? <div><span>{tt.price}</span><b>{Number(r.price).toLocaleString('en-US')} {tt.sar}</b></div> : null}
              {r.patient_name && <div><span>{tt.patient}</span><b>{r.patient_name}</b></div>}
              {r.phone && <div><span>{tt.phone_short}</span><b dir="ltr">{r.phone}</b></div>}
              {r.city && <div><span>{tt.city}</span><b>{r.city}</b></div>}
              {r.preferred_date && <div><span>{tt.preferred_date_short}</span><b>{r.preferred_date}</b></div>}
            </div>
            {r.notes && <p className="detail-notes">{r.notes}</p>}
          </div>

          <h3 className="track-title">{tt.request_followup_title}</h3>
          <Tracking flow={REQUEST_FLOW} status={r.status} events={r.events} audience="client" />
        </div>

        <aside className="detail-side">
          {r.visits?.length > 0 && (
            <div className="side-card">
              <div className="side-card-head"><CalendarDays size={18} /> <h3>{tt.visits}</h3></div>
              <div className="side-card-body"><VisitsList visits={r.visits} /></div>
            </div>
          )}
          <Thread messages={r.messages || []} currentRole="user" onSend={sendMsg} onUpload={AccountAPI.uploadFile} title={tt.thread_title} />
        </aside>
      </div>
    </div>
  );
}
