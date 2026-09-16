// Patient self-booking wizard: mode (video / voice) → doctor → day → time slot
// → complaint. The patient may also skip the slot and let the admin schedule.
import { useEffect, useState } from 'react';
import { X, Video, Phone, CheckCircle2, ChevronRight, ChevronLeft, CalendarDays, Clock, UserRound, Stethoscope } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import { isSaudiMobile, digits10, phoneInputProps } from '../validation.js';
import { doctorName, doctorSpecialty, fmtTime12, WEEKDAYS_SHORT } from './status.js';

const T = {
  ar: {
    title: 'حجز استشارة عن بُعد', step_mode: 'نوع الاستشارة', step_doctor: 'الممارس الصحي', step_time: 'الموعد', step_details: 'التفاصيل',
    video: 'مكالمة فيديو', video_sub: 'صوت وصورة عبر الكاميرا', audio: 'مكالمة صوتية', audio_sub: 'صوت فقط بدون كاميرا',
    any_doctor: 'أي ممارس متاح', any_doctor_sub: 'تختار الإدارة الممارس المناسب والموعد وتُبلغك',
    pick_day: 'اختر اليوم', pick_time: 'اختر الوقت', no_days: 'لا توجد مواعيد متاحة خلال الأسابيع القادمة لهذا الممارس. اختر ممارسًا آخر أو اترك الجدولة للإدارة.',
    no_slots: 'لا توجد أوقات متاحة في هذا اليوم.', let_admin: 'دع الإدارة تحدد الموعد', preferred: 'الوقت المفضّل لديك (اختياري)', preferred_ph: 'مثال: مساءً بعد الساعة 6',
    complaint: 'سبب الاستشارة / الأعراض', complaint_ph: 'اكتب باختصار ما تعاني منه ومنذ متى...', patient_name: 'اسم المريض', phone: 'رقم الجوال',
    phone_invalid: 'رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05.', need_complaint: 'اكتب سبب الاستشارة.',
    next: 'التالي', back: 'رجوع', confirm: 'تأكيد الحجز', sending: 'جارٍ الحجز...', cancel: 'إلغاء',
    summary: 'ملخص الحجز', doctor: 'الممارس', when: 'الموعد', mode: 'النوع', tbd: 'تحدده الإدارة', price: 'الرسوم', sar: 'ريال', free_note: 'تُحدَّد الرسوم عند التأكيد',
    done_title: 'تم الحجز بنجاح', done_scheduled: 'موعدك مؤكد. ستصلك تنبيهات قبل الموعد، ويظهر زر الدخول للغرفة قبل الموعد بـ 15 دقيقة.',
    done_pending: 'تم استلام طلبك. ستحدد الإدارة الطبيب والموعد وتُبلغك بإشعار.', done_unconfirmed: 'تم حجز الموعد وحُفظ لك مؤقتًا. ستراجعه الإدارة وتؤكده قريبًا، وسيصلك إشعار بالتأكيد.', ref: 'رقم المرجع:', view: 'عرض استشاراتي',
    slot_taken: 'عذرًا، تم حجز هذا الوقت للتو. اختر وقتًا آخر.', failed: 'تعذّر إتمام الحجز، حاول مجددًا.', min: 'دقيقة',
  },
  en: {
    title: 'Book a remote consultation', step_mode: 'Type', step_doctor: 'Provider', step_time: 'Time', step_details: 'Details',
    video: 'Video call', video_sub: 'Audio and camera', audio: 'Voice call', audio_sub: 'Audio only, no camera',
    any_doctor: 'Any available provider', any_doctor_sub: 'The team picks the provider and time and notifies you',
    pick_day: 'Choose a day', pick_time: 'Choose a time', no_days: 'No available slots in the coming weeks for this provider. Pick another one or let the team schedule.',
    no_slots: 'No free times on this day.', let_admin: 'Let the team pick the time', preferred: 'Your preferred time (optional)', preferred_ph: 'e.g. evenings after 6 PM',
    complaint: 'Reason for the consultation / symptoms', complaint_ph: 'Briefly describe what you are experiencing and since when...', patient_name: 'Patient name', phone: 'Mobile number',
    phone_invalid: 'Mobile number must be 10 digits starting with 05.', need_complaint: 'Please describe the reason for the consultation.',
    next: 'Next', back: 'Back', confirm: 'Confirm booking', sending: 'Booking...', cancel: 'Cancel',
    summary: 'Booking summary', doctor: 'Provider', when: 'Appointment', mode: 'Type', tbd: 'Set by the team', price: 'Fee', sar: 'SAR', free_note: 'Fee confirmed on scheduling',
    done_title: 'Booked successfully', done_scheduled: 'Your appointment is confirmed. You will be reminded, and the join button appears 15 minutes before the start.',
    done_pending: 'Your request was received. The team will assign a doctor and time and notify you.', done_unconfirmed: 'Your slot is booked and held for you. The team will review and confirm it shortly; you will be notified.', ref: 'Reference:', view: 'View my consultations',
    slot_taken: 'Sorry, that time was just booked. Please choose another.', failed: 'Could not complete the booking, please try again.', min: 'min',
  },
};

