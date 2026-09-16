import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut, Home, User, Building2, Globe, Stethoscope } from 'lucide-react';
import { useAccount } from './AccountContext.jsx';
import { useLang } from '../i18n.jsx';
import VisitorPortal, { RequestDetail } from './VisitorPortal.jsx';
import InsurancePortal, { CaseDetail } from './InsurancePortal.jsx';
import DoctorPortal from '../telemed/DoctorPortal.jsx';
import DoctorConsultation from '../telemed/DoctorConsultation.jsx';
import ConsultationDetail from '../telemed/ConsultationDetail.jsx';
import ConsultationRoom from '../telemed/ConsultationRoom.jsx';
import Logo from '../components/Logo.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import './account.css';

const T = {
  ar: { insurance_account: 'حساب شركة تأمين', visitor_account: 'حساب عميل', doctor_account: 'حساب طبيب', site: 'الموقع', logout: 'خروج' },
  en: { insurance_account: 'Insurance company account', visitor_account: 'Client account', doctor_account: 'Doctor account', site: 'Website', logout: 'Logout' },
};

export default function Portal() {
  const { user, logout } = useAccount();
  const { lang, toggle } = useLang();
  const tt = T[lang];

  if (user === undefined) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const isInsurance = user.role === 'insurance';
  const isDoctor = user.role === 'doctor';

  return (
    <div className="portal">
      <div className="container">
        <div className="portal-head">
          <div className="portal-id">
            <Logo size={40} />
            <div>
              <strong>{isInsurance ? (user.company_name || user.name) : isDoctor ? `د. ${user.name}` : user.name}</strong>
              <span className="portal-role">
                {isInsurance ? <><Building2 size={13} /> {tt.insurance_account}</>
                  : isDoctor ? <><Stethoscope size={13} /> {tt.doctor_account}</>
                  : <><User size={13} /> {tt.visitor_account}</>}
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
          <Route index element={isInsurance ? <InsurancePortal /> : isDoctor ? <DoctorPortal /> : <VisitorPortal />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          {/* telemedicine: patient + doctor share the same paths; the role picks the view */}
          <Route path="consultations/:id" element={isDoctor ? <DoctorConsultation /> : <ConsultationDetail />} />
          <Route path="consultations/:id/room" element={<ConsultationRoom />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </div>
    </div>
  );
}
