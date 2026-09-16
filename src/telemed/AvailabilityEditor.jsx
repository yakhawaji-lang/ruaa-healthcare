// Weekly availability editor (used by the doctor for their own schedule and by
// the admin for any doctor). rules: [{ weekday, start_time, end_time }].
import { Plus, Trash2 } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { WEEKDAYS } from './status.js';

const T = {
  ar: { hint: 'حدّد أيام وأوقات استقبال الاستشارات. يُقسَّم كل نطاق تلقائيًا إلى مواعيد بحسب مدة الاستشارة.', add: 'إضافة نطاق', from: 'من', to: 'إلى', day: 'اليوم', none: 'لا توجد أوقات محددة — لن يظهر الطبيب للحجز الذاتي.', invalid: 'نهاية النطاق يجب أن تكون بعد بدايته.' },
  en: { hint: 'Set the days and hours consultations are accepted. Each range is cut into slots by the consultation length.', add: 'Add range', from: 'From', to: 'To', day: 'Day', none: 'No hours set — the doctor will not be available for self-booking.', invalid: 'The end must be after the start.' },
};

export default function AvailabilityEditor({ rules = [], onChange }) {
  const { lang } = useLang();
  const tt = T[lang];
  const set = (i, k, v) => onChange(rules.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const add = () => onChange([...rules, { weekday: 0, start_time: '09:00', end_time: '13:00' }]);
  const remove = (i) => onChange(rules.filter((_, j) => j !== i));
  const sorted = rules.map((r, i) => ({ ...r, i })).sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));

  return (
    <div className="tm-avail">
      <p className="muted tm-avail-hint">{tt.hint}</p>
      {rules.length === 0 && <p className="empty small">{tt.none}</p>}
      {sorted.map((r) => (
        <div key={r.i} className={`tm-avail-row ${r.start_time >= r.end_time ? 'bad' : ''}`}>
          <label><span>{tt.day}</span>
            <select value={r.weekday} onChange={(e) => set(r.i, 'weekday', Number(e.target.value))}>
              {WEEKDAYS[lang].map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
          <label><span>{tt.from}</span><input type="time" dir="ltr" step={300} value={r.start_time} onChange={(e) => set(r.i, 'start_time', e.target.value)} /></label>
          <label><span>{tt.to}</span><input type="time" dir="ltr" step={300} value={r.end_time} onChange={(e) => set(r.i, 'end_time', e.target.value)} /></label>
          <button type="button" className="tm-icon-btn danger" onClick={() => remove(r.i)} title="remove"><Trash2 size={16} /></button>
          {r.start_time >= r.end_time && <small className="tm-avail-err">{tt.invalid}</small>}
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={add}><Plus size={15} /> {tt.add}</button>
    </div>
  );
}
