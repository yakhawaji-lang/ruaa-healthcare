import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const WD = { ar: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const MON = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

function Month({ y, m, start, end, onPick, lang }) {
  const startDow = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  const inRange = (val) => start && end && val > start && val < end;
  return (
    <div className="drc-month">
      <div className="drc-mtitle">{MON[lang][m]} {y}</div>
      <div className="drc-wd">{WD[lang].map((w) => <span key={w}>{w}</span>)}</div>
      <div className="drc-grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className="drc-empty" />;
          const val = iso(y, m, d);
          const cls = ['drc-day', val === start ? 'edge' : '', val === end ? 'edge' : '', inRange(val) ? 'inrange' : ''].filter(Boolean).join(' ');
          return <button key={val} type="button" className={cls} onClick={() => onPick(val)}>{d}</button>;
        })}
      </div>
    </div>
  );
}

// Two-month range picker: current month (right) + next month (left, in RTL).
// Stays open until the parent hides it (via the "Done" button).
export default function DateRangeCalendar({ start = '', end = '', onChange, onDone, lang = 'ar' }) {
  const today = new Date();
  const [base, setBase] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const next = base.m === 11 ? { y: base.y + 1, m: 0 } : { y: base.y, m: base.m + 1 };
  const prevM = () => setBase(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const nextM = () => setBase(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  const pick = (val) => {
    if (!start || (start && end)) onChange({ start: val, end: '' });
    else if (val < start) onChange({ start: val, end: '' });
    else onChange({ start, end: val });
  };

  return (
    <div className="drc">
      <div className="drc-head">
        <button type="button" className="drc-nav" onClick={prevM} aria-label="prev"><ChevronRight size={18} /></button>
        <span className="drc-range" dir="ltr">{start || '—'}{end ? `  →  ${end}` : ''}</span>
        <button type="button" className="drc-nav" onClick={nextM} aria-label="next"><ChevronLeft size={18} /></button>
      </div>
      <div className="drc-months">
        <Month y={base.y} m={base.m} start={start} end={end} onPick={pick} lang={lang} />
        <Month y={next.y} m={next.m} start={start} end={end} onPick={pick} lang={lang} />
      </div>
      <div className="drc-foot">
        <button type="button" className="btn btn-primary btn-sm" onClick={onDone}><Check size={15} /> {lang === 'en' ? 'Done' : 'تم'}</button>
      </div>
    </div>
  );
}
