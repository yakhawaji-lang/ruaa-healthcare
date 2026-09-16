// Embedded Jitsi Meet room (video or voice) used by patients, doctors and admins.
// `fetchJoin` asks the API for the join credentials (domain / room / jwt); the
// server decides who may enter and when. Works with meet.jit.si, a self-hosted
// Jitsi, or 8x8 JaaS (signed token — no manual moderator login).
import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Video, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { modeLabel } from './status.js';
import './telemed.css';

const T = {
  ar: {
    connecting: 'جارٍ تجهيز غرفة الاستشارة...', leave: 'إنهاء المكالمة', not_yet: 'لم يحن وقت الاستشارة بعد.',
    too_early: (m) => `يمكنك الدخول قبل الموعد بـ 15 دقيقة (متبقٍ ${m} دقيقة).`,
    expired: 'انتهت صلاحية رابط هذه الاستشارة.', not_scheduled: 'لم يُحدَّد موعد لهذه الاستشارة بعد.',
    failed: 'تعذّر فتح غرفة الاستشارة. تأكد من اتصالك بالإنترنت وحاول مجددًا.', retry: 'إعادة المحاولة',
    script_failed: 'تعذّر تحميل مشغّل المكالمات (Jitsi). تحقق من الاتصال أو من إعداد النطاق في لوحة التحكم.',
    tip: 'اسمح للمتصفح باستخدام الكاميرا والميكروفون عند الطلب.',
    moderator_hint: 'إذا ظهرت رسالة "بانتظار المشرف" فهذا لأن خادم meet.jit.si العام يتطلب تسجيل دخول الطبيب كمشرف. الحل النهائي: تفعيل 8x8 JaaS أو خادم Jitsi خاص من إعدادات الخادم.',
  },
  en: {
    connecting: 'Preparing the consultation room...', leave: 'End call', not_yet: 'The consultation has not started yet.',
    too_early: (m) => `You can join 15 minutes before the appointment (${m} minutes left).`,
    expired: 'This consultation link has expired.', not_scheduled: 'This consultation has not been scheduled yet.',
    failed: 'Could not open the consultation room. Check your connection and try again.', retry: 'Retry',
    script_failed: 'Could not load the call engine (Jitsi). Check the connection or the domain setting in the admin panel.',
    tip: 'Allow the browser to use your camera and microphone when asked.',
    moderator_hint: 'If you see "waiting for the moderator", the public meet.jit.si server requires the doctor to sign in as moderator. The permanent fix is enabling 8x8 JaaS or a private Jitsi server in the server settings.',
  },
};

// Load /external_api.js once per domain.
const loaded = {};
function loadJitsiScript(src) {
  if (window.JitsiMeetExternalAPI && loaded[src]) return Promise.resolve();
  if (loaded[src]) return loaded[src];
  loaded[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { delete loaded[src]; reject(new Error('script')); };
    document.head.appendChild(s);
  });
  return loaded[src];
}

export default function VideoRoom({ fetchJoin, onLeave, subtitle, badge }) {
  const { lang } = useLang();
  const tt = T[lang];
  const boxRef = useRef(null);
  const apiRef = useRef(null);
  const [state, setState] = useState({ phase: 'loading', info: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading', info: null, error: '' });
    (async () => {
      let info;
      try { info = await fetchJoin(); }
      catch (e) {
        const code = e?.response?.data?.error;
        const m = e?.response?.data?.minutes;
        const msg = code === 'too_early' ? tt.too_early(m) : code === 'expired' ? tt.expired : code === 'not_scheduled' ? tt.not_scheduled : tt.failed;
        if (!cancelled) setState({ phase: 'blocked', info: null, error: msg });
        return;
      }
      const scriptSrc = info.provider === 'jaas'
        ? `https://8x8.vc/${info.room.split('/')[0]}/external_api.js`
        : `https://${info.domain}/external_api.js`;
      try { await loadJitsiScript(scriptSrc); }
      catch { if (!cancelled) setState({ phase: 'blocked', info, error: tt.script_failed }); return; }
      if (cancelled || !boxRef.current) return;
      const audioOnly = info.mode === 'audio';
      try {
        apiRef.current = new window.JitsiMeetExternalAPI(info.domain, {
          roomName: info.room,
          parentNode: boxRef.current,
          jwt: info.jwt || undefined,
          lang: lang === 'ar' ? 'ar' : 'en',
          userInfo: { displayName: info.displayName },
          configOverwrite: {
            subject: info.subject,
            prejoinConfig: { enabled: false },
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: audioOnly,
            startAudioOnly: audioOnly,
            disableDeepLinking: true,
            disableInviteFunctions: true,
            enableWelcomePage: false,
            enableClosePage: false,
            defaultLanguage: lang === 'ar' ? 'ar' : 'en',
            toolbarButtons: [
              'microphone', 'camera', 'hangup', 'chat', 'tileview', 'fullscreen', 'settings', 'select-background', 'desktop', 'raisehand',
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false, SHOW_BRAND_WATERMARK: false,
            DEFAULT_REMOTE_DISPLAY_NAME: lang === 'ar' ? 'مشارك' : 'Participant',
            MOBILE_APP_PROMO: false, HIDE_INVITE_MORE_HEADER: true, DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          },
        });
        const api = apiRef.current;
        api.addListener('videoConferenceJoined', () => setState((s) => ({ ...s, phase: 'live' })));
        api.addListener('readyToClose', () => onLeave && onLeave());
        api.addListener('videoConferenceLeft', () => onLeave && onLeave());
        setState({ phase: 'ready', info, error: '' });
      } catch {
        setState({ phase: 'blocked', info, error: tt.failed });
      }
    })();
    return () => {
      cancelled = true;
      try { apiRef.current?.dispose(); } catch { /* ignore */ }
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // simple call timer once live
  useEffect(() => {
    if (state.phase !== 'live') return undefined;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  const hangup = () => {
    try { apiRef.current?.executeCommand('hangup'); } catch { /* ignore */ }
    setTimeout(() => onLeave && onLeave(), 300);
  };
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const Icon = state.info?.mode === 'audio' ? Phone : Video;

  return (
    <div className="tm-room">
      <div className="tm-room-head">
        <div className="tm-room-title">
          <Icon size={18} />
          <div>
            <strong>{state.info?.subject || 'RU-MD'}</strong>
            <small>{subtitle}{state.info ? ` · ${modeLabel(state.info.mode, lang)}` : ''}</small>
          </div>
          {badge}
        </div>
        <div className="tm-room-actions">
          {state.phase === 'live' && <span className="tm-timer" dir="ltr">{mm}:{ss}</span>}
          <button type="button" className="btn tm-hangup" onClick={hangup}><PhoneOff size={16} /> {tt.leave}</button>
        </div>
      </div>

      <div className="tm-room-stage">
        {state.phase === 'loading' && (
          <div className="tm-room-overlay"><Loader2 className="tm-spin" size={34} /><p>{tt.connecting}</p><small>{tt.tip}</small></div>
        )}
        {state.phase === 'blocked' && (
          <div className="tm-room-overlay">
            <AlertTriangle size={36} className="tm-warn" />
            <p>{state.error}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAttempt((a) => a + 1)}>{tt.retry}</button>
          </div>
        )}
        <div ref={boxRef} className="tm-jitsi" />
      </div>
      {state.info?.provider === 'jitsi' && state.info?.domain === 'meet.jit.si' && (
        <p className="tm-room-hint">{tt.moderator_hint}</p>
      )}
    </div>
  );
}
