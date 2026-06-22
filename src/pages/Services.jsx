import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { useSite } from '../App.jsx';
import ServiceIcon from '../components/ServiceIcon.jsx';
import { serviceImage } from '../serviceImages.js';

export default function Services() {
  const { t, lang, pick } = useLang();
  const site = useSite();
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const services = site?.services || [];

  return (
    <div className="services-page">
      <section className="page-hero">
        <div className="container">
          <h1>{t('our_services')}</h1>
          <p>{t('services_sub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cards-grid">
            {services.map((sv) => {
              const body = lang === 'ar' ? sv.body_ar : sv.body_en;
              return (
                <Link key={sv.slug} to={`/services/${sv.slug}`} className="service-card has-img">
                  <div className="service-card-img">
                    <img src={sv.image || serviceImage(sv.slug)} alt={pick(sv, 'title')} loading="lazy" />
                    <span className="service-icon overlay"><ServiceIcon name={sv.icon} size={22} /></span>
                  </div>
                  <div className="service-card-body">
                    <h3>{pick(sv, 'title')}</h3>
                    <p>{body?.[0]?.slice(0, 120)}…</p>
                    <span className="card-link">{t('learn_more')} <Arrow size={15} /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
