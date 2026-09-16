// Availability editor — compact. Two kinds of ranges:
//   * weekly (recurring):  rules = [{ weekday, start_time, end_time }]
//   * date-specific:       dates = [{ on_date, start_time, end_time }]  (extra hours on exact dates)
// Both are shown as chips; "Add range" opens one dialog with a weekly / dates mode
// where a single time range can be applied to several days or dates at once.
import { useState } from 'react';
import { Plus, X, Clock, Check, CalendarDays, Repeat } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { WEEKDAYS, WEEKDAYS_SHORT, fmtTime12 } from './status.js';
import MultiDateCalendar from '../admin/MultiDateCalendar.jsx';

const T = {
  ar: { hint: 'حدّد أيام وأوقات استقبال الاستشارات. يُقسَّم كل نطاق تلقائيًا إلى مواعيد بحسب مدة الاستشارة.', add: 'إضافة نطاق', none: 'لا توجد أوقات محددة — لن يظهر للحجز الذاتي.',
    weekly_h: 'أسبوعيًا', dates_h: 'تواريخ محددة', dlg_title: 'إضافة نطاق توفر', mode_weekly: 'أيام أسبوعية متكررة', mode_dates: 'تواريخ محددة',
    days: 'الأيام', pick_dates: 'اختر تاريخًا أو أكثر', from: 'من', to: 'إلى', invalid: 'نهاية النطاق يجب أن تكون بعد بدايته.', need_day: 'اختر يومًا واحدًا على الأقل.', need_date: 'اختر تاريخًا واحدًا على الأقل.',
    workdays: 'أيام العمل (أحد–خميس)', all: 'كل الأيام', clear: 'مسح', confirm: 'إضافة', cancel: 'إلغاء', remove: 'حذف النطاق', selected: 'محدد' },
  en: { hint: 'Set the days and hours consultations are accepted. Each range is cut into slots by the consultation length.', add: 'Add range', none: 'No hours set — not available for self-booking.',
    weekly_h: 'Weekly', dates_h: 'Specific dates', dlg_title: 'Add availability range', mode_weekly: 'Recurring weekdays', mode_dates: 'Specific dates',
    days: 'Days', pick_dates: 'Pick one or more dates', from: 'From', to: 'To', invalid: 'The end must be after the start.', need_day: 'Pick at least one day.', need_date: 'Pick at least one date.',
    workdays: 'Workdays (Sun–Thu)', all: 'All days', clear: 'Clear', confirm: 'Add', cancel: 'Cancel', remove: 'Remove range', selected: 'selected' },
};

