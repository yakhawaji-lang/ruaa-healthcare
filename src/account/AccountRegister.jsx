import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useAccount } from './AccountContext.jsx';
import { useLang } from '../i18n.jsx';
import Logo from '../components/Logo.jsx';
import { isSaudiMobile, digits10, phoneError } from '../validation.js';

const T = {
  ar: {
    pw_too_short: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    email_taken: 'البريد مسجّل مسبقًا.',
    create_failed: 'تعذّر إنشاء الحساب.',
    title: 'إنشاء حساب عميل',
    subtitle: 'سجّل لطلب خدمات رؤى ومتابعتها',
    full_name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الجوال',
    password: 'كلمة المرور',
    create_account: 'إنشاء الحساب',
    have_account: 'لديك حساب؟',
    sign_in: 'تسجيل الدخول',
  },
  en: {
    pw_too_short: 'Password must be at least 6 characters.',
    email_taken: 'This email is already registered.',
    create_failed: 'Could not create the account.',
    title: 'Create a client account',
    subtitle: 'Register to request and track RU-MD services',
    full_name: 'Full name',
    email: 'Email',
    phone: 'Mobile number',
    password: 'Password',
    create_account: 'Create account',
    have_account: 'Already have an account?',
    sign_in: 'Sign in',
  },
};

export default function AccountRegister() {
  const { login } = useAccount();
  const { lang } = useLang();
  const tt = T[lang];
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!isSaudiMobile(f.phone)) { setError(phoneError(lang)); return; }
    if (f.password.length < 6) { setError(tt.pw_too_short); return; }
    setBusy(true); setError('');
    try {
      const data = await AccountAPI.register(f);
      login(data);
      nav('/portal');
    } catch (err) {
      setError(err?.response?.data?.error === 'email_taken' ? tt.email_taken : tt.create_failed);
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Logo size={54} /></div>
        <h1>{tt.title}</h1>
        <p className="auth-sub">{tt.subtitle}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>{tt.full_name}</label>
            <input value={f.name} onChange={set('name')} required autoFocus /></div>
          <div className="field"><label>{tt.email}</label>
            <input type="email" dir="ltr" value={f.email} onChange={set('email')} required /></div>
          <div className="field"><label>{tt.phone}</label>
            <input dir="ltr" inputMode="numeric" maxLength={10} placeholder="05XXXXXXXX" value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} required /></div>
          <div className="field"><label>{tt.password}</label>
            <input type="password" dir="ltr" value={f.password} onChange={set('password')} required /></div>
          <button className="btn btn-primary btn-lg auth-btn" disabled={busy}>
            {busy ? '...' : <><UserPlus size={18} /> {tt.create_account}</>}
          </button>
        </form>
        <div className="auth-foot">
          <span>{tt.have_account}</span>
          <Link to="/login">{tt.sign_in}</Link>
        </div>
      </div>
    </div>
  );
}
