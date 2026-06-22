import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { PublicAPI } from './storage/api.js';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminApp from './admin/AdminApp.jsx';
import { AccountProvider } from './account/AccountContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AccountLogin from './account/AccountLogin.jsx';
import AccountRegister from './account/AccountRegister.jsx';
import Portal from './account/Portal.jsx';

// Shared site data (settings + services) fetched once.
const SiteContext = createContext(null);
export const useSite = () => useContext(SiteContext);

function PublicSite() {
  const site = useSite();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (!site) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  const [site, setSite] = useState(null);

  useEffect(() => {
    PublicAPI.bootstrap().then(setSite).catch(() => {
      // Fallback so the site still renders if the API is unreachable.
      setSite({ settings: {}, pages: [], services: [] });
    });
  }, []);

  return (
    <SiteContext.Provider value={site}>
      <AccountProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/login" element={<AccountLogin />} />
            <Route path="/register" element={<AccountRegister />} />
            <Route path="/portal/*" element={<Portal />} />
            <Route path="/*" element={<PublicSite />} />
          </Routes>
        </ErrorBoundary>
      </AccountProvider>
    </SiteContext.Provider>
  );
}
