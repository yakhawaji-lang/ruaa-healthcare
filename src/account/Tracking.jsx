import { Check } from 'lucide-react';
import { STATUS, statusLabel, statusColor, fmtDateTime } from './status.js';
import { localizeEvent } from './eventI18n.js';
import { useLang } from '../i18n.jsx';

const T = {
  ar: { no_updates: 'لا توجد تحديثات بعد.' },
  en: { no_updates: 'No updates yet.' },
};

// Professional order-style tracking: a horizontal stepper of the flow + a
// detailed event timeline (inspired by global order-tracking pages).
export default function Tracking({ flow, status, events = [], audience = 'admin' }) {
  const { lang, pick } = useLang();
  const tt = T[lang];
  const idx = flow.indexOf(status);
  const isTerminalBad = status === 'cancelled' || status === 'rejected';

  return (
    <div className="track">
      {!isTerminalBad && (
        <div className="track-steps">
          {flow.map((st, i) => {
            const done = i < idx, active = i === idx;
            return (
              <div key={st} className={`track-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                <div className="track-dot">{done ? <Check size={15} /> : i + 1}</div>
                <span>{statusLabel(st, lang, audience)}</span>
                {i < flow.length - 1 && <i className="track-line" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="track-timeline">
        {events.length === 0 && <p className="empty">{tt.no_updates}</p>}
        {[...events].reverse().map((e) => {
          const ev = localizeEvent(e, lang);
          return (
            <div key={e.id} className="track-event">
              <span className="te-dot" style={{ background: statusColor(e.status) }} />
              <div className="te-body">
                <div className="te-head">
                  <strong>{ev.title || statusLabel(e.status, lang, audience)}</strong>
                  <small dir="ltr">{fmtDateTime(e.created_at)}</small>
                </div>
                {ev.note && <p>{ev.note}</p>}
                {ev.actor && <span className="te-actor">{ev.actor}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatusPill({ status, audience = 'admin' }) {
  const { lang } = useLang();
  const c = statusColor(status);
  return <span className="status-pill" style={{ color: c, background: c + '1e' }}>{statusLabel(status, lang, audience)}</span>;
}
