import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, HeartHandshake, Home as HomeIcon } from 'lucide-react';
import { useLang } from '../i18n.jsx';

const AUTO_MS = 6000;

// Professional hero slideshow: crossfading images + animated promo text,
// autoplay (pauses on hover), arrows and dots. Driven by admin-managed slides.
export default function HeroSlider({ slides, cta }) {
  const { t, lang } = useLang();
  const [i, setI] = useState(0);
  const timer = useRef(null);
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const n = slides.length;

  const go = useCallback((idx) => setI((idx + n) % n), [n]);
  const next = useCallback(() => setI((p) => (p + 1) % n), [n]);
  const prev = useCallback(() => setI((p) => (p - 1 + n) % n), [n]);

  useEffect(() => {
    if (n <= 1) return;
    timer.current = setInterval(next, AUTO_MS);
    return () => clearInterval(timer.current);
  }, [n, next]);

  const pause = () => clearInterval(timer.current);
  const resume = () => { if (n > 1) timer.current = setInterval(next, AUTO_MS); };

  const features = [
    { icon: ShieldCheck, ar: 'فريق طبي معتمد', en: 'Accredited medical team' },
    { icon: HomeIcon, ar: 'الرعاية في منزلك', en: 'Care in your home' },
    { icon: HeartHandshake, ar: 'خطط رعاية فردية', en: 'Individual care plans' },
  ];

  const L = (o, base) => (lang === 'ar' ? o[`${base}_ar`] : o[`${base}_en`]) || o[`${base}_ar`] || '';
  const cur = slides[i] || {};

  return (
    <section className="hero" onMouseEnter={pause} onMouseLeave={resume}>
      <div className="container hero-inner">
        {/* Text column (re-keyed per slide for fade-up animation) */}
        <div className="hero-text" key={i}>
          {L(cur, 'badge') && <span className="hero-badge">{L(cur, 'badge')}</span>}
          <h1>{L(cur, 'title')}</h1>
          {L(cur, 'subtitle') && <p>{L(cur, 'subtitle')}</p>}
          <div className="hero-actions">
            {cta?.label && (
              <Link to="/contact" className="btn btn-primary btn-lg">
                {cta.label} <Arrow size={18} />
              </Link>
            )}
            <Link to="/services" className="btn btn-ghost btn-lg">{t('nav_services')}</Link>
          </div>
          <div className="hero-features">
            {features.map((f, k) => (
              <div key={k} className="hero-feature"><f.icon size={18} /> {lang === 'ar' ? f.ar : f.en}</div>
            ))}
          </div>
        </div>

        {/* Image column with crossfade stack */}
        <div className="hero-art">
          <div className="hero-image-wrap">
            <div className="hero-slides">
              {slides.map((sl, k) => (
                <img
                  key={sl.id ?? k}
                  src={sl.image || '/img/hero.jpg'}
                  alt={L(sl, 'title')}
                  className={`hero-image ${k === i ? 'active' : ''}`}
                  loading={k === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>

            {n > 1 && (
              <>
                <button className="hero-nav prev" onClick={prev} aria-label="السابق"><ChevronRight size={22} /></button>
                <button className="hero-nav next" onClick={next} aria-label="التالي"><ChevronLeft size={22} /></button>
              </>
            )}
          </div>

          {n > 1 && (
            <div className="hero-dots">
              {slides.map((_, k) => (
                <button key={k} className={k === i ? 'active' : ''} onClick={() => go(k)} aria-label={`شريحة ${k + 1}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* curved divider separating the hero from the section below */}
      <div className="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none">
          <path d="M0,70 C240,110 480,20 720,40 C960,60 1200,120 1440,60 L1440,110 L0,110 Z" />
        </svg>
      </div>
    </section>
  );
}
