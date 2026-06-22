import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import { visitStatusColor, visitStatusLabel, VISIT_TYPES_BI, CLINICIAN_ROLES_BI, biLabel } from './status.js';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const startOfWeek = (d) => addDays(d, -d.getDay());

const L = {
  ar: {
    title: 'تقويم الزيارات', month: 'شهري', week: 'أسبوعي', day: 'يومي', today: 'اليوم',
    none: 'لا زيارات', no_day: 'لا زيارات في هذا اليوم.', no_time: 'بدون وقت',
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    wd: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
  },
  en: {
    title: 'Visits calendar', month: 'Month', week: 'Week', day: 'Day', today: 'Today',
    none: 'No visits', no_day: 'No visits on this day.', no_time: 'No time',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
};

export default function MiniVisitsCalendar() {
  const { lang } = useLang();
  const tt = L[lang === 'en' ? 'en' : 'ar'];
  const [visits, setVisits] = useState([]);
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(new Date());
  const [sel, setSel] = useState(ymd(new Date()));

  useEffect(() => { AccountAPI.myCaseVisits().then(setVisits).catch(() => setVisits([])); }, []);

  const typeLabel = (v) => { const it = VISIT_TYPES_BI.find((x) => x.ar === v || x.en === v); return it ? biLabel(it, lang) : (v || ''); };

  const byDay = useMemo(() => {
    const m = {};
    for (const v of visits) {
      const k = (v.visit_date || '').slice(0, 10); if (!k) continue;
      (m[k] = m[k] || []).push(v);
    }
    for (const k in m) m[k].sort((a, b) => (a.visit_time || '').localeCompare(b.visit_time || ''));
    return m;
  }, [visits]);

  const step = (dir) => {
    if (view === 'month') setCursor((c) => addMonths(c, dir));
    else if (view === 'week') setCursor((c) => addDays(c, dir * 7));
    else { setCursor((c) => addDays(c, dir)); setSel((s) => ymd(addDays(new Date(s), dir))); }
  };
  const periodLabel = `${tt.months[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const todayStr = ymd(new Date());

  const Agenda = ({ dayKey }) => {
    const items = byDay[dayKey] || [];
    if (items.length === 0) return <p className="mini-cal-empty">{tt.no_day}</p>;
    return (
      <div className="mini-cal-agenda">
        {items.map((v) => (
          <div key={v.id} className="mini-cal-item" style={{ borderInlineStartColor: visitStatusColor(v.status) }}>
            <span className="mini-cal-time">{v.visit_time ? v.visit_time.slice(0, 5) : tt.no_time}</span>
            <div className="mini-cal-item-main">
              <strong>{v.patient_name || '—'}</strong>
              <small>{typeLabel(v.visit_type)}</small>
            </div>
            <span className="mini-cal-pill" style={{ color: visitStatusColor(v.status), background: visitStatusColor(v.status) + '1e' }}>{visitStatusLabel(v.status, lang)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mini-cal panel">
      <div className="mini-cal-head">
        <h3 className="portal-h2" style={{ fontSize: '1rem', margin: 0 }}><CalendarDays size={18} /> {tt.title}</h3>
      </div>
      <div className="mini-cal-views">
        {['month', 'week', 'day'].map((v) => (
          <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{tt[v]}</button>
        ))}
      </div>
      <div className="mini-cal-nav">
        <button className="mini-cal-arrow" onClick={() => step(-1)}><ChevronRight size={16} /></button>
        <button className="mini-cal-today" onClick={() => { setCursor(new Date()); setSel(todayStr); }}>{tt.today}</button>
        <strong>{view === 'day' ? sel : periodLabel}</strong>
        <button className="mini-cal-arrow" onClick={() => step(1)}><ChevronLeft size={16} /></button>
      </div>

      {view === 'month' && (
        <>
          <div className="mini-cal-grid mini-cal-wd">{tt.wd.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="mini-cal-grid">
            {Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1)), i)).map((d) => {
              const k = ymd(d);
              const items = byDay[k] || [];
              const outside = d.getMonth() !== cursor.getMonth();
              return (
                <button key={k} className={`mini-cal-day ${outside ? 'outside' : ''} ${k === todayStr ? 'today' : ''} ${k === sel ? 'sel' : ''}`} onClick={() => setSel(k)}>
                  <span>{d.getDate()}</span>
                  {items.length > 0 && (
                    <span className="mini-cal-dots">
                      {items.slice(0, 3).map((v) => <i key={v.id} style={{ background: visitStatusColor(v.status) }} />)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Agenda dayKey={sel} />
        </>
      )}

      {view === 'week' && (
        <div className="mini-cal-weeklist">
          {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)).map((d) => {
            const k = ymd(d);
            const items = byDay[k] || [];
            return (
              <div key={k} className="mini-cal-wday">
                <div className={`mini-cal-wday-head ${k === todayStr ? 'today' : ''}`}>{tt.wd[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}</div>
                {items.length === 0 ? <span className="mini-cal-empty">{tt.none}</span> : (
                  items.map((v) => (
                    <div key={v.id} className="mini-cal-item" style={{ borderInlineStartColor: visitStatusColor(v.status) }}>
                      <span className="mini-cal-time">{v.visit_time ? v.visit_time.slice(0, 5) : tt.no_time}</span>
                      <div className="mini-cal-item-main"><strong>{v.patient_name || '—'}</strong><small>{typeLabel(v.visit_type)}</small></div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'day' && <Agenda dayKey={ymd(cursor)} />}
    </div>
  );
}
