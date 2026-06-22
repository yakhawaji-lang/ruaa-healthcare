import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Images, Stethoscope, ClipboardList, ShieldPlus, Building2, Handshake, FileText, Mail, Settings, LogOut, ExternalLink, Globe, CalendarDays, Users2, UserRound } from 'lucide-react';
import { useAdminAuth } from './AdminApp.jsx';
import { useLang } from '../i18n.jsx';
import Logo from '../components/Logo.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';

// Grouped navigation by relationship between pages.
const GROUPS = [
  { items: [
    { to: '/admin', end: true, page: 'dashboard', icon: LayoutDashboard, ar: 'لوحة التحكم', en: 'Dashboard' },
  ] },
  { ar: 'العمليات', en: 'Operations', items: [
    { to: '/admin/requests', page: 'requests', icon: ClipboardList, ar: 'طلبات الخدمات', en: 'Service Requests' },
    { to: '/admin/cases', page: 'cases', icon: ShieldPlus, ar: 'حالات التأمين', en: 'Insurance Cases' },
    { to: '/admin/visits', page: 'visits', icon: CalendarDays, ar: 'تقويم الزيارات', en: 'Visits Calendar' },
    { to: '/admin/messages', page: 'messages', icon: Mail, ar: 'الرسائل', en: 'Messages' },
  ] },
  { ar: 'الحسابات', en: 'Accounts', items: [
    { to: '/admin/clients', page: 'clients', icon: UserRound, ar: 'حسابات العملاء', en: 'Client Accounts' },
    { to: '/admin/insurers', page: 'insurers', icon: Building2, ar: 'شركات التأمين', en: 'Insurance Companies' },
  ] },
  { ar: 'محتوى الموقع', en: 'Website Content', items: [
    { to: '/admin/services', page: 'services', icon: Stethoscope, ar: 'الخدمات', en: 'Services' },
    { to: '/admin/hero', page: 'hero', icon: Images, ar: 'السلايدر', en: 'Slider' },
    { to: '/admin/partners', page: 'partners', icon: Handshake, ar: 'الشركاء', en: 'Partners' },
    { to: '/admin/pages', page: 'pages', icon: FileText, ar: 'الصفحات', en: 'Pages' },
  ] },
  { ar: 'النظام', en: 'System', items: [
    { to: '/admin/settings', page: 'settings', icon: Settings, ar: 'الإعدادات', en: 'Settings' },
    { to: '/admin/users', page: 'users', superOnly: true, icon: Users2, ar: 'إدارة المستخدمين', en: 'User Management' },
  ] },
];

const T = {
  ar: { view_site: 'عرض الموقع', logout: 'خروج', welcome: 'مرحبًا' },
  en: { view_site: 'View Site', logout: 'Logout', welcome: 'Welcome' },
};

export default function AdminLayout({ children }) {
  const { admin, logout, can } = useAdminAuth();
  const { lang, dir, toggle } = useLang();
  const tt = T[lang];
  const visible = (n) => (n.superOnly ? admin?.is_super : (admin?.is_super || can(n.page, 'view')));
  return (
    <div className="admin-shell" dir={dir}>
      <aside className="admin-sidebar">
        <div className="admin-brand"><Logo size={38} /><span>رؤى</span></div>
        <nav className="admin-nav">
          {GROUPS.map((g, gi) => {
            const items = g.items.filter(visible);
            if (items.length === 0) return null;
            return (
              <div key={gi} className="admin-nav-group">
                {g.ar && <div className="admin-nav-group-title">{lang === 'en' ? g.en : g.ar}</div>}
                {items.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end}
                    className={({ isActive }) => (isActive ? 'active' : '')}>
                    <n.icon size={19} /> <span>{lang === 'en' ? n.en : n.ar}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noreferrer" className="view-site"><ExternalLink size={16} /> {tt.view_site}</a>
          <button onClick={logout} className="logout-btn"><LogOut size={16} /> {tt.logout}</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-welcome">{tt.welcome}، {admin?.name}</span>
          <div className="admin-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="lang-btn" onClick={toggle} aria-label="language">
              <Globe size={16} /> {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <NotificationBell kind="admin" />
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
