// Doctor portal (role = doctor): today's & upcoming consultations with a
// one-click "join room", history, weekly availability and profile.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Video, Settings2, UserRound, Save, Plus, Trash2, CalendarOff } from 'lucide-react';
import { DoctorAPI } from '../storage/api.js';
import { useAccount } from '../account/AccountContext.jsx';
import { useLang } from '../i18n.jsx';
import ConsultationCard from './ConsultationCard.jsx';
import AvailabilityEditor from './AvailabilityEditor.jsx';
import DobInput from '../components/DobInput.jsx';
import { isClosed, splitAt, nowLocalStr } from './status.js';
import './telemed.css';

const T = {
  ar: {
    today: 'استشارات اليوم', upcoming: 'الاستشارات القادمة', past: 'السجل', none_today: 'لا توجد استشارات اليوم.', none_up: 'لا توجد استشارات قادمة.', none_past: 'لا يوجد سجل بعد.',
    tab_sched: 'جدولي', tab_avail: 'أوقات التوفر', tab_profile: 'ملفي', save: 'حفظ', saved: 'تم الحفظ',
    days_off: 'أيام الإجازة', add_off: 'إضافة يوم إجازة', off_note: 'ملاحظة (اختياري)', no_off: 'لا توجد أيام إجازة قادمة.',
    title_ar: 'اللقب (عربي)', title_en: 'اللقب (إنجليزي)', spec_ar: 'التخصص (عربي)', spec_en: 'التخصص (إنجليزي)', bio_ar: 'نبذة (عربي)', bio_en: 'نبذة (إنجليزي)', slot: 'مدة الاستشارة (دقيقة)',
    stats_today: 'اليوم', stats_up: 'قادمة', stats_done: 'مكتملة',
  },
  en: {
    today: "Today's consultations", upcoming: 'Upcoming consultations', past: 'History', none_today: 'No consultations today.', none_up: 'No upcoming consultations.', none_past: 'No history yet.',
    tab_sched: 'My schedule', tab_avail: 'Availability', tab_profile: 'My profile', save: 'Save', saved: 'Saved',
    days_off: 'Days off', add_off: 'Add a day off', off_note: 'Note (optional)', no_off: 'No upcoming days off.',
    title_ar: 'Title (Arabic)', title_en: 'Title (English)', spec_ar: 'Specialty (Arabic)', spec_en: 'Specialty (English)', bio_ar: 'Bio (Arabic)', bio_en: 'Bio (English)', slot: 'Consultation length (min)',
    stats_today: 'Today', stats_up: 'Upcoming', stats_done: 'Completed',
  },
};

export default function DoctorPortal() {
  const { lang } = useLang();
  const tt = T[lang];
  const nav = useNavigate();
  const [tab, setTab] = useState('sched');
  const [data, setData] = useState({ now: nowLocalStr(), items: [] });
  const load = () => DoctorAPI.consultations().then(setData).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  const today = data.now.slice(0, 10);
  const items = data.items || [];
  const todays = items.filter((c) => !isClosed(c.status) && splitAt(c.scheduled_at).date === today);
  const upcoming = items.filter((c) => !isClosed(c.status) && splitAt(c.scheduled_at).date > today);
  const past = items.filter((c) => isClosed(c.status) || (splitAt(c.scheduled_at).date < today && !isClosed(c.status))).reverse();
  const join = (c) => nav(`/portal/consultations/${c.id}/room`);

  return (
    <div className="portal-body">
      <div className="tm-stats">
        <div><b>{todays.length}</b><span>{tt.stats_today}</span></div>
        <div><b>{upcoming.length}</b><span>{tt.stats_up}</span></div>
        <div><b>{items.filter((c) => c.status === 'completed').length}</b><span>{tt.stats_done}</span></div>
      </div>
      <div className="tm-tabs">
        <button type="button" className={tab === 'sched' ? 'active' : ''} onClick={() => setTab('sched')}><CalendarDays size={16} /> {tt.tab_sched}</button>
        <button type="button" className={tab === 'avail' ? 'active' : ''} onClick={() => setTab('avail')}><Clock size={16} /> {tt.tab_avail}</button>
        <button type="button" className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><UserRound size={16} /> {tt.tab_profile}</button>
      </div>

      {tab === 'sched' && (
        <>
          <section className="portal-section">
            <h2 className="portal-h2"><Video size={20} /> {tt.today}</h2>
            {todays.length === 0 ? <div className="panel empty">{tt.none_today}</div> : <div className="tm-list">{todays.map((c) => <ConsultationCard key={c.id} c={c} audience="doctor" onJoin={join} />)}</div>}
          </section>
          <section className="portal-section">
            <h2 className="portal-h2"><CalendarDays size={20} /> {tt.upcoming}</h2>
            {upcoming.length === 0 ? <div className="panel empty">{tt.none_up}</div> : <div className="tm-list">{upcoming.map((c) => <ConsultationCard key={c.id} c={c} audience="doctor" onJoin={join} />)}</div>}
          </section>
          <section className="portal-section">
            <h2 className="portal-h2">{tt.past}</h2>
            {past.length === 0 ? <div className="panel empty">{tt.none_past}</div> : <div className="tm-list">{past.slice(0, 20).map((c) => <ConsultationCard key={c.id} c={c} audience="doctor" />)}</div>}
          </section>
        </>
      )}
      {tab === 'avail' && <AvailabilityPanel tt={tt} lang={lang} />}
      {tab === 'profile' && <ProfilePanel tt={tt} />}
    </div>
  );
}

