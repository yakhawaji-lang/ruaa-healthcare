import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useAccount } from './AccountContext.jsx';
import { useLang } from '../i18n.jsx';
import Logo from '../components/Logo.jsx';

const T = {
  ar: {
    login_error: 'بيانات الدخول غير صحيحة أو الحساب غير مُفعّل.',
    title: 'تسجيل الدخول',
    email_or_phone: 'البريد الإلكتروني أو رقم الجوال',
    password: 'كلمة المرور',
    sign_in: 'دخول',
    no_account: 'ليس لديك حساب؟',
    register_visitor: 'سجّل كعميل',
  },
  en: {
    login_error: 'Invalid credentials or the account is not activated.',
    title: 'Sign in',
    email_or_phone: 'Email or mobile number',
    password: 'Password',
    sign_in: 'Sign in',
    no_account: "Don't have an account?",
    register_visitor: 'Register as a client',
  },
};

export default function AccountLogin() {
  const { login } = useAccount();
  const { lang } = useLang();
  const tt = T[lang];
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const data = await AccountAPI.login(email, password);
      login(data);
      nav('/portal');
    } catch {
      setError(tt.login_error);
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Logo size={54} /></div>
        <h1>{tt.title}</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>{tt.email_or_phone}</label>
            <input type="text" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          <div className="field"><label>{tt.password}</label>
            <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button className="btn btn-primary btn-lg auth-btn" disabled={busy}>
            {busy ? '...' : <><LogIn size={18} /> {tt.sign_in}</>}
          </button>
        </form>
        <div className="auth-foot">
          <span>{tt.no_account}</span>
          <Link to="/register"><UserPlus size={15} /> {tt.register_visitor}</Link>
        </div>
      </div>
    </div>
  );
}
