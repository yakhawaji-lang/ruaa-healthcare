import { useState } from 'react';
import { MapPin, Clock, Phone, Mail, Send, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { useSite } from '../App.jsx';
import { useSettings } from '../useSettings.js';
import { PublicAPI } from '../storage/api.js';
import { isSaudiMobile, digits10, phoneError } from '../validation.js';

export default function Contact() {
  const { t, lang, pick } = useLang();
  const site = useSite();
  const { s } = useSettings();
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', body: '' });
  const [status, setStatus] = useState(null); // null | 'sending' | 'ok' | 'error'
  const [phoneErr, setPhoneErr] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPhone = (e) => { setForm((f) => ({ ...f, phone: digits10(e.target.value) })); setPhoneErr(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!isSaudiMobile(form.phone)) { setPhoneErr(phoneError(lang)); return; }
    setStatus('sending');
    try {
      await PublicAPI.sendMessage({ ...form, kind: 'appointment', lang });
      setStatus('ok');
      setForm({ name: '', phone: '', email: '', service: '', body: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="contact-page">
      <section className="page-hero">
        <div className="container">
          <h1>{t('get_in_touch')}</h1>
          <p>{t('contact_intro')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          {/* Info */}
          <div className="contact-info">
            <div className="ci-item"><span className="ci-icon"><MapPin size={20} /></span>
              <div><strong>{t('our_location')}</strong><p>{s('address')}</p></div></div>
            <div className="ci-item"><span className="ci-icon"><Clock size={20} /></span>
              <div><strong>{t('working_hours')}</strong><p>{s('hours')}</p></div></div>
            <div className="ci-item"><span className="ci-icon"><Phone size={20} /></span>
              <div><strong>{t('phone')}</strong><p><a href={`tel:${s('phone_intl')}`} dir="ltr">{s('phone')}</a></p></div></div>
            <div className="ci-item"><span className="ci-icon"><Mail size={20} /></span>
              <div><strong>{t('email')}</strong><p><a href={`mailto:${s('email')}`}>{s('email')}</a></p></div></div>
          </div>

          {/* Form */}
          <form className="contact-form" onSubmit={submit}>
            {status === 'ok' && (
              <div className="form-alert success"><CheckCircle2 size={18} /> {t('form_success')}</div>
            )}
            {status === 'error' && <div className="form-alert error">{t('form_error')}</div>}

            <div className="field">
              <label>{t('form_name')}</label>
              <input value={form.name} onChange={set('name')} required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>{t('form_phone')}</label>
                <input value={form.phone} onChange={setPhone} dir="ltr" inputMode="numeric" maxLength={10} placeholder="05XXXXXXXX" required />
                {phoneErr && <small style={{ color: '#c0392b' }}>{phoneErr}</small>}
              </div>
              <div className="field">
                <label>{t('form_email')}</label>
                <input type="email" value={form.email} onChange={set('email')} dir="ltr" />
              </div>
            </div>
            <div className="field">
              <label>{t('form_service')}</label>
              <select value={form.service} onChange={set('service')}>
                <option value="">{t('form_select_service')}</option>
                {(site?.services || []).map((sv) => (
                  <option key={sv.slug} value={pick(sv, 'title')}>{pick(sv, 'title')}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('form_message')}</label>
              <textarea rows={4} value={form.body} onChange={set('body')} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'sending'}>
              {status === 'sending' ? t('form_sending') : <>{t('form_send')} <Send size={16} /></>}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
