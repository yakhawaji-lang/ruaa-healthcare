import { PieChart, TrendingUp } from 'lucide-react';
import { STATUS } from './status.js';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    stats: 'إحصائيات', total: 'إجمالي', completed: 'مكتملة', in_progress: 'قيد المعالجة',
    monthly_trend: 'الاتجاه الشهري', requests: 'الطلبات', cases: 'الحالات',
    no_data: 'لا توجد بيانات كافية.',
  },
  en: {
    stats: 'Statistics', total: 'Total', completed: 'Completed', in_progress: 'In progress',
    monthly_trend: 'Monthly trend', requests: 'Requests', cases: 'Cases',
    no_data: 'Not enough data.',
  },
};

// Professional, dependency-free stats: an SVG donut + status bars.
// Pass either (items + statuses) to compute, or precomputed `segments`.
export default function StatsPanel({ items, statuses = [], segments, title }) {
  const { lang } = useLang();
  const tt = T[lang];
  const heading = title ?? tt.stats;
  const counts = segments || statuses.map((st) => ({
    key: st, label: STATUS[st]?.[lang] || STATUS[st]?.ar || st, color: STATUS[st]?.color || '#5a6f7a',
    value: (items || []).filter((it) => it.status === st).length,
  }));
  const total = counts.reduce((a, c) => a + c.value, 0);
  const valOf = (k) => counts.find((c) => c.key === k)?.value || 0;
  const completed = valOf('completed');
  const inProgress = ['in_progress', 'scheduled', 'visit_scheduled', 'approved'].reduce((a, k) => a + valOf(k), 0);
  const maxVal = Math.max(1, ...counts.map((c) => c.value));

  const R = 56, SW = 20, C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = counts.filter((c) => c.value > 0).map((c) => {
    const dash = (total ? c.value / total : 0) * C;
    const a = { ...c, dash, offset }; offset += dash; return a;
  });

  return (
    <div className="side-card stats-card">
      <div className="side-card-head"><PieChart size={18} /> <h3>{heading}</h3></div>
      <div className="stats-body">
        <div className="stats-donut">
          <svg viewBox="0 0 150 150" className="donut-svg">
            <circle cx="75" cy="75" r={R} fill="none" stroke="#eef3f4" strokeWidth={SW} />
            {arcs.map((s) => (
              <circle key={s.key} cx="75" cy="75" r={R} fill="none" stroke={s.color} strokeWidth={SW}
                strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={-s.offset} transform="rotate(-90 75 75)" />
            ))}
            <text x="75" y="68" textAnchor="middle" className="donut-total">{total}</text>
            <text x="75" y="90" textAnchor="middle" className="donut-cap">{tt.total}</text>
          </svg>
          <div className="stats-mini">
            <div><b style={{ color: '#2e8b57' }}>{completed}</b><span>{tt.completed}</span></div>
            <div><b style={{ color: '#3b82f6' }}>{inProgress}</b><span>{tt.in_progress}</span></div>
          </div>
        </div>
        <div className="stats-bars">
          {counts.map((c) => (
            <div key={c.key} className="stat-bar-row">
              <span className="sb-label">{c.label}</span>
              <div className="sb-track"><div className="sb-fill" style={{ width: `${(c.value / maxVal) * 100}%`, background: c.color }} /></div>
              <span className="sb-val">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Monthly trend: grouped bars (requests vs cases) over the last months.
export function TrendChart({ data = [], title }) {
  const { lang } = useLang();
  const tt = T[lang];
  const heading = title ?? tt.monthly_trend;
  const max = Math.max(1, ...data.flatMap((d) => [d.requests || 0, d.cases || 0]));
  return (
    <div className="side-card">
      <div className="side-card-head"><TrendingUp size={18} /> <h3>{heading}</h3></div>
      <div className="trend-body">
        <div className="trend-legend">
          <span><i style={{ background: '#1f7d92' }} /> {tt.requests}</span>
          <span><i style={{ background: '#0b3556' }} /> {tt.cases}</span>
        </div>
        {data.length === 0 ? <p className="empty small">{tt.no_data}</p> : (
          <div className="trend-bars">
            {data.map((d) => (
              <div key={d.ym} className="trend-col">
                <div className="trend-pair">
                  <div className="tb" style={{ height: `${(d.requests / max) * 100}%`, background: '#1f7d92' }} title={`${tt.requests}: ${d.requests}`} />
                  <div className="tb" style={{ height: `${(d.cases / max) * 100}%`, background: '#0b3556' }} title={`${tt.cases}: ${d.cases}`} />
                </div>
                <span className="trend-label" dir="ltr">{d.ym}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
