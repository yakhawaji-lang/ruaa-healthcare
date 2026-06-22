import { CalendarDays, Clock, UserRound, Stethoscope } from 'lucide-react';
import { visitStatusLabel, visitStatusColor, fmtDate } from './status.js';
import { useLang } from '../i18n.jsx';

const T = {
  ar: { no_visits: 'لا توجد زيارات مجدولة بعد.', tbd: 'يُحدَّد لاحقًا', home_visit: 'زيارة منزلية' },
  en: { no_visits: 'No visits scheduled yet.', tbd: 'To be determined', home_visit: 'Home visit' },
};

// Clean, compact home-visit cards (work well in the narrow side column).
export default function VisitsList({ visits = [] }) {
  const { lang } = useLang();
  const tt = T[lang];
  if (!visits.length) return <p className="empty small">{tt.no_visits}</p>;
  return (
    <div className="visits-list">
      {visits.map((v) => {
        const c = visitStatusColor(v.status);
        return (
          <div key={v.id} className="visit-card">
            <div className="visit-cal"><CalendarDays size={20} /></div>
            <div className="visit-body">
              <div className="visit-top">
                <strong>{fmtDate(v.visit_date) || tt.tbd}</strong>
                {v.visit_time && <span className="visit-time"><Clock size={12} /> {v.visit_time}</span>}
                <span className="status-pill visit-status" style={{ color: c, background: c + '1e' }}>{visitStatusLabel(v.status, lang)}</span>
              </div>
              <div className="visit-sub">
                <span><Stethoscope size={13} /> {v.visit_type || tt.home_visit}</span>
                {v.clinician_name && <span><UserRound size={13} /> {v.clinician_name}{v.clinician_role ? ` — ${v.clinician_role}` : ''}</span>}
              </div>
              {v.notes && <p className="visit-note2">{v.notes}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
