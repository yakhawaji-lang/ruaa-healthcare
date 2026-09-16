// Home hero slideshow. Each slide carries its own headline, subtitle, badge and
// call-to-action, so a slide can send the visitor to the page it is about.
// Crossfading images, autoplay with a visible progress bar (pauses on hover,
// focus and when the tab is hidden), arrows, dots, keyboard and swipe.
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, HeartHandshake, Home as HomeIcon } from 'lucide-react';
import { useLang } from '../i18n.jsx';

const AUTO_MS = 7000;
const reduceMotion = () => typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroSlider({ slides, cta }) {
  const { t, lang } = useLang();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  const rootRef = useRef(null);
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const n = slides.length;

  const go = useCallback((idx) => setI((idx + n) % n), [n]);
  const next = useCallback(() => setI((p) => (p + 1) % n), [n]);
  const prev = useCallback(() => setI((p) => (p - 1 + n) % n), [n]);

  // autoplay — stops while paused, while the tab is hidden, or on reduced motion
  useEffect(() => {
    if (n <= 1 || paused || reduceMotion()) return undefined;
    const id = setInterval(() => { if (!document.hidden) next(); }, AUTO_MS);
    return () => clearInterval(id);
  }, [n, paused, next]);

  // arrow keys while the slideshow has focus
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { lang === 'ar' ? next() : prev(); }
    else if (e.key === 'ArrowLeft') { lang === 'ar' ? prev() : next(); }
  };
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 45) (dx < 0 ? (lang === 'ar' ? prev : next) : (lang === 'ar' ? next : prev))();
    touch.current = null;
  };

  const features = [
    { icon: ShieldCheck, ar: 'فريق طبي معتمد', en: 'Accredited medical team' },
    { icon: HomeIcon, ar: 'الرعاية في منزلك', en: 'Care in your home' },
    { icon: HeartHandshake, ar: 'خطط رعاية فردية', en: 'Individual care plans' },
  ];

  const L = (o, base) => (lang === 'ar' ? o[`${base}_ar`] : o[`${base}_en`]) || o[`${base}_ar`] || '';
  const cur = slides[i] || {};
  // per-slide CTA, falling back to the site-wide one from Settings
  const slideCta = L(cur, 'cta_label') && cur.cta_href
    ? { label: L(cur, 'cta_label'), href: cur.cta_href }
    : (cta?.label ? { label: cta.label, href: '/contact' } : null);

  return (
    <section
      className="hero"
      ref={rootRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKey}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      <div className="container hero-inner">
        {/* Text column (re-keyed per slide for the fade-up animation) */}
        <div className="hero-text" key={i}>
          {L(cur, 'badge') && <span className="hero-badge">{L(cur, 'badge')}</span>}
          <h1>{L(cur, 'title')}</h1>
          {L(cur, 'subtitle') && <p>{L(cur, 'subtitle')}</p>}
          <div className="hero-actions">
            {slideCta && (
              <Link to={slideCta.href} className="btn btn-primary btn-lg">
                {slideCta.label} <Arrow size={18} />
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
              <span className="hero-scrim" aria-hidden="true" />
            </div>

            {n > 1 && (
              <>
                <button className="hero-nav prev" onClick={prev} aria-label={lang === 'ar' ? 'السابق' : 'Previous'}><ChevronRight size={22} /></button>
                <button className="hero-nav next" onClick={next} aria-label={lang === 'ar' ? 'التالي' : 'Next'}><ChevronLeft size={22} /></button>
              </>
            )}
          </div>

          {n > 1 && (
            <div className="hero-dots" role="tablist">
              {slides.map((sl, k) => (
                <button
                  key={sl.id ?? k}
                  className={k === i ? 'active' : ''}
                  onClick={() => go(k)}
                  role="tab"
                  aria-selected={k === i}
                  aria-label={L(sl, 'title') || `${k + 1}`}
                >
                  {k === i && !paused && <i className="hero-dot-fill" style={{ animationDuration: `${AUTO_MS}ms` }} />}
                </button>
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
