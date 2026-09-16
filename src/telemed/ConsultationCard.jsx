// Compact consultation row/card used in the patient, doctor and admin lists.
import { Link } from 'react-router-dom';
import { Video, Phone, Clock, UserRound, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { consLabel, consColor, modeLabel, doctorName, fmtAtDate, fmtTime12, splitAt, canJoinNow } from './status.js';

export function ConsPill({ status }) {
  const { lang } = useLang();
  const c = consColor(status);
  return <span className="status-pill" style={{ color: c, background: c + '1e' }}>{consLabel(status, lang)}</span>;
}

const T = {
  ar: { join: 'دخول الغرفة', tbd: 'الموعد يُحدَّد لاحقًا', patient: 'المريض', doctor: 'الممارس' },
  en: { join: 'Join room', tbd: 'Time to be set', patient: 'Patient', doctor: 'Provider' },
};

// audience: 'patient' | 'doctor' | 'admin' — controls the counter-party shown and the link target.
export default function ConsultationCard({ c, audience = 'patient', to, onJoin }) {
  const { lang } = useLang();
  const tt = T[lang];
  const Icon = c.mode === 'audio' ? Phone : Video;
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const { time } = splitAt(c.scheduled_at);
  const who = audience === 'patient' ? (c.doctor_name ? doctorName(c, lang) : '') : (c.patient_name || c.user_name || '');
  const joinable = canJoinNow(c);
  const href = to || `/portal/consultations/${c.id}`;

  const body = (
    <>
      <div className={`tm-card-icon ${c.mode}`}><Icon size={20} /></div>
      <div className="tm-card-body">
        <div className="tm-card-top">
          <strong>{c.scheduled_at ? fmtAtDate(c.scheduled_at, lang) : tt.tbd}</strong>
          {time && <span className="visit-time"><Clock size={12} /> {fmtTime12(time, lang)}</span>}
          <ConsPill status={c.status} />
        </div>
        <div className="tm-card-sub">
          <span>{modeLabel(c.mode, lang)}</span>
          {who && <span><UserRound size={13} /> {who}</span>}
          <span className="ref-code" dir="ltr">{c.ref}</span>
        </div>
        {c.complaint && audience !== 'patient' && <p className="tm-card-note">{String(c.complaint).slice(0, 110)}{c.complaint.length > 110 ? '…' : ''}</p>}
      </div>
      <div className="tm-card-end">
        {joinable && onJoin && <button type="button" className="btn btn-primary btn-sm tm-join-btn" onClick={(e) => { e.preventDefault(); onJoin(c); }}><Icon size={15} /> {tt.join}</button>}
        <Arrow size={16} className="tm-card-arrow" />
      </div>
    </>
  );
  return <Link to={href} className={`tm-card ${joinable ? 'live' : ''}`}>{body}</Link>;
}
