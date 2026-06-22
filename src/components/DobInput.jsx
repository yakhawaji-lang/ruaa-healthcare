// Date field with the smoothest manual entry: three numeric boxes (Day / Month /
// Year) that auto-advance as you type, PLUS a calendar button for picking.
// Default emits/accepts "DD/MM/YYYY" (date of birth). Pass `iso` to emit/accept
// "YYYY-MM-DD" and allow future dates (e.g. visits).
import { useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useLang } from '../i18n.jsx';

const pad = (n) => String(n).padStart(2, '0');

function parseValue(value) {
  let m = (value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // DD/MM/YYYY
  if (m) return { d: m[1], mo: m[2], y: m[3] };
  m = (value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); // YYYY-MM-DD
  if (m) return { d: m[3], mo: m[2], y: m[1] };
  return { d: '', mo: '', y: '' };
}

export default function DobInput({ value, onChange, id, iso = false, max, min }) {
  const { lang } = useLang();
  const init = parseValue(value);
  const [d, setD] = useState(init.d);
  const [mo, setMo] = useState(init.mo);
  const [y, setY] = useState(init.y);
  const moRef = useRef(null);
  const yRef = useRef(null);
  const calRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);
  const effMax = max !== undefined ? max : (iso ? undefined : today);
  const effMin = min !== undefined ? min : (iso ? undefined : '1900-01-01');
  const calTitle = lang === 'en' ? 'Open calendar' : 'فتح التقويم';
  const ph = lang === 'en'
    ? { d: 'DD', mo: 'MM', y: 'YYYY' }
    : { d: 'يوم', mo: 'شهر', y: 'سنة' };

  const emit = (dd, mm, yy) => onChange(dd && mm && yy ? (iso ? `${yy}-${pad(mm)}-${pad(dd)}` : `${pad(dd)}/${pad(mm)}/${yy}`) : '');

  const onD = (e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setD(v); emit(v, mo, y); if (v.length === 2) moRef.current?.focus(); };
  const onMo = (e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setMo(v); emit(d, v, y); if (v.length === 2) yRef.current?.focus(); };
  const onY = (e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setY(v); emit(d, mo, v); };

  const pickerValue = d && mo && y ? `${y}-${pad(mo)}-${pad(d)}` : '';
  const onPick = (e) => { const p = parseValue(e.target.value); setD(p.d); setMo(p.mo); setY(p.y); emit(p.d, p.mo, p.y); };
  const openCal = () => { const el = calRef.current; if (!el) return; if (typeof el.showPicker === 'function') el.showPicker(); else el.click(); };

  const box = { textAlign: 'center', minWidth: 0 };
  return (
    <div className="dob-field" style={{ display: 'flex', gap: 6, alignItems: 'stretch', position: 'relative' }}>
      <input className="fld-input" dir="ltr" inputMode="numeric" id={id} style={{ ...box, flex: 1 }} value={d} placeholder={ph.d} onChange={onD} />
      <input className="fld-input" dir="ltr" inputMode="numeric" ref={moRef} style={{ ...box, flex: 1 }} value={mo} placeholder={ph.mo} onChange={onMo} />
      <input className="fld-input" dir="ltr" inputMode="numeric" ref={yRef} style={{ ...box, flex: 1.5 }} value={y} placeholder={ph.y} onChange={onY} />
      <button type="button" className="btn btn-outline btn-sm" onClick={openCal} title={calTitle} style={{ flex: '0 0 auto' }}>
        <Calendar size={16} />
      </button>
      <input ref={calRef} type="date" tabIndex={-1} aria-hidden="true" max={effMax} min={effMin}
        value={pickerValue} onChange={onPick}
        style={{ position: 'absolute', inset: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
