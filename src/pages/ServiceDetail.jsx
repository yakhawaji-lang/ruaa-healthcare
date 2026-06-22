import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { PublicAPI } from '../storage/api.js';
import ServiceIcon from '../components/ServiceIcon.jsx';
import { serviceImage } from '../serviceImages.js';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const [svc, setSvc] = useState(null);
  const [missing, setMissing] = useState(false);
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    setSvc(null); setMissing(false);
    PublicAPI.service(slug).then(setSvc).catch(() => setMissing(true));
  }, [slug]);

  if (missing) return <div className="container section center"><h2>{t('page_not_found')}</h2></div>;
  if (!svc) return <div className="page-loader"><div className="spinner" /></div>;

  const lines = lang === 'ar' ? svc.body_ar : svc.body_en;
  const title = lang === 'ar' ? svc.title_ar : svc.title_en;

  return (
    <div className="service-detail">
      <section className="detail-hero" style={{ backgroundImage: `linear-gradient(120deg, rgba(11,53,86,0.88), rgba(20,92,108,0.78)), url(${svc.image || serviceImage(svc.slug)})` }}>
        <div className="container detail-hero-inner">
          <div className="service-icon big light"><ServiceIcon name={svc.icon} size={38} /></div>
          <h1>{title}</h1>
          {svc.price ? (
            <div className="detail-price">
              {(lang === 'ar' ? svc.price_note_ar : svc.price_note_en) || (lang === 'ar' ? 'تبدأ من' : 'From')}
              <b>{Number(svc.price).toLocaleString('en-US')} {lang === 'ar' ? 'ريال' : 'SAR'}</b>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <div className="service-body">
            {lines.map((line, i) => {
              const bullet = line.trim().startsWith('•') || line.trim().startsWith('-');
              const clean = line.replace(/^[•\-]\s*/, '');
              if (bullet) {
                return <div key={i} className="bullet"><Check size={18} className="bullet-check" /><span>{clean}</span></div>;
              }
              const isHeading = clean.endsWith('؟') || clean.endsWith(':') || clean.length < 45;
              return <p key={i} className={isHeading ? 'svc-subhead' : ''}>{clean}</p>;
            })}
          </div>

          <div className="detail-cta">
            <Link to="/portal" className="btn btn-primary btn-lg">{t('request_service')} <Arrow size={18} /></Link>
            <Link to="/services" className="btn btn-ghost">{t('back_to_services')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