const dayLabel = (iso, lang) => {
  const d = new Date(`${iso}T12:00:00`);
  return { wd: WEEKDAYS_SHORT[lang][d.getDay()], dm: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) };
};

export default function BookConsultationModal({ user, onClose, onDone }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('video');
  const [info, setInfo] = useState({ doctors: [], price: null });
  const [doctor, setDoctor] = useState(undefined); // undefined = not chosen, null = any
  const [days, setDays] = useState(null);
  const [day, setDay] = useState('');
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState('');
  const [letAdmin, setLetAdmin] = useState(false);
  const [f, setF] = useState({ complaint: '', patient_name: user?.name || '', phone: user?.phone || '', preferred_note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => { AccountAPI.telemedDoctors().then(setInfo).catch(() => {}); }, []);
  useEffect(() => {
    if (!doctor) { setDays(null); return; }
    setDays(null); setDay(''); setSlots(null); setSlot('');
    AccountAPI.telemedDays(doctor.id).then(setDays).catch(() => setDays([]));
  }, [doctor]);
  useEffect(() => {
    if (!doctor || !day) return;
    setSlots(null); setSlot('');
    AccountAPI.telemedSlots(doctor.id, day).then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [doctor, day]);

  const steps = [tt.step_mode, tt.step_doctor, tt.step_time, tt.step_details];
  const canNext = step === 0 ? true : step === 1 ? doctor !== undefined : step === 2 ? (doctor === null || letAdmin || !!slot) : true;
  const next = () => {
    if (step === 1 && doctor === null) { setLetAdmin(true); setStep(3); return; }
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => {
    if (step === 3 && doctor === null) { setStep(1); return; }
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    if (!f.complaint.trim()) { setError(tt.need_complaint); return; }
    if (!isSaudiMobile(f.phone)) { setError(tt.phone_invalid); return; }
    setBusy(true); setError('');
    try {
      const r = await AccountAPI.bookConsultation({
        mode, doctor_user_id: doctor?.id || null,
        scheduled_at: doctor && slot && !letAdmin ? `${day} ${slot}` : null,
        complaint: f.complaint, patient_name: f.patient_name, phone: f.phone, preferred_note: f.preferred_note || null,
      });
      setDone(r);
    } catch (e) {
      const code = e?.response?.data?.error;
      setError(code === 'slot_taken' || code === 'slot_unavailable' ? tt.slot_taken : tt.failed);
      if (code === 'slot_taken' || code === 'slot_unavailable') { setStep(2); setSlot(''); AccountAPI.telemedSlots(doctor.id, day).then((r) => setSlots(r.slots)).catch(() => {}); }
    } finally { setBusy(false); }
  };

  const Back = lang === 'ar' ? ChevronRight : ChevronLeft;
  const Fwd = lang === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal portal-modal tm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.title}</h2><button onClick={onClose}><X size={20} /></button></div>

        {done ? (
          <div className="modal-body success-box">
            <CheckCircle2 size={48} className="success-icon" />
            <h3>{tt.done_title}</h3>
            <p>{tt.ref} <b dir="ltr">{done.ref}</b></p>
            <p className="muted">{done.status === 'scheduled' ? tt.done_scheduled : done.status === 'unconfirmed' ? tt.done_unconfirmed : tt.done_pending}</p>
            <button className="btn btn-primary" onClick={onDone}>{tt.view}</button>
          </div>
        ) : (
          <>
            <div className="tm-steps">
              {steps.map((s, i) => (
                <div key={s} className={`tm-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                  <span className="tm-step-n">{i + 1}</span><span>{s}</span>
                </div>
              ))}
            </div>

            <div className="modal-body">
              {error && <div className="form-alert error">{error}</div>}

              {step === 0 && (
                <div className="tm-choice-grid">
                  <button type="button" className={`tm-choice ${mode === 'video' ? 'sel' : ''}`} onClick={() => setMode('video')}>
                    <Video size={28} /><strong>{tt.video}</strong><small>{tt.video_sub}</small>
                  </button>
                  <button type="button" className={`tm-choice ${mode === 'audio' ? 'sel' : ''}`} onClick={() => setMode('audio')}>
                    <Phone size={28} /><strong>{tt.audio}</strong><small>{tt.audio_sub}</small>
                  </button>
                </div>
              )}

              {step === 1 && (
                <div className="tm-doctor-list">
                  <button type="button" className={`tm-doctor ${doctor === null ? 'sel' : ''}`} onClick={() => setDoctor(null)}>
                    <span className="tm-avatar"><Stethoscope size={22} /></span>
                    <span className="tm-doctor-body"><strong>{tt.any_doctor}</strong><small>{tt.any_doctor_sub}</small></span>
                  </button>
                  {info.doctors.map((d) => (
                    <button key={d.id} type="button" className={`tm-doctor ${doctor?.id === d.id ? 'sel' : ''}`} onClick={() => setDoctor(d)}>
                      <span className="tm-avatar">{d.photo ? <img src={d.photo} alt="" /> : <UserRound size={22} />}</span>
                      <span className="tm-doctor-body">
                        <strong>{doctorName(d, lang)}</strong>
                        <small>{doctorSpecialty(d, lang)}{d.slot_minutes ? ` · ${d.slot_minutes} ${tt.min}` : ''}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && doctor && (
                <div>
                  <label className="tm-label"><CalendarDays size={16} /> {tt.pick_day}</label>
                  {days === null ? <div className="spinner tm-spinner" /> : days.length === 0 ? (
                    <p className="empty small">{tt.no_days}</p>
                  ) : (
                    <div className="tm-days">
                      {days.map((d) => { const l = dayLabel(d.date, lang); return (
                        <button key={d.date} type="button" className={`tm-day ${day === d.date ? 'sel' : ''}`} onClick={() => { setDay(d.date); setLetAdmin(false); }}>
                          <small>{l.wd}</small><strong dir="ltr">{l.dm}</strong>
                        </button>
                      ); })}
                    </div>
                  )}
                  {day && (
                    <>
                      <label className="tm-label"><Clock size={16} /> {tt.pick_time}</label>
                      {slots === null ? <div className="spinner tm-spinner" /> : slots.length === 0 ? <p className="empty small">{tt.no_slots}</p> : (
                        <div className="tm-slots">
                          {slots.map((t) => (
                            <button key={t} type="button" className={`tm-slot ${slot === t ? 'sel' : ''}`} onClick={() => { setSlot(t); setLetAdmin(false); }}>{fmtTime12(t, lang)}</button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <label className="tm-check">
                    <input type="checkbox" checked={letAdmin} onChange={(e) => { setLetAdmin(e.target.checked); if (e.target.checked) setSlot(''); }} />
                    <span>{tt.let_admin}</span>
                  </label>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="tm-summary">
                    <div><span>{tt.mode}</span><b>{mode === 'audio' ? tt.audio : tt.video}</b></div>
                    <div><span>{tt.doctor}</span><b>{doctor ? doctorName(doctor, lang) : tt.tbd}</b></div>
                    <div><span>{tt.when}</span><b>{doctor && slot && !letAdmin ? `${dayLabel(day, lang).wd} ${dayLabel(day, lang).dm} · ${fmtTime12(slot, lang)}` : tt.tbd}</b></div>
                    <div><span>{tt.price}</span><b>{info.price ? `${Number(info.price).toLocaleString('en-US')} ${tt.sar}` : tt.free_note}</b></div>
                  </div>
                  <div className="field"><label>{tt.complaint}</label><textarea rows={4} value={f.complaint} onChange={(e) => setF((p) => ({ ...p, complaint: e.target.value }))} placeholder={tt.complaint_ph} /></div>
                  <div className="field-row">
                    <div className="field"><label>{tt.patient_name}</label><input value={f.patient_name} onChange={(e) => setF((p) => ({ ...p, patient_name: e.target.value }))} required /></div>
                    <div className="field"><label>{tt.phone}</label><input {...phoneInputProps} value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} /></div>
                  </div>
                  {(!doctor || letAdmin || !slot) && (
                    <div className="field"><label>{tt.preferred}</label><input value={f.preferred_note} onChange={(e) => setF((p) => ({ ...p, preferred_note: e.target.value }))} placeholder={tt.preferred_ph} /></div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-foot tm-foot">
              <button type="button" className="btn btn-ghost" onClick={step === 0 ? onClose : back}>{step === 0 ? tt.cancel : <><Back size={16} /> {tt.back}</>}</button>
              {step < 3
                ? <button type="button" className="btn btn-primary" disabled={!canNext} onClick={next}>{tt.next} <Fwd size={16} /></button>
                : <button type="button" className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? tt.sending : tt.confirm}</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
