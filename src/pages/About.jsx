import { useEffect, useState } from 'react';
import { Target, Eye, Award, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { useSettings } from '../useSettings.js';
import { PublicAPI } from '../storage/api.js';

const sectionIcons = { target: Target, eye: Eye, award: Award };

export default function About() {
  const { t, lang } = useLang();
  const { s } = useSettings();
  const [about, setAbout] = useState(null);

  useEffect(() => { PublicAPI.page('about').then((r) => setAbout(r.content)).catch(() => {}); }, []);
  if (!about) return <div className="page-loader"><div className="spinner" /></div>;

  const L = (ar, en) => (lang === 'ar' ? ar : en);

  return (
    <div className="about">
      <section className="page-hero">
        <div className="container">
          <h1>{t('nav_about')}</h1>
        </div>
      </section>

      {/* Intro with image */}
      <section className="section">
        <div className="container about-intro">
          <div className="about-intro-img">
            <img src={s('about_image') || '/img/about.jpg'} alt={t('nav_about')} />
          </div>
          <div className="about-intro-text">
            <span className="kicker">{L('نبذة عنا', 'About us')}</span>
            <p>{L(about.intro_ar, about.intro_en)}</p>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Accreditation */}
      <section className="section">
        <div className="container cards-grid grid-3">
          {(about.sections || []).map((sec, i) => {
            const Icon = sectionIcons[sec.icon] || Target;
            return (
              <div key={i} className="info-card">
                <div className="info-icon"><Icon size={26} /></div>
                <h3>{L(sec.title_ar, sec.title_en)}</h3>
                <p>{L(sec.body_ar, sec.body_en)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Values */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head"><h2>{L(about.values_title_ar, about.values_title_en)}</h2></div>
          <div className="values-list">
            {(about.values || []).map((v, i) => (
              <div key={i} className="value-item">
                <CheckCircle2 size={20} className="value-check" />
                <span>{L(v.ar, v.en)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="section">
        <div className="container">
          <div className="section-head"><h2>{L(about.why_title_ar, about.why_title_en)}</h2></div>
          <div className="cards-grid grid-3">
            {(about.why || []).map((w, i) => (
              <div key={i} className="why-card">
                <span className="why-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{L(w.title_ar, w.title_en)}</h3>
                <p>{L(w.body_ar, w.body_en)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
