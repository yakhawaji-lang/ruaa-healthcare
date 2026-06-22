import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, Instagram, Twitter } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { useSettings } from '../useSettings.js';
import Logo from './Logo.jsx';

export default function Footer() {
  const { t } = useLang();
  const { s } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <Logo size={44} />
            <span className="brand-name">{s('name')}</span>
          </div>
          <p className="footer-about">{t('footer_about')}</p>
          <div className="socials">
            {s('instagram') && <a href={s('instagram')} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>}
            {s('twitter') && <a href={s('twitter')} target="_blank" rel="noreferrer" aria-label="Twitter"><Twitter size={18} /></a>}
          </div>
        </div>

        <div>
          <h4>{t('quick_links')}</h4>
          <ul className="footer-links">
            <li><Link to="/">{t('nav_home')}</Link></li>
            <li><Link to="/about">{t('nav_about')}</Link></li>
            <li><Link to="/services">{t('nav_services')}</Link></li>
            <li><Link to="/contact">{t('nav_contact')}</Link></li>
          </ul>
        </div>

        <div>
          <h4>{t('get_in_touch')}</h4>
          <ul className="footer-contact">
            <li><MapPin size={16} /> <span>{s('address')}</span></li>
            <li><Clock size={16} /> <span>{s('hours')}</span></li>
            <li><Phone size={16} /> <a href={`tel:${s('phone_intl')}`} dir="ltr">{s('phone')}</a></li>
            <li><Mail size={16} /> <a href={`mailto:${s('email')}`}>{s('email')}</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          © {year} {s('name')} — {t('all_rights')}
        </div>
      </div>
    </footer>
  );
}
