// Patient view of one consultation: details, join button, doctor's summary,
// tracking timeline and correspondence with the administration.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Video, Phone, CalendarDays, Clock, UserRound, FileText, XCircle, Pill, Stethoscope, Hourglass } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import Tracking from '../account/Tracking.jsx';
import Thread from '../account/Thread.jsx';
import { ConsPill } from './ConsultationCard.jsx';
import { CONS_FLOW, consLabel, modeLabel, doctorName, doctorSpecialty, fmtAtDate, fmtTime12, splitAt, canJoinNow, isClosed, minutesUntil } from './status.js';
import './telemed.css';

const T = {
  ar: {
    back: 'رجوع لحسابي', consultation: 'استشارة عن بُعد', doctor: 'الممارس الصحي', when: 'الموعد', tbd: 'يُحدَّد لاحقًا', mode: 'النوع', price: 'الرسوم', sar: 'ريال',
    unconfirmed_t: 'موعدك بانتظار التأكيد', unconfirmed_h: 'الموعد محجوز لك مؤقتًا وستؤكده الإدارة قريبًا. سيصلك إشعار عند التأكيد ويظهر زر الدخول للغرفة بعدها.',
    complaint: 'سبب الاستشارة', join: 'دخول غرفة الاستشارة', join_hint: (m) => (m > 0 ? `يمكنك الدخول قبل الموعد بـ 15 دقيقة (متبقٍ ${m} دقيقة)` : 'الغرفة مفتوحة الآن'),
    cancel: 'إلغاء الاستشارة', confirm_cancel: 'هل تريد إلغاء هذه الاستشارة؟', tracking: 'متابعة الاستشارة', thread: 'المراسلات مع إدارة رؤى',
    summary: 'ملخص الممارس', diagnosis: 'التشخيص', notes: 'الملاحظات الطبية', prescription: 'الوصفة / التوصيات', follow_up: 'المتابعة', preferred: 'الوقت المفضّل',
  },
  en: {
    back: 'Back to my account', consultation: 'Remote consultation', doctor: 'Provider', when: 'Appointment', tbd: 'To be set', mode: 'Type', price: 'Fee', sar: 'SAR',
    unconfirmed_t: 'Awaiting confirmation', unconfirmed_h: 'The slot is held for you and the team will confirm it shortly. You will be notified, and the join button appears after confirmation.',
    complaint: 'Reason', join: 'Join the consultation room', join_hint: (m) => (m > 0 ? `You can join 15 minutes before the start (${m} minutes left)` : 'The room is open now'),
    cancel: 'Cancel consultation', confirm_cancel: 'Cancel this consultation?', tracking: 'Consultation tracking', thread: 'Messages with RU-MD administration',
    summary: "Provider's summary", diagnosis: 'Diagnosis', notes: 'Clinical notes', prescription: 'Prescription / advice', follow_up: 'Follow-up', preferred: 'Preferred time',
  },
};

export default function ConsultationDetail() {
  const { lang } = useLang();
  const tt = T[lang];
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const load = () => AccountAPI.consultation(id).then(setC).catch(() => nav('/portal'));
  useEffect(() => { load(); }, [id]);
  // refresh the join window every 30s while waiting
  useEffect(() => {
    if (!c || isClosed(c.status)) return undefined;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [c?.status]);
  if (!c) return <div className="page-loader"><div className="spinner" /></div>;

  const Back = lang === 'ar' ? ArrowRight : ArrowLeft;
  const Icon = c.mode === 'audio' ? Phone : Video;
  const { time } = splitAt(c.scheduled_at);
  const joinable = canJoinNow(c);
  const mins = minutesUntil(c.scheduled_at);
  const sendMsg = async (payload) => { await AccountAPI.sendConsultationMessage(id, payload); await load(); };
  const cancel = async () => { if (confirm(tt.confirm_cancel)) { await AccountAPI.cancelConsultation(id); await load(); } };
  const hasSummary = c.status === 'completed' && (c.doctor_notes || c.diagnosis || c.prescription || c.follow_up);

  return (
    <div className="detail-view wide">
      <button className="back-link" onClick={() => nav('/portal')}><Back size={16} /> {tt.back}</button>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h2><Icon size={20} /> {tt.consultation} — {modeLabel(c.mode, lang)}</h2>
                <span className="ref-code" dir="ltr">{c.ref}</span>
              </div>
              <ConsPill status={c.status} />
            </div>
            <div className="detail-meta">
              <div><span>{tt.doctor}</span><b>{c.doctor_name ? `${doctorName(c, lang)}${doctorSpecialty(c, lang) ? ' — ' + doctorSpecialty(c, lang) : ''}` : tt.tbd}</b></div>
              <div><span>{tt.when}</span><b>{c.scheduled_at ? `${fmtAtDate(c.scheduled_at, lang)} · ${fmtTime12(time, lang)}` : tt.tbd}</b></div>
              {c.price ? <div><span>{tt.price}</span><b>{Number(c.price).toLocaleString('en-US')} {tt.sar}</b></div> : null}
              {c.preferred_note && !c.scheduled_at && <div><span>{tt.preferred}</span><b>{c.preferred_note}</b></div>}
            </div>
            {c.complaint && <p className="detail-notes"><FileText size={14} /> <b>{tt.complaint}:</b> {c.complaint}</p>}

            {c.status === 'unconfirmed' && (
              <div className="tm-join-box tm-unconfirmed">
                <div><strong><Hourglass size={16} /> {tt.unconfirmed_t}</strong><small>{tt.unconfirmed_h}</small></div>
              </div>
            )}
            {c.status === 'scheduled' || c.status === 'in_progress' ? (
              <div className={`tm-join-box ${joinable ? 'open' : ''}`}>
                <div>
                  <strong><Icon size={16} /> {modeLabel(c.mode, lang)}</strong>
                  <small>{tt.join_hint(joinable ? 0 : (mins ?? 0))}</small>
                </div>
                <button type="button" className="btn btn-primary" disabled={!joinable} onClick={() => nav(`/portal/consultations/${c.id}/room`)}>
                  <Icon size={16} /> {tt.join}
                </button>
              </div>
            ) : null}
            {!isClosed(c.status) && c.status !== 'in_progress' && (
              <div className="tm-cancel-row"><button type="button" className="btn btn-ghost btn-sm danger-text" onClick={cancel}><XCircle size={15} /> {tt.cancel}</button></div>
            )}
          </div>

          {hasSummary && (
            <div className="detail-card tm-summary-card">
              <h3><Stethoscope size={18} /> {tt.summary}</h3>
              {c.diagnosis && <div className="tm-sum-row"><span>{tt.diagnosis}</span><p>{c.diagnosis}</p></div>}
              {c.doctor_notes && <div className="tm-sum-row"><span>{tt.notes}</span><p>{c.doctor_notes}</p></div>}
              {c.prescription && <div className="tm-sum-row"><span><Pill size={14} /> {tt.prescription}</span><p>{c.prescription}</p></div>}
              {c.follow_up && <div className="tm-sum-row"><span><CalendarDays size={14} /> {tt.follow_up}</span><p>{c.follow_up}</p></div>}
            </div>
          )}

          <h3 className="track-title">{tt.tracking}</h3>
          <Tracking flow={CONS_FLOW} status={c.status === 'no_show' ? 'cancelled' : c.status} events={c.events} audience="client" labelFn={consLabel} />
        </div>

        <aside className="detail-side">
          <Thread messages={c.messages || []} currentRole="user" onSend={sendMsg} onUpload={AccountAPI.uploadFile} title={tt.thread} />
        </aside>
      </div>
    </div>
  );
}
