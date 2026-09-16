// Doctor view of one consultation: patient info + medical file, previous
// consultations, join room, and the clinical outcome form.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Video, Phone, FileText, Save, CheckCircle2, UserX, HeartPulse, History } from 'lucide-react';
import { DoctorAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import Tracking from '../account/Tracking.jsx';
import { ConsPill } from './ConsultationCard.jsx';
import { CONS_FLOW, consLabel, modeLabel, fmtAtDate, fmtTime12, splitAt, canJoinNow, minutesUntil, isClosed, fmtAt } from './status.js';
import './telemed.css';

const T = {
  ar: {
    back: 'رجوع لجدولي', consultation: 'استشارة', patient: 'المريض', phone: 'الجوال', when: 'الموعد', complaint: 'شكوى المريض',
    join: 'دخول غرفة الاستشارة', join_hint: (m) => (m > 0 ? `يمكنك الدخول قبل الموعد بـ 15 دقيقة (متبقٍ ${m} دقيقة)` : 'الغرفة مفتوحة الآن'),
    file: 'الملف الطبي', gender: 'الجنس', dob: 'تاريخ الميلاد', blood: 'فصيلة الدم', chronic: 'أمراض مزمنة', allergies: 'الحساسية', meds: 'الأدوية الحالية', none: 'لا يوجد', no_file: 'لم يُكمل المريض ملفه الطبي.',
    previous: 'استشارات سابقة', outcome: 'ملخص الاستشارة', diagnosis: 'التشخيص', notes: 'الملاحظات الطبية', prescription: 'الوصفة / التوصيات', follow_up: 'المتابعة (مثال: بعد أسبوعين)',
    save: 'حفظ المسودة', complete: 'إنهاء وحفظ الملخص', no_show: 'المريض لم يحضر', saved: 'تم الحفظ', tracking: 'سجل الاستشارة', locked: 'الاستشارة مغلقة — الملخص للقراءة فقط.',
    male: 'ذكر', female: 'أنثى',
  },
  en: {
    back: 'Back to my schedule', consultation: 'Consultation', patient: 'Patient', phone: 'Mobile', when: 'Appointment', complaint: "Patient's complaint",
    join: 'Join the consultation room', join_hint: (m) => (m > 0 ? `You can join 15 minutes before the start (${m} minutes left)` : 'The room is open now'),
    file: 'Medical file', gender: 'Gender', dob: 'Date of birth', blood: 'Blood type', chronic: 'Chronic conditions', allergies: 'Allergies', meds: 'Current medications', none: 'None', no_file: 'The patient has not completed the medical file.',
    previous: 'Previous consultations', outcome: 'Consultation summary', diagnosis: 'Diagnosis', notes: 'Clinical notes', prescription: 'Prescription / advice', follow_up: 'Follow-up (e.g. in two weeks)',
    save: 'Save draft', complete: 'Complete & save summary', no_show: 'Patient did not show', saved: 'Saved', tracking: 'Consultation log', locked: 'Consultation closed — summary is read-only.',
    male: 'Male', female: 'Female',
  },
};

export default function DoctorConsultation() {
  const { lang } = useLang();
  const tt = T[lang];
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [f, setF] = useState({ diagnosis: '', doctor_notes: '', prescription: '', follow_up: '' });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = () => DoctorAPI.consultation(id).then((r) => { setC(r); setF({ diagnosis: r.diagnosis || '', doctor_notes: r.doctor_notes || '', prescription: r.prescription || '', follow_up: r.follow_up || '' }); }).catch(() => nav('/portal'));
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!c || isClosed(c.status)) return undefined;
    const t = setInterval(() => DoctorAPI.consultation(id).then((r) => setC((cur) => ({ ...r, diagnosis: cur?.diagnosis, doctor_notes: cur?.doctor_notes }))).catch(() => {}), 30000);
    return () => clearInterval(t);
  }, [c?.status]);
  if (!c) return <div className="page-loader"><div className="spinner" /></div>;

  const Back = lang === 'ar' ? ArrowRight : ArrowLeft;
  const Icon = c.mode === 'audio' ? Phone : Video;
  const { time } = splitAt(c.scheduled_at);
  const joinable = canJoinNow(c);
  const mins = minutesUntil(c.scheduled_at);
  const closed = isClosed(c.status);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (status) => {
    setBusy(true);
    try { await DoctorAPI.saveOutcome(id, { ...f, status: status || c.status }); setSaved(true); setTimeout(() => setSaved(false), 2000); await load(); }
    finally { setBusy(false); }
  };
  const p = c.profile || {};
  const hasFile = p.gender || p.dob || p.blood_type || p.chronic_conditions || p.allergies || p.medications;
  const g = p.gender === 'male' ? tt.male : p.gender === 'female' ? tt.female : p.gender;

  return (
    <div className="detail-view wide">
      <button className="back-link" onClick={() => nav('/portal')}><Back size={16} /> {tt.back}</button>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h2><Icon size={20} /> {tt.consultation} — {modeLabel(c.mode, lang)}</h2>
                <span className="ref-code" dir="ltr">{c.ref}</span>
              </div>
              <ConsPill status={c.status} />
            </div>
            <div className="detail-meta">
              <div><span>{tt.patient}</span><b>{c.patient_name || c.user_name}</b></div>
              {(c.phone || c.user_phone) && <div><span>{tt.phone}</span><b dir="ltr">{c.phone || c.user_phone}</b></div>}
              <div><span>{tt.when}</span><b>{c.scheduled_at ? `${fmtAtDate(c.scheduled_at, lang)} · ${fmtTime12(time, lang)}` : '—'}</b></div>
            </div>
            {c.complaint && <p className="detail-notes"><FileText size={14} /> <b>{tt.complaint}:</b> {c.complaint}</p>}
            {(c.status === 'scheduled' || c.status === 'in_progress') && (
              <div className={`tm-join-box ${joinable ? 'open' : ''}`}>
                <div><strong><Icon size={16} /> {modeLabel(c.mode, lang)}</strong><small>{tt.join_hint(joinable ? 0 : (mins ?? 0))}</small></div>
                <button type="button" className="btn btn-primary" disabled={!joinable} onClick={() => nav(`/portal/consultations/${c.id}/room`)}><Icon size={16} /> {tt.join}</button>
              </div>
            )}
          </div>

          <div className="detail-card tm-summary-card">
            <h3><HeartPulse size={18} /> {tt.outcome}</h3>
            {closed && <p className="muted">{tt.locked}</p>}
            <div className="tm-form">
              <div className="field"><label>{tt.diagnosis}</label><input value={f.diagnosis} onChange={set('diagnosis')} disabled={closed} /></div>
              <div className="field"><label>{tt.notes}</label><textarea rows={4} value={f.doctor_notes} onChange={set('doctor_notes')} disabled={closed} /></div>
              <div className="field"><label>{tt.prescription}</label><textarea rows={3} value={f.prescription} onChange={set('prescription')} disabled={closed} /></div>
              <div className="field"><label>{tt.follow_up}</label><input value={f.follow_up} onChange={set('follow_up')} disabled={closed} /></div>
            </div>
            {!closed && (
              <div className="tm-actions-row wrap">
                <button type="button" className="btn btn-outline" disabled={busy} onClick={() => submit()}><Save size={16} /> {tt.save}</button>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit('completed')}><CheckCircle2 size={16} /> {tt.complete}</button>
                <button type="button" className="btn btn-ghost danger-text" disabled={busy} onClick={() => submit('no_show')}><UserX size={16} /> {tt.no_show}</button>
                {saved && <span className="tm-saved">{tt.saved}</span>}
              </div>
            )}
          </div>

          <h3 className="track-title">{tt.tracking}</h3>
          <Tracking flow={CONS_FLOW} status={c.status === 'no_show' ? 'cancelled' : c.status} events={c.events} audience="admin" labelFn={consLabel} />
        </div>

        <aside className="detail-side">
          <div className="side-card">
            <div className="side-card-head"><HeartPulse size={18} /> <h3>{tt.file}</h3></div>
            <div className="side-card-body">
              {!hasFile ? <p className="empty small">{tt.no_file}</p> : (
                <dl className="tm-dl">
                  {g && <><dt>{tt.gender}</dt><dd>{g}</dd></>}
                  {p.dob && <><dt>{tt.dob}</dt><dd dir="ltr">{p.dob}</dd></>}
                  {p.blood_type && <><dt>{tt.blood}</dt><dd dir="ltr">{p.blood_type}</dd></>}
                  <dt>{tt.chronic}</dt><dd>{p.chronic_conditions || tt.none}</dd>
                  <dt>{tt.allergies}</dt><dd>{p.allergies || tt.none}</dd>
                  <dt>{tt.meds}</dt><dd>{p.medications || tt.none}</dd>
                </dl>
              )}
            </div>
          </div>
          {c.previous?.length > 0 && (
            <div className="side-card">
              <div className="side-card-head"><History size={18} /> <h3>{tt.previous}</h3></div>
              <div className="side-card-body">
                {c.previous.map((h) => (
                  <div key={h.id} className="tm-prev">
                    <small dir="ltr">{fmtAt(h.scheduled_at, lang)}</small>
                    <strong>{h.diagnosis || '—'}</strong>
                    {h.doctor_notes && <p>{h.doctor_notes.slice(0, 140)}{h.doctor_notes.length > 140 ? '…' : ''}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