const fmtDate = (iso, lang) => {
  const d = new Date(`${iso}T12:00:00`);
  return `${WEEKDAYS_SHORT[lang][d.getDay()]} ${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
};

export default function AvailabilityEditor({ rules = [], onChange, dates = [], onChangeDates }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('weekly');
  const [days, setDays] = useState([0, 1, 2, 3, 4]);
  const [picked, setPicked] = useState([]);
  const [from, setFrom] = useState('09:00');
  const [to, setTo] = useState('13:00');
  const [err, setErr] = useState('');
  const withDates = typeof onChangeDates === 'function';

  const byDay = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({
    wd, items: rules.map((r, i) => ({ ...r, i })).filter((r) => Number(r.weekday) === wd).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((d) => d.items.length);
  const byDate = Object.values(dates.map((r, i) => ({ ...r, i })).reduce((acc, r) => { (acc[r.on_date] = acc[r.on_date] || []).push(r); return acc; }, {}))
    .sort((a, b) => a[0].on_date.localeCompare(b[0].on_date));

  const removeRule = (i) => onChange(rules.filter((_, j) => j !== i));
  const removeDate = (i) => onChangeDates(dates.filter((_, j) => j !== i));
  const toggleDay = (d) => setDays((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort()));
  const toggleDate = (d) => setPicked((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort()));

  const confirm = () => {
    if (!from || !to || from >= to) { setErr(tt.invalid); return; }
    if (mode === 'weekly') {
      if (!days.length) { setErr(tt.need_day); return; }
      const rest = rules.filter((r) => !(days.includes(Number(r.weekday)) && r.start_time === from && r.end_time === to));
      onChange([...rest, ...days.map((weekday) => ({ weekday, start_time: from, end_time: to }))]);
    } else {
      if (!picked.length) { setErr(tt.need_date); return; }
      const rest = dates.filter((r) => !(picked.includes(r.on_date) && r.start_time === from && r.end_time === to));
      onChangeDates([...rest, ...picked.map((on_date) => ({ on_date, start_time: from, end_time: to }))]);
      setPicked([]);
    }
    setOpen(false); setErr('');
  };

  const chip = (r, onRemove) => (
    <span key={r.i} className="av-chip">
      <Clock size={12} /> {fmtTime12(r.start_time, lang)} – {fmtTime12(r.end_time, lang)}
      <button type="button" title={tt.remove} onClick={() => onRemove(r.i)}><X size={12} /></button>
    </span>
  );

  return (
    <div className="tm-avail">
      <p className="muted tm-avail-hint">{tt.hint}</p>
      {byDay.length === 0 && byDate.length === 0 && <p className="empty small">{tt.none}</p>}
      {byDay.length > 0 && (
        <div className="av-days">
          {withDates && byDate.length > 0 && <div className="av-group-h"><Repeat size={13} /> {tt.weekly_h}</div>}
          {byDay.map((d) => (
            <div key={d.wd} className="av-day"><span className="av-day-name">{WEEKDAYS[lang][d.wd]}</span><div className="av-ranges">{d.items.map((r) => chip(r, removeRule))}</div></div>
          ))}
        </div>
      )}
      {withDates && byDate.length > 0 && (
        <div className="av-days">
          <div className="av-group-h"><CalendarDays size={13} /> {tt.dates_h}</div>
          {byDate.map((grp) => (
            <div key={grp[0].on_date} className="av-day"><span className="av-day-name av-date" dir="ltr">{fmtDate(grp[0].on_date, lang)}</span><div className="av-ranges">{grp.map((r) => chip(r, removeDate))}</div></div>
          ))}
        </div>
      )}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setErr(''); setOpen(true); }}><Plus size={15} /> {tt.add}</button>

      {open && (
        <div className="av-overlay" onClick={() => setOpen(false)}>
          <div className="av-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="av-dialog-head"><strong><Clock size={16} /> {tt.dlg_title}</strong><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></div>
            {withDates && (
              <div className="tm-mode-toggle" style={{ marginBottom: 12 }}>
                <button type="button" className={mode === 'weekly' ? 'active' : ''} onClick={() => { setMode('weekly'); setErr(''); }}><Repeat size={14} /> {tt.mode_weekly}</button>
                <button type="button" className={mode === 'dates' ? 'active' : ''} onClick={() => { setMode('dates'); setErr(''); }}><CalendarDays size={14} /> {tt.mode_dates}</button>
              </div>
            )}
            {err && <div className="form-alert error">{err}</div>}
            {mode === 'weekly' ? (
              <>
                <label className="av-label">{tt.days}</label>
                <div className="av-daypick">
                  {WEEKDAYS_SHORT[lang].map((n, i) => (
                    <button key={i} type="button" className={days.includes(i) ? 'sel' : ''} onClick={() => toggleDay(i)}>{days.includes(i) && <Check size={12} />} {n}</button>
                  ))}
                </div>
                <div className="av-presets">
                  <button type="button" onClick={() => setDays([0, 1, 2, 3, 4])}>{tt.workdays}</button>
                  <button type="button" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>{tt.all}</button>
                  <button type="button" onClick={() => setDays([])}>{tt.clear}</button>
                </div>
              </>
            ) : (
              <>
                <label className="av-label">{tt.pick_dates} {picked.length > 0 && <span className="av-count">{picked.length} {tt.selected}</span>}</label>
                <div className="av-cal"><MultiDateCalendar selected={picked} onToggle={toggleDate} lang={lang} /></div>
                {picked.length > 0 && <div className="av-presets"><button type="button" onClick={() => setPicked([])}>{tt.clear}</button></div>}
              </>
            )}
            <div className="av-times">
              <label><span>{tt.from}</span><input type="time" dir="ltr" step={300} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label><span>{tt.to}</span><input type="time" dir="ltr" step={300} value={to} onChange={(e) => setTo(e.target.value)} /></label>
            </div>
            <div className="av-dialog-foot">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>{tt.cancel}</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={confirm}><Plus size={14} /> {tt.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
