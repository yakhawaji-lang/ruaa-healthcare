// Weekly availability editor — compact: ranges are shown as chips grouped by
// day; "Add range" opens a small dialog where one range can be applied to
// several days at once. rules: [{ weekday, start_time, end_time }].
import { useState } from 'react';
import { Plus, X, Clock, Check } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { WEEKDAYS, WEEKDAYS_SHORT, fmtTime12 } from './status.js';

const T = {
  ar: { hint: 'حدّد أيام وأوقات استقبال الاستشارات. يُقسَّم كل نطاق تلقائيًا إلى مواعيد بحسب مدة الاستشارة.', add: 'إضافة نطاق', none: 'لا توجد أوقات محددة — لن يظهر للحجز الذاتي.',
    dlg_title: 'إضافة نطاق توفر', days: 'الأيام', from: 'من', to: 'إلى', invalid: 'نهاية النطاق يجب أن تكون بعد بدايته.', need_day: 'اختر يومًا واحدًا على الأقل.', workdays: 'أيام العمل (أحد–خميس)', all: 'كل الأيام', clear: 'مسح', confirm: 'إضافة', cancel: 'إلغاء', remove: 'حذف النطاق' },
  en: { hint: 'Set the days and hours consultations are accepted. Each range is cut into slots by the consultation length.', add: 'Add range', none: 'No hours set — not available for self-booking.',
    dlg_title: 'Add availability range', days: 'Days', from: 'From', to: 'To', invalid: 'The end must be after the start.', need_day: 'Pick at least one day.', workdays: 'Workdays (Sun–Thu)', all: 'All days', clear: 'Clear', confirm: 'Add', cancel: 'Cancel', remove: 'Remove range' },
};

export default function AvailabilityEditor({ rules = [], onChange }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState([0, 1, 2, 3, 4]);
  const [from, setFrom] = useState('09:00');
  const [to, setTo] = useState('13:00');
  const [err, setErr] = useState('');

  const byDay = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({
    wd,
    items: rules.map((r, i) => ({ ...r, i })).filter((r) => Number(r.weekday) === wd).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((d) => d.items.length);

  const remove = (i) => onChange(rules.filter((_, j) => j !== i));
  const toggleDay = (d) => setDays((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort()));
  const confirm = () => {
    if (!days.length) { setErr(tt.need_day); return; }
    if (!from || !to || from >= to) { setErr(tt.invalid); return; }
    // replace an identical range on the same day instead of duplicating it
    const rest = rules.filter((r) => !(days.includes(Number(r.weekday)) && r.start_time === from && r.end_time === to));
    onChange([...rest, ...days.map((weekday) => ({ weekday, start_time: from, end_time: to }))]);
    setOpen(false); setErr('');
  };

  return (
    <div className="tm-avail">
      <p className="muted tm-avail-hint">{tt.hint}</p>
      {byDay.length === 0 ? <p className="empty small">{tt.none}</p> : (
        <div className="av-days">
          {byDay.map((d) => (
            <div key={d.wd} className="av-day">
              <span className="av-day-name">{WEEKDAYS[lang][d.wd]}</span>
              <div className="av-ranges">
                {d.items.map((r) => (
                  <span key={r.i} className="av-chip">
                    <Clock size={12} /> {fmtTime12(r.start_time, lang)} – {fmtTime12(r.end_time, lang)}
                    <button type="button" title={tt.remove} onClick={() => remove(r.i)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setErr(''); setOpen(true); }}><Plus size={15} /> {tt.add}</button>

      {open && (
        <div className="av-overlay" onClick={() => setOpen(false)}>
          <div className="av-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="av-dialog-head"><strong><Clock size={16} /> {tt.dlg_title}</strong><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></div>
            {err && <div className="form-alert error">{err}</div>}
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
