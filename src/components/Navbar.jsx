import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Globe, Phone, UserCircle2 } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { useSettings } from '../useSettings.js';
import { useAccount } from '../account/AccountContext.jsx';
import Logo from './Logo.jsx';

export default function Navbar() {
  const { t, lang, toggle } = useLang();
  const { s } = useSettings();
  const { user } = useAccount();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: t('nav_home'), end: true },
    { to: '/about', label: t('nav_about') },
    { to: '/services', label: t('nav_services') },
    { to: '/#partners', label: t('nav_partners'), hash: true },
    { to: '/contact', label: t('nav_contact') },
  ];

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <Logo />
          <span className="brand-name">{s('name')}</span>
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            l.hash ? (
              <a key={l.to} href={l.to} onClick={() => setOpen(false)}>{l.label}</a>
            ) : (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            )
          ))}
          <a className="nav-phone" href={`tel:${s('phone_intl')}`}>
            <Phone size={16} /> {s('phone')}
          </a>
        </nav>

        <div className="nav-actions">
          <button className="lang-btn" onClick={toggle} aria-label="language">
            <Globe size={16} /> {lang === 'ar' ? 'EN' : 'ع'}
          </button>
          <Link to={user ? '/portal' : '/login'} className="account-btn">
            <UserCircle2 size={18} /> {user ? (lang === 'ar' ? 'حسابي' : 'Account') : (lang === 'ar' ? 'دخول' : 'Login')}
          </Link>
          <button className="menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
