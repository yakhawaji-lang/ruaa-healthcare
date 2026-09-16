// Patient portal block: CTA to book a remote consultation + the patient's
// consultations (upcoming first). Rendered inside VisitorPortal.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, MonitorSmartphone } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useAccount } from '../account/AccountContext.jsx';
import { useSettings } from '../useSettings.js';
import { useLang } from '../i18n.jsx';
import BookConsultationModal from './BookConsultationModal.jsx';
import ConsultationCard from './ConsultationCard.jsx';
import { isClosed } from './status.js';
import './telemed.css';

const T = {
  ar: {
    title: 'الاستشارات الطبية عن بُعد', intro: 'تحدث مع طبيب رؤى بالفيديو أو بمكالمة صوتية من منزلك — احجز موعدًا يناسبك أو دع فريقنا يحدده لك.',
    book: 'حجز استشارة', my: 'استشاراتي', upcoming: 'القادمة', past: 'السابقة', none: 'لا توجد استشارات بعد. احجز أول استشارة عن بُعد.',
    f1: 'فيديو أو صوت', f2: 'أطباء معتمدون', f3: 'ملخص طبي بعد الاستشارة',
  },
  en: {
    title: 'Remote medical consultations', intro: 'Talk to a RU-MD doctor by video or voice call from home — pick a time that suits you or let our team schedule it.',
    book: 'Book a consultation', my: 'My consultations', upcoming: 'Upcoming', past: 'Past', none: 'No consultations yet. Book your first remote consultation.',
    f1: 'Video or voice', f2: 'Licensed doctors', f3: 'Medical summary after the call',
  },
};

export default function TelemedSection() {
  const { lang } = useLang();
  const tt = T[lang];
  const { user } = useAccount();
  const { s } = useSettings();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [booking, setBooking] = useState(false);
  const enabled = (s('telemed_enabled') || '1') !== '0';

  const load = () => AccountAPI.myConsultations().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!enabled) return null;

  const open = items.filter((c) => !isClosed(c.status));
  const past = items.filter((c) => isClosed(c.status));

  return (
    <section className="portal-section tm-section">
      <div className="tm-hero">
        <div className="tm-hero-text">
          <h2 className="portal-h2"><Video size={20} /> {tt.title}</h2>
          <p>{tt.intro}</p>
          <ul className="tm-feats">
            <li>{tt.f1}</li><li>{tt.f2}</li><li>{tt.f3}</li>
          </ul>
        </div>
        <div className="tm-hero-cta">
          <MonitorSmartphone size={44} className="tm-hero-icon" />
          <button type="button" className="btn btn-primary" onClick={() => setBooking(true)}><Plus size={18} /> {tt.book}</button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="tm-lists">
          {open.length > 0 && (
            <>
              <h3 className="tm-h3">{tt.upcoming}</h3>
              <div className="tm-list">{open.map((c) => <ConsultationCard key={c.id} c={c} audience="patient" onJoin={(x) => nav(`/portal/consultations/${x.id}/room`)} />)}</div>
            </>
          )}
          {past.length > 0 && (
            <>
              <h3 className="tm-h3">{tt.past}</h3>
              <div className="tm-list">{past.slice(0, 6).map((c) => <ConsultationCard key={c.id} c={c} audience="patient" />)}</div>
            </>
          )}
        </div>
      )}
      {items.length === 0 && <div className="panel empty tm-empty">{tt.none}</div>}

      {booking && <BookConsultationModal user={user} onClose={() => setBooking(false)} onDone={() => { setBooking(false); load(); }} />}
    </section>
  );
}
