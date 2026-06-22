import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, UserRound, Stethoscope, FileText, X } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import {
  visitStatusColor, visitStatusLabel,
  VISIT_TYPES_BI, CLINICIAN_ROLES_BI, normBiList, normStaffList, biLabel,
} from '../account/status.js';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const startOfWeek = (d) => addDays(d, -d.getDay());
const sameDay = (a, b) => ymd(a) === ymd(b);
const parseJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };

const L = {
  ar: {
    title: 'تقويم الزيارات', sub: 'عرض الزيارات المجدولة (للاطلاع فقط)',
    month: 'شهري', week: 'أسبوعي', day: 'يومي', today: 'اليوم',
    no_visits: 'لا توجد زيارات في هذه الفترة.', more: 'أخرى',
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    wdShort: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    patient: 'المريض', type: 'نوع الزيارة', clinician: 'الكادر', ref: 'المرجع', time: 'الوقت', status: 'الحالة', no_time: 'بدون وقت',
    legend_scheduled: 'مجدولة', total: 'الإجمالي',
  },
  en: {
    title: 'Visits Calendar', sub: 'View scheduled visits (read-only)',
    month: 'Month', week: 'Week', day: 'Day', today: 'Today',
    no_visits: 'No visits in this period.', more: 'more',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    wdShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    patient: 'Patient', type: 'Visit type', clinician: 'Clinician', ref: 'Ref', time: 'Time', status: 'Status', no_time: 'No time',
    legend_scheduled: 'Scheduled', total: 'Total',
  },
};

export default function VisitsCalendar() {
  const { lang } = useLang();
  const tt = L[lang];
  const [visits, setVisits] = useState([]);
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(new Date());
  const [vTypes, setVTypes] = useState(VISIT_TYPES_BI);
  const [vRoles, setVRoles] = useState(CLINICIAN_ROLES_BI);
  const [vStaff, setVStaff] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    AdminAPI.allVisits().then(setVisits).catch(() => setVisits([]));
    AdminAPI.settings().then((rs) => {
      const get = (k) => rs.find((r) => r.key === k)?.value_ar;
      setVTypes(normBiList(parseJSON(get('visit_types')), VISIT_TYPES_BI));
      setVRoles(normBiList(parseJSON(get('clinician_roles')), CLINICIAN_ROLES_BI));
      setVStaff(normStaffList(parseJSON(get('clinical_staff')) || []));
    }).catch(() => {});
  }, []);

  const typeLabel = (v) => { const it = vTypes.find((x) => x.ar === v || x.en === v); return it ? biLabel(it, lang) : (v || ''); };
  const roleLabel = (v) => { const it = vRoles.find((x) => x.ar === v || x.en === v); return it ? biLabel(it, lang) : (v || ''); };
  const nameLabel = (v) => { const s = vStaff.find((x) => x.name_ar === v || x.name_en === v); return s ? biLabel({ ar: s.name_ar, en: s.name_en }, lang) : (v || ''); };

  // group visits by YYYY-MM-DD
  const byDay = useMemo(() => {
    const m = {};
    for (const v of visits) {
      const k = (v.visit_date || '').slice(0, 10);
      if (!k) continue;
      (m[k] = m[k] || []).push(v);
    }
    for (const k in m) m[k].sort((a, b) => (a.visit_time || '').localeCompare(b.visit_time || ''));
    return m;
  }, [visits]);

  const periodLabel = view === 'day'
    ? `${cursor.getDate()} ${tt.months[cursor.getMonth()]} ${cursor.getFullYear()}`
    : `${tt.months[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const step = (dir) => {
    if (view === 'month') setCursor((c) => addMonths(c, dir));
    else if (view === 'week') setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => addDays(c, dir));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{tt.title}</h1>
          <p className="page-hint">{tt.sub}</p>
        </div>
        <div className="cal-views">
          {['month', 'week', 'day'].map((v) => (
            <button key={v} className={`cal-view-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>{tt[v]}</button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="cal-toolbar">
          <div className="cal-nav">
            <button className="icon-act" onClick={() => step(-1)}><ChevronRight size={18} /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCursor(new Date())}>{tt.today}</button>
            <button className="icon-act" onClick={() => step(1)}><ChevronLeft size={18} /></button>
          </div>
          <strong className="cal-period">{periodLabel}</strong>
          <span className="cal-count"><CalendarDays size={15} /> {tt.total}: {visits.length}</span>
        </div>

        {view === 'month' && <MonthView cursor={cursor} byDay={byDay} tt={tt} lang={lang} onPick={(d) => { setCursor(d); setView('day'); }} typeLabel={typeLabel} openDetail={setDetail} />}
        {view === 'week' && <WeekView cursor={cursor} byDay={byDay} tt={tt} typeLabel={typeLabel} nameLabel={nameLabel} openDetail={setDetail} />}
        {view === 'day' && <DayView cursor={cursor} byDay={byDay} tt={tt} lang={lang} typeLabel={typeLabel} roleLabel={roleLabel} nameLabel={nameLabel} openDetail={setDetail} />}
      </div>

      {detail && <VisitDetail v={detail} tt={tt} typeLabel={typeLabel} roleLabel={roleLabel} nameLabel={nameLabel} lang={lang} onClose={() => setDetail(null)} />}
    </div>
  );
}

