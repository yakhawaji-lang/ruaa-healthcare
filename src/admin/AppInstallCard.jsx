import { useEffect, useState } from 'react';
import { Smartphone, Download, BellRing, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { getPushStatus, enablePush, disablePush } from '../notifications/push.js';

const T = {
  ar: {
    title: 'تطبيق رؤى للجوال',
    subtitle: 'ثبّت لوحة التحكم كتطبيق على جوالك واستقبل كل إشعارات النظام فورًا — حتى عند إغلاق التطبيق.',
    install: 'تثبيت التطبيق', installed: 'التطبيق مثبّت',
    install_hint: 'لتثبيت التطبيق يدويًا: افتح قائمة المتصفح (⋮) ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',
    enable_notifs: 'تفعيل إشعارات الجوال',
    notifs_on: 'الإشعارات مفعّلة', notifs_denied: 'الإشعارات محظورة', working: 'جارٍ...',
  },
  en: {
    title: 'RU-MD mobile app',
    subtitle: 'Install the dashboard as an app on your phone and receive all system notifications instantly — even when the app is closed.',
    install: 'Install app', installed: 'App installed',
    install_hint: 'To install manually: open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.',
    enable_notifs: 'Enable phone notifications',
    notifs_on: 'Notifications on', notifs_denied: 'Notifications blocked', working: 'Working...',
  },
};

export default function AppInstallCard() {
  const { lang } = useLang();
  const tt = T[lang];
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pushState, setPushState] = useState('off');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setInstalled(!!standalone);
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    getPushStatus().then(setPushState);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch { /* ignore */ }
      setDeferred(null);
    } else {
      setShowHint(true); // browser didn't offer the auto prompt → show manual steps
    }
  };

  const togglePush = async () => {
    setBusy(true);
    try { setPushState(pushState === 'on' ? await disablePush() : await enablePush()); }
    catch (e) { setPushState(e.message === 'denied' ? 'denied' : await getPushStatus()); }
    finally { setBusy(false); }
  };

  return (
    <div className="app-card">
      <div className="app-card-icon"><Smartphone size={26} /></div>
      <div className="app-card-main">
        <h3>{tt.title}</h3>
        <p>{tt.subtitle}</p>
        <div className="app-card-actions">
          {installed ? (
            <span className="app-installed"><CheckCircle2 size={16} /> {tt.installed}</span>
          ) : (
            <button type="button" className="btn btn-white btn-sm" onClick={install}><Download size={16} /> {tt.install}</button>
          )}
          {pushState !== 'unsupported' && (
            <button type="button" className={`btn btn-sm ${pushState === 'on' ? 'btn-ghost' : 'btn-outline'}`} onClick={togglePush} disabled={busy}>
              <BellRing size={16} /> {busy ? tt.working : pushState === 'on' ? tt.notifs_on : pushState === 'denied' ? tt.notifs_denied : tt.enable_notifs}
            </button>
          )}
        </div>
        {!installed && showHint && <p className="app-hint">{tt.install_hint}</p>}
      </div>
    </div>
  );
}