function AvailabilityPanel({ tt, lang }) {
  const [rules, setRules] = useState(null);
  const [dates, setDates] = useState([]);
  const [off, setOff] = useState([]);
  const [newOff, setNewOff] = useState({ date: '', note: '' });
  const [saved, setSaved] = useState(false);
  const load = () => DoctorAPI.me().then((r) => { setRules(r.availability || []); setDates(r.date_availability || []); setOff(r.days_off || []); });
  useEffect(() => { load(); }, []);
  const save = async () => { await DoctorAPI.setAvailability(rules.filter((r) => r.start_time < r.end_time), dates); setSaved(true); setTimeout(() => setSaved(false), 2000); load(); };
  const addOff = async () => { if (!newOff.date) return; await DoctorAPI.addDayOff(newOff.date, newOff.note); setNewOff({ date: '', note: '' }); load(); };
  if (rules === null) return <div className="page-loader"><div className="spinner" /></div>;
  return (
    <section className="portal-section">
      <div className="panel">
        <h2 className="portal-h2"><Settings2 size={20} /> {tt.tab_avail}</h2>
        <AvailabilityEditor rules={rules} onChange={setRules} dates={dates} onChangeDates={setDates} />
        <div className="tm-actions-row">
          <button type="button" className="btn btn-primary" onClick={save}><Save size={16} /> {tt.save}</button>
          {saved && <span className="tm-saved">{tt.saved}</span>}
        </div>
      </div>
      <div className="panel" style={{ marginTop: 18 }}>
        <h2 className="portal-h2"><CalendarOff size={20} /> {tt.days_off}</h2>
        {off.length === 0 ? <p className="empty small">{tt.no_off}</p> : (
          <ul className="tm-off-list">
            {off.map((o) => (
              <li key={o.id}><b dir="ltr">{o.off_date}</b>{o.note && <span> — {o.note}</span>}
                <button type="button" className="tm-icon-btn danger" onClick={async () => { await DoctorAPI.removeDayOff(o.id); load(); }}><Trash2 size={15} /></button></li>
            ))}
          </ul>
        )}
        <div className="tm-off-add">
          <DobInput iso value={newOff.date} onChange={(v) => setNewOff((p) => ({ ...p, date: v }))} />
          <input value={newOff.note} onChange={(e) => setNewOff((p) => ({ ...p, note: e.target.value }))} placeholder={tt.off_note} />
          <button type="button" className="btn btn-outline btn-sm" onClick={addOff} disabled={!newOff.date}><Plus size={15} /> {tt.add_off}</button>
        </div>
      </div>
    </section>
  );
}

function ProfilePanel({ tt }) {
  const { user } = useAccount();
  const [p, setP] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { DoctorAPI.me().then((r) => setP(r.profile || {})); }, []);
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => { await DoctorAPI.saveProfile(p); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  if (!p) return <div className="page-loader"><div className="spinner" /></div>;
  return (
    <section className="portal-section">
      <div className="panel tm-form">
        <h2 className="portal-h2"><UserRound size={20} /> {user?.name}</h2>
        <div className="field-row">
          <div className="field"><label>{tt.title_ar}</label><input value={p.title_ar || ''} onChange={set('title_ar')} placeholder="استشاري / أخصائي" /></div>
          <div className="field"><label>{tt.title_en}</label><input dir="ltr" value={p.title_en || ''} onChange={set('title_en')} placeholder="Consultant / Specialist" /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>{tt.spec_ar}</label><input value={p.specialty_ar || ''} onChange={set('specialty_ar')} /></div>
          <div className="field"><label>{tt.spec_en}</label><input dir="ltr" value={p.specialty_en || ''} onChange={set('specialty_en')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>{tt.bio_ar}</label><textarea rows={3} value={p.bio_ar || ''} onChange={set('bio_ar')} /></div>
          <div className="field"><label>{tt.bio_en}</label><textarea rows={3} dir="ltr" value={p.bio_en || ''} onChange={set('bio_en')} /></div>
        </div>
        <div className="field" style={{ maxWidth: 220 }}><label>{tt.slot}</label><input type="number" min={5} step={5} dir="ltr" value={p.slot_minutes || 20} onChange={set('slot_minutes')} /></div>
        <div className="tm-actions-row">
          <button type="button" className="btn btn-primary" onClick={save}><Save size={16} /> {tt.save}</button>
          {saved && <span className="tm-saved">{tt.saved}</span>}
        </div>
      </div>
    </section>
  );
}