function Dot({ status }) { return <span style={{ width: 8, height: 8, borderRadius: '50%', background: visitStatusColor(status), display: 'inline-block', flex: '0 0 auto' }} />; }

function MonthView({ cursor, byDay, tt, lang, onPick, typeLabel, openDetail }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const todayStr = ymd(new Date());
  return (
    <div className="cal-month">
      <div className="cal-wd-row">{tt.wdShort.map((w) => <div key={w} className="cal-wd">{w}</div>)}</div>
      <div className="cal-grid">
        {cells.map((d) => {
          const key = ymd(d);
          const items = byDay[key] || [];
          const outside = d.getMonth() !== cursor.getMonth();
          return (
            <div key={key} className={`cal-cell ${outside ? 'outside' : ''} ${key === todayStr ? 'today' : ''}`} onClick={() => onPick(d)}>
              <div className="cal-cell-num">{d.getDate()}</div>
              <div className="cal-cell-items">
                {items.slice(0, 3).map((v) => (
                  <button key={v.id} className="cal-chip" style={{ borderInlineStartColor: visitStatusColor(v.status) }}
                    onClick={(e) => { e.stopPropagation(); openDetail(v); }} title={`${v.patient_name || ''} — ${typeLabel(v.visit_type)}`}>
                    {v.visit_time ? <b>{v.visit_time.slice(0, 5)}</b> : null} {v.patient_name || '—'}
                  </button>
                ))}
                {items.length > 3 && <span className="cal-more">+{items.length - 3} {tt.more}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, byDay, tt, typeLabel, nameLabel, openDetail }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const todayStr = ymd(new Date());
  return (
    <div className="cal-week">
      {days.map((d) => {
        const key = ymd(d);
        const items = byDay[key] || [];
        return (
          <div key={key} className={`cal-week-col ${key === todayStr ? 'today' : ''}`}>
            <div className="cal-week-head"><span>{tt.wdShort[d.getDay()]}</span><b>{d.getDate()}</b></div>
            <div className="cal-week-body">
              {items.length === 0 && <span className="cal-empty-mini">—</span>}
              {items.map((v) => (
                <button key={v.id} className="cal-wcard" style={{ borderInlineStartColor: visitStatusColor(v.status) }} onClick={() => openDetail(v)}>
                  <span className="cal-wcard-t">{v.visit_time ? v.visit_time.slice(0, 5) : tt.no_time}</span>
                  <strong>{v.patient_name || '—'}</strong>
                  <small>{typeLabel(v.visit_type)}{v.clinician_name ? ` · ${nameLabel(v.clinician_name)}` : ''}</small>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ cursor, byDay, tt, lang, typeLabel, roleLabel, nameLabel, openDetail }) {
  const items = byDay[ymd(cursor)] || [];
  if (items.length === 0) return <p className="empty">{tt.no_visits}</p>;
  return (
    <div className="cal-day">
      {items.map((v) => (
        <button key={v.id} className="cal-dcard" onClick={() => openDetail(v)}>
          <div className="cal-dcard-time"><Clock size={14} /> {v.visit_time ? v.visit_time.slice(0, 5) : tt.no_time}</div>
          <div className="cal-dcard-main">
            <strong>{v.patient_name || '—'}</strong>
            <div className="cal-dcard-meta">
              <span><Stethoscope size={13} /> {typeLabel(v.visit_type)}</span>
              {v.clinician_name && <span><UserRound size={13} /> {nameLabel(v.clinician_name)}{v.clinician_role ? ` — ${roleLabel(v.clinician_role)}` : ''}</span>}
              {v.ref && <span><FileText size={13} /> <span dir="ltr">{v.ref}</span></span>}
            </div>
          </div>
          <span className="status-pill" style={{ color: visitStatusColor(v.status), background: visitStatusColor(v.status) + '1e' }}>{visitStatusLabel(v.status, lang)}</span>
        </button>
      ))}
    </div>
  );
}

function VisitDetail({ v, tt, typeLabel, roleLabel, nameLabel, lang, onClose }) {
  const rows = [
    [tt.patient, v.patient_name],
    [tt.time, v.visit_time ? v.visit_time.slice(0, 5) : tt.no_time],
    [tt.type, typeLabel(v.visit_type)],
    [tt.clinician, v.clinician_name ? `${nameLabel(v.clinician_name)}${v.clinician_role ? ' — ' + roleLabel(v.clinician_role) : ''}` : ''],
    [tt.ref, v.ref],
  ];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{v.visit_date?.slice(0, 10)}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <span className="status-pill" style={{ color: visitStatusColor(v.status), background: visitStatusColor(v.status) + '1e' }}>{visitStatusLabel(v.status, lang)}</span>
          </div>
          <div className="detail-meta wide">
            {rows.filter(([, val]) => val).map(([k, val]) => <div key={k}><span>{k}</span><b dir="auto">{val}</b></div>)}
          </div>
          {v.notes && <div className="detail-diag"><span>{lang === 'en' ? 'Notes' : 'ملاحظات'}</span><p dir="auto">{v.notes}</p></div>}
        </div>
      </div>
    </div>
  );
}
