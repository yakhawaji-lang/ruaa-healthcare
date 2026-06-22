import { useState } from 'react';
import { LogIn, Lock } from 'lucide-react';
import { AuthAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import { LogoFull } from '../components/Logo.jsx';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    title: 'لوحة تحكم رؤى', invalid: 'بيانات الدخول غير صحيحة / Invalid credentials',
    email: 'البريد الإلكتروني / Email', password: 'كلمة المرور / Password',
    login: 'دخول', hint: 'الوصول للمصرّح لهم فقط',
  },
  en: {
    title: 'RU-MD Admin', invalid: 'Invalid credentials / بيانات الدخول غير صحيحة',
    email: 'Email / البريد الإلكتروني', password: 'Password / كلمة المرور',
    login: 'Sign in', hint: 'Authorized personnel only',
  },
};

export default function Login() {
  const { lang } = useLang();
  const tt = T[lang];
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const data = await AuthAPI.login(email, password);
      login(data);
    } catch {
      setError(tt.invalid);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo"><LogoFull height={70} /></div>
        <h1>{tt.title}</h1>
        <p className="login-sub">RU-MD Admin Dashboard</p>
        {error && <div className="login-error">{error}</div>}
        <div className="field">
          <label>{tt.email}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required autoFocus />
        </div>
        <div className="field">
          <label>{tt.password}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={busy}>
          {busy ? '...' : <><LogIn size={18} /> {tt.login}</>}
        </button>
        <p className="login-hint"><Lock size={13} /> {tt.hint}</p>
      </form>
    </div>
  );
}
