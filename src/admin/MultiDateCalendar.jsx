import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const WD = { ar: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const MON = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

// Inline month calendar that lets the user pick MULTIPLE days (tap to toggle).
export default function MultiDateCalendar({ selected = [], onToggle, lang = 'ar' }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const startDow = new Date(cur.y, cur.m, 1).getDay();
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setCur(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const next = () => setCur(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="mdc">
      <div className="mdc-head">
        <button type="button" className="mdc-nav" onClick={prev} aria-label="prev"><ChevronRight size={18} /></button>
        <strong>{MON[lang][cur.m]} {cur.y}</strong>
        <button type="button" className="mdc-nav" onClick={next} aria-label="next"><ChevronLeft size={18} /></button>
      </div>
      <div className="mdc-wd">{WD[lang].map((w) => <span key={w}>{w}</span>)}</div>
      <div className="mdc-grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className="mdc-empty" />;
          const val = iso(cur.y, cur.m, d);
          const past = new Date(cur.y, cur.m, d) < today;
          const sel = selected.includes(val);
          return (
            <button
              key={val}
              type="button"
              disabled={past}
              className={`mdc-day ${sel ? 'sel' : ''} ${val === todayIso ? 'today' : ''}`}
              onClick={() => onToggle(val)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
