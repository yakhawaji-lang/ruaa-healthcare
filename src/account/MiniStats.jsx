import { Layers, Loader, CheckCircle2, Percent } from 'lucide-react';
import { useLang } from '../i18n.jsx';

const ACTIVE = ['pending', 'submitted', 'reviewing', 'approved', 'scheduled', 'visit_scheduled', 'in_progress'];

const T = {
  ar: { total: 'إجمالي', in_progress: 'قيد المعالجة', completed: 'مكتملة', rate: 'نسبة الإنجاز' },
  en: { total: 'Total', in_progress: 'In progress', completed: 'Completed', rate: 'Completion rate' },
};

function Ring({ value, max, color, display }) {
  const R = 26, SW = 6, C = 2 * Math.PI * R;
  const frac = max ? Math.min(1, value / max) : 0;
  return (
    <svg viewBox="0 0 64 64" className="mini-ring-svg">
      <circle cx="32" cy="32" r={R} fill="none" stroke="#eef3f4" strokeWidth={SW} />
      <circle cx="32" cy="32" r={R} fill="none" stroke={color} strokeWidth={SW}
        strokeDasharray={`${frac * C} ${C}`} strokeLinecap="round" transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" className="mini-ring-val" style={{ fill: color }}>{display}</text>
    </svg>
  );
}

// Four compact KPI ring-cards summarizing the account's cases/requests.
export default function MiniStats({ items = [], noun }) {
  const { lang } = useLang();
  const tt = T[lang];
  const total = items.length;
  const inProgress = items.filter((it) => ACTIVE.includes(it.status)).length;
  const completed = items.filter((it) => it.status === 'completed').length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const totalLabel = noun ? `${tt.total} ${noun}` : tt.total;

  const cards = [
    { icon: Layers, label: totalLabel, value: total, max: total || 1, color: '#0b3556', display: total },
    { icon: Loader, label: tt.in_progress, value: inProgress, max: total || 1, color: '#3b82f6', display: inProgress },
    { icon: CheckCircle2, label: tt.completed, value: completed, max: total || 1, color: '#2e8b57', display: completed },
    { icon: Percent, label: tt.rate, value: rate, max: 100, color: '#1f7d92', display: `${rate}%` },
  ];

  return (
    <div className="mini-stats">
      {cards.map((c) => (
        <div key={c.label} className="mini-stat">
          <Ring value={c.value} max={c.max} color={c.color} display={c.display} />
          <div className="mini-stat-text">
            <span className="mini-stat-label">{c.label}</span>
            <span className="mini-stat-ico" style={{ color: c.color }}><c.icon size={15} /></span>
          </div>
        </div>
      ))}
    </div>
  );
}
