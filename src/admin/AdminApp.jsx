import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthAPI } from '../storage/api.js';
import Login from './Login.jsx';
import AdminLayout from './AdminLayout.jsx';
import Dashboard from './Dashboard.jsx';
import HeroSlidesManager from './HeroSlidesManager.jsx';
import PartnersManager from './PartnersManager.jsx';
import ServicesManager from './ServicesManager.jsx';
import PromoCodesManager from './PromoCodesManager.jsx';
import ServiceRequestsManager from './ServiceRequestsManager.jsx';
import InsuranceCasesManager from './InsuranceCasesManager.jsx';
import InsuranceCompaniesManager from './InsuranceCompaniesManager.jsx';
import PagesManager from './PagesManager.jsx';
import MessagesManager from './MessagesManager.jsx';
import SettingsManager from './SettingsManager.jsx';
import VisitsCalendar from './VisitsCalendar.jsx';
import UsersManager from './UsersManager.jsx';
import ClientsManager from './ClientsManager.jsx';
import './admin.css';

// page key -> route path + element
const PAGE_ROUTES = [
  ['dashboard', '', Dashboard],
  ['requests', 'requests', ServiceRequestsManager],
  ['cases', 'cases', InsuranceCasesManager],
  ['visits', 'visits', VisitsCalendar],
  ['insurers', 'insurers', InsuranceCompaniesManager],
  ['clients', 'clients', ClientsManager],
  ['hero', 'hero', HeroSlidesManager],
  ['partners', 'partners', PartnersManager],
  ['services', 'services', ServicesManager],
  ['promos', 'promos', PromoCodesManager],
  ['pages', 'pages', PagesManager],
  ['messages', 'messages', MessagesManager],
  ['settings', 'settings', SettingsManager],
];
export const can = (admin, page, action = 'view') => !!admin && (admin.is_super || !!admin.permissions?.pages?.[page]?.[action]);
const firstAllowedPath = (admin) => {
  if (!admin) return '/admin';
  if (admin.is_super) return '/admin';
  const hit = PAGE_ROUTES.find(([key]) => can(admin, key, 'view'));
  return hit ? `/admin/${hit[1]}` : '/admin/no-access';
};

const AdminAuth = createContext(null);
export const useAdminAuth = () => useContext(AdminAuth);

export default function AdminApp() {
  const [admin, setAdmin] = useState(undefined); // undefined = loading

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setAdmin(null); return; }
    AuthAPI.me().then((r) => setAdmin(r.admin)).catch(() => {
      localStorage.removeItem('admin_token');
      setAdmin(null);
    });
  }, []);

  const login = (data) => {
    localStorage.setItem('admin_token', data.token);
    setAdmin(data.admin);
  };
  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  if (admin === undefined) return <div className="admin-loader"><div className="spinner" /></div>;

  const fallback = firstAllowedPath(admin);

  return (
    <AdminAuth.Provider value={{ admin, login, logout, can: (page, action) => can(admin, page, action) }}>
      {!admin ? (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <AdminLayout>
          <Routes>
            {PAGE_ROUTES.map(([key, path, Comp]) => (
              can(admin, key, 'view') && (
                path === ''
                  ? <Route key={key} index element={<Comp />} />
                  : <Route key={key} path={path} element={<Comp />} />
              )
            ))}
            {admin.is_super && <Route path="users" element={<UsersManager />} />}
            <Route path="no-access" element={<div className="panel"><p className="empty">{admin.is_super ? '' : 'لا تملك صلاحية للوصول إلى أي صفحة. تواصل مع مدير النظام. / You have no page access. Contact your administrator.'}</p></div>} />
            <Route path="*" element={<Navigate to={fallback} replace />} />
          </Routes>
        </AdminLayout>
      )}
    </AdminAuth.Provider>
  );
}
