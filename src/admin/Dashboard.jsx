import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, MailOpen, ClipboardList, ShieldPlus, CalendarDays } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import StatsPanel, { TrendChart } from '../account/StatsPanel.jsx';
import { STATUS, VISIT_STATUS, REQUEST_STATUSES, CASE_STATUSES, VISIT_STATUSES } from '../account/status.js';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    dashboard: 'لوحة التحكم', service_requests: 'طلبات الخدمات', insurance_cases: 'حالات التأمين',
    upcoming_visits: 'زيارات قادمة', services: 'الخدمات', unread_messages: 'الرسائل غير المقروءة',
    new: 'جديدة', statistics: 'الإحصائيات',
    requests_by_status: 'طلبات الخدمات حسب الحالة', cases_by_status: 'حالات التأمين حسب الحالة',
    visits_by_status: 'الزيارات حسب الحالة', trend_title: 'الطلبات والحالات (آخر 6 أشهر)',
    latest_messages: 'أحدث الرسائل', view_all: 'عرض الكل',
    name: 'الاسم', service: 'الخدمة', phone: 'الهاتف', date: 'التاريخ',
    no_messages: 'لا توجد رسائل بعد.',
  },
  en: {
    dashboard: 'Dashboard', service_requests: 'Service Requests', insurance_cases: 'Insurance Cases',
    upcoming_visits: 'Upcoming Visits', services: 'Services', unread_messages: 'Unread Messages',
    new: 'New', statistics: 'Statistics',
    requests_by_status: 'Service requests by status', cases_by_status: 'Insurance cases by status',
    visits_by_status: 'Visits by status', trend_title: 'Requests & cases (last 6 months)',
    latest_messages: 'Latest Messages', view_all: 'View all',
    name: 'Name', service: 'Service', phone: 'Phone', date: 'Date',
    no_messages: 'No messages yet.',
  },
};

const seg = (statuses, map = {}, meta = STATUS, lang = 'ar') =>
  statuses.map((st) => ({ key: st, label: meta[st]?.[lang] || meta[st]?.ar || st, color: meta[st]?.color || '#5a6f7a', value: map[st] || 0 }));

export default function Dashboard() {
  const { lang } = useLang();
  const tt = T[lang];
  const [stats, setStats] = useState(null);
  const [an, setAn] = useState(null);
  useEffect(() => {
    AdminAPI.stats().then(setStats).catch(() => {});
    AdminAPI.analytics().then(setAn).catch(() => {});
  }, []);

  const cards = [
    { label: tt.service_requests, value: stats?.requests, icon: ClipboardList, to: '/admin/requests', color: '#0b3556', badge: stats?.requestsPending },
    { label: tt.insurance_cases, value: stats?.cases, icon: ShieldPlus, to: '/admin/cases', color: '#1f7d92', badge: stats?.casesPending },
    { label: tt.upcoming_visits, value: stats?.visitsUpcoming, icon: CalendarDays, to: '/admin/requests', color: '#2e8b57' },
    { label: tt.services, value: stats?.services, icon: Stethoscope, to: '/admin/services', color: '#5eafbe' },
    { label: tt.unread_messages, value: stats?.unread, icon: MailOpen, to: '/admin/messages', color: '#e08a3c' },
  ];

  return (
    <div className="dash">
      <h1 className="page-title">{tt.dashboard}</h1>
      <div className="stat-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="stat-card">
            <div className="stat-icon" style={{ background: c.color + '22', color: c.color }}><c.icon size={24} /></div>
            <div>
              <div className="stat-value">{c.value ?? '—'}{c.badge ? <span className="stat-badge">{c.badge} {tt.new}</span> : null}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {an && (
        <>
          <h2 className="section-h2">{tt.statistics}</h2>
          <div className="analytics-grid">
            <StatsPanel segments={seg(REQUEST_STATUSES, an.requestsByStatus, STATUS, lang)} title={tt.requests_by_status} />
            <StatsPanel segments={seg(CASE_STATUSES, an.casesByStatus, STATUS, lang)} title={tt.cases_by_status} />
            <StatsPanel segments={seg(VISIT_STATUSES, an.visitsByStatus, VISIT_STATUS, lang)} title={tt.visits_by_status} />
            <TrendChart data={an.monthly} title={tt.trend_title} />
          </div>
        </>
      )}

      <div className="panel">
        <div className="panel-head"><h2>{tt.latest_messages}</h2><Link to="/admin/messages" className="link">{tt.view_all}</Link></div>
        {stats?.recent?.length ? (
          <table className="admin-table">
            <thead><tr><th>{tt.name}</th><th>{tt.service}</th><th>{tt.phone}</th><th>{tt.date}</th></tr></thead>
            <tbody>
              {stats.recent.map((m) => (
                <tr key={m.id} className={m.is_read ? '' : 'unread-row'}>
                  <td>{m.name}</td>
                  <td>{m.service || '—'}</td>
                  <td dir="ltr">{m.phone || '—'}</td>
                  <td>{new Date(m.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty">{tt.no_messages}</p>}
      </div>
    </div>
  );
}
