import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut, Home, User, Building2, Globe } from 'lucide-react';
import { useAccount } from './AccountContext.jsx';
import { useLang } from '../i18n.jsx';
import VisitorPortal, { RequestDetail } from './VisitorPortal.jsx';
import InsurancePortal, { CaseDetail } from './InsurancePortal.jsx';
import Logo from '../components/Logo.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import './account.css';

const T = {
  ar: { insurance_account: 'حساب شركة تأمين', visitor_account: 'حساب عميل', site: 'الموقع', logout: 'خروج' },
  en: { insurance_account: 'Insurance company account', visitor_account: 'Client account', site: 'Website', logout: 'Logout' },
};

export default function Portal() {
  const { user, logout } = useAccount();
  const { lang, toggle } = useLang();
  const tt = T[lang];

  if (user === undefined) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const isInsurance = user.role === 'insurance';

  return (
    <div className="portal">
      <div className="container">
        <div className="portal-head">
          <div className="portal-id">
            <Logo size={40} />
            <div>
              <strong>{isInsurance ? (user.company_name || user.name) : user.name}</strong>
              <span className="portal-role">
                {isInsurance ? <><Building2 size={13} /> {tt.insurance_account}</> : <><User size={13} /> {tt.visitor_account}</>}
              </span>
            </div>
          </div>
          <div className="portal-actions">
            <button className="lang-btn" onClick={toggle} aria-label="language">
              <Globe size={16} /> {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <NotificationBell kind="account" />
            <Link to="/" className="btn btn-ghost btn-sm"><Home size={15} /> {tt.site}</Link>
            <button className="btn btn-outline btn-sm" onClick={logout}><LogOut size={15} /> {tt.logout}</button>
          </div>
        </div>

        <Routes>
          <Route index element={isInsurance ? <InsurancePortal /> : <VisitorPortal />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </div>
    </div>
  );
}
