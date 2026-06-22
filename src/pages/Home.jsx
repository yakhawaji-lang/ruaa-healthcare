import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { useSite } from '../App.jsx';
import { useSettings } from '../useSettings.js';
import { PublicAPI } from '../storage/api.js';
import ServiceIcon from '../components/ServiceIcon.jsx';
import HeroSlider from '../components/HeroSlider.jsx';
import { serviceImage } from '../serviceImages.js';

export default function Home() {
  const { t, lang, pick } = useLang();
  const site = useSite();
  const { s } = useSettings();
  const [home, setHome] = useState(null);
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => { PublicAPI.page('home').then((r) => setHome(r.content)).catch(() => {}); }, []);

  const h = home || {};
  const services = (site?.services || []).slice(0, 6);

  // Hero slides come from the admin-managed slider; fall back to the page content.
  const heroSlides = (site?.heroSlides && site.heroSlides.length)
    ? site.heroSlides
    : [{
        id: 'default',
        image: s('hero_image') || '/img/hero.jpg',
        title_ar: h.hero_title_ar, title_en: h.hero_title_en,
        subtitle_ar: h.hero_sub_ar, subtitle_en: h.hero_sub_en,
        badge_ar: h.hero_badge_ar, badge_en: h.hero_badge_en,
      }];
  const ctaLabel = (lang === 'ar' ? h.cta_ar : h.cta_en) || '';

  return (
    <div className="home">
      <HeroSlider slides={heroSlides} cta={ctaLabel ? { label: ctaLabel } : null} />

      {/* Intro */}
      <section className="section intro">
        <div className="container">
          <p className="intro-lead">{lang === 'ar' ? h.intro_ar : h.intro_en}</p>
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t('our_services')}</h2>
            <p>{t('services_sub')}</p>
          </div>
          <div className="cards-grid">
            {services.map((sv) => (
              <Link key={sv.slug} to={`/services/${sv.slug}`} className="service-card has-img">
                <div className="service-card-img">
                  <img src={sv.image || serviceImage(sv.slug)} alt={pick(sv, 'title')} loading="lazy" />
                  <span className="service-icon overlay"><ServiceIcon name={sv.icon} size={22} /></span>
                </div>
                <div className="service-card-body">
                  <h3>{pick(sv, 'title')}</h3>
                  <p>{(lang === 'ar' ? sv.body_ar : sv.body_en)?.[0]?.slice(0, 100)}…</p>
                  <span className="card-link">{t('learn_more')} <Arrow size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
          <div className="center">
            <Link to="/services" className="btn btn-outline">{t('nav_services')} <Arrow size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Partners (insurance companies) */}
      {(site?.partners || []).length > 0 && (
        <section className="section partners-section" id="partners">
          <div className="container">
            <div className="section-head">
              <h2>{t('our_partners')}</h2>
              <p>{t('partners_sub')}</p>
            </div>
            <div className="partners-grid">
              {site.partners.map((p) => {
                const name = pick(p, 'name');
                const img = <img src={p.logo} alt={name || 'partner'} loading="lazy" />;
                return (
                  <div key={p.id} className="partner-logo" title={name || ''}>
                    {p.url ? <a href={p.url} target="_blank" rel="noreferrer">{img}</a> : img}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="cta-band" style={{ backgroundImage: `linear-gradient(120deg, rgba(11,53,86,0.92), rgba(20,92,108,0.85)), url(${s('cta_image') || '/img/cta.jpg'})` }}>
        <div className="container cta-inner">
          <div>
            <h2>{t('home_intro_title')}</h2>
            <p>{s('tagline')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
