// Public landing page for remote (video / voice) consultations. The booking
// itself happens inside the patient portal, so the CTA sends visitors to
// register / sign in.
import { Link } from 'react-router-dom';
import { Video, Phone, CalendarCheck, ShieldCheck, FileText, ArrowLeft, ArrowRight, MonitorSmartphone, Stethoscope } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import { useAccount } from '../account/AccountContext.jsx';
import { useSettings } from '../useSettings.js';

const T = {
  ar: {
    title: 'الطب الاتصالي', kicker: 'استشارات طبية عن بُعد — فيديو وصوت',
    lead: 'تحدث مع طبيب رؤى من منزلك بمكالمة فيديو أو مكالمة صوتية. احجز الموعد الذي يناسبك، وادخل غرفة الاستشارة من حسابك مباشرة بدون أي تطبيقات إضافية.',
    cta: 'احجز استشارتك الآن', cta_login: 'سجّل الدخول للحجز', how: 'كيف تعمل الخدمة؟',
    steps: [
      { icon: 'calendar', t: 'احجز موعدك', d: 'اختر نوع المكالمة (فيديو أو صوت) والطبيب والوقت المتاح، أو اترك التحديد لفريقنا.' },
      { icon: 'video', t: 'ادخل غرفة الاستشارة', d: 'قبل الموعد بـ 15 دقيقة يظهر زر الدخول في حسابك، وتعمل المكالمة من المتصفح مباشرة.' },
      { icon: 'file', t: 'استلم ملخصك الطبي', d: 'بعد الاستشارة يكتب الطبيب التشخيص والتوصيات وتظهر في ملفك.' },
    ],
    why: 'لماذا الطب الاتصالي مع رؤى؟',
    feats: [
      { icon: 'shield', t: 'أطباء معتمدون', d: 'كادر طبي مرخّص ومتخصص في الرعاية المنزلية.' },
      { icon: 'phone', t: 'فيديو أو صوت', d: 'اختر ما يناسبك — مكالمة مرئية أو صوتية فقط.' },
      { icon: 'stethoscope', t: 'متابعة متكاملة', d: 'ربط الاستشارة بملفك الطبي وزياراتك المنزلية.' },
    ],
    price: 'رسوم الاستشارة', sar: 'ريال', price_note: 'تُعرض الرسوم النهائية عند تأكيد الموعد.',
  },
  en: {
    title: 'Remote Medical Consultations', kicker: 'Telemedicine',
    lead: 'Talk to a RU-MD doctor from home by video or voice call. Book the time that suits you and enter the consultation room straight from your account — no extra apps.',
    cta: 'Book your consultation', cta_login: 'Sign in to book', how: 'How it works',
    steps: [
      { icon: 'calendar', t: 'Book an appointment', d: 'Pick the call type (video or voice), the doctor and a free time — or let our team schedule it.' },
      { icon: 'video', t: 'Enter the room', d: 'The join button appears in your account 15 minutes before the start; the call runs in the browser.' },
      { icon: 'file', t: 'Get your medical summary', d: 'After the consultation the doctor writes the diagnosis and advice into your file.' },
    ],
    why: 'Why consult remotely with RU-MD?',
    feats: [
      { icon: 'shield', t: 'Licensed doctors', d: 'A licensed clinical team specialised in home care.' },
      { icon: 'phone', t: 'Video or voice', d: 'Choose what suits you — a video call or audio only.' },
      { icon: 'stethoscope', t: 'Integrated follow-up', d: 'Linked to your medical file and home visits.' },
    ],
    price: 'Consultation fee', sar: 'SAR', price_note: 'The final fee is shown when the appointment is confirmed.',
  },
};
const ICONS = { calendar: CalendarCheck, video: Video, file: FileText, shield: ShieldCheck, phone: Phone, stethoscope: Stethoscope };

export default function Telemedicine() {
  const { lang } = useLang();
  const { user } = useAccount();
  const { s } = useSettings();
  const tt = T[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const target = user ? '/portal' : '/register';

  return (
    <div className="telemed-page">
      <section className="page-hero">
        <div className="container">
          <h1>{tt.title}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container about-intro">
          <div className="about-intro-text">
            <span className="kicker">{tt.kicker}</span>
            <p>{tt.lead}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
              <Link to={target} className="btn btn-primary btn-lg">{user ? tt.cta : tt.cta_login} <Arrow size={18} /></Link>
              {!user && <Link to="/login" className="btn btn-outline btn-lg">{lang === 'ar' ? 'لديّ حساب' : 'I have an account'}</Link>}
            </div>
          </div>
          <div className="about-intro-img telemed-art">
            <div className="telemed-art-box">
              <MonitorSmartphone size={120} strokeWidth={1.2} />
              <span className="telemed-art-badge"><Video size={16} /> {lang === 'ar' ? 'فيديو' : 'Video'}</span>
              <span className="telemed-art-badge b2"><Phone size={16} /> {lang === 'ar' ? 'صوت' : 'Voice'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head"><h2>{tt.how}</h2></div>
          <div className="cards-grid grid-3">
            {tt.steps.map((st, i) => { const Icon = ICONS[st.icon]; return (
              <div key={i} className="info-card">
                <div className="info-icon"><Icon size={26} /></div>
                <h3>{i + 1}. {st.t}</h3>
                <p>{st.d}</p>
              </div>
            ); })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>{tt.why}</h2></div>
          <div className="cards-grid grid-3">
            {tt.feats.map((ft, i) => { const Icon = ICONS[ft.icon]; return (
              <div key={i} className="info-card">
                <div className="info-icon"><Icon size={26} /></div>
                <h3>{ft.t}</h3>
                <p>{ft.d}</p>
              </div>
            ); })}
          </div>
        </div>
      </section>

      <section className="cta-band" style={{ backgroundImage: `linear-gradient(120deg, rgba(11,53,86,0.92), rgba(20,92,108,0.85)), url(${s('cta_image') || '/img/cta.jpg'})` }}>
        <div className="container cta-inner">
          <div>
            <h2>{tt.title}</h2>
            <p>{tt.price_note}</p>
          </div>
          <Link to={target} className="btn btn-white btn-lg">{user ? tt.cta : tt.cta_login} <Arrow size={18} /></Link>
        </div>
      </section>
    </div>
  );
}
