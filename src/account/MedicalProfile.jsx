import { useEffect, useState } from 'react';
import { HeartPulse, Pencil, X, Save } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import DobInput from '../components/DobInput.jsx';
import { digits10 } from '../validation.js';

const FIELDS = [
  ['gender', 'gender', 'select'], ['dob', 'dob', 'text'], ['blood_type', 'blood_type', 'select-blood'],
  ['chronic_conditions', 'chronic_conditions', 'area'],
  ['allergies', 'allergies', 'area'], ['medications', 'medications', 'area'],
  ['emergency_name', 'emergency_name', 'text'], ['emergency_phone', 'emergency_phone', 'text'],
];
const BLOOD = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const T = {
  ar: {
    my_medical_file: 'ملفي الطبي', edit: 'تعديل',
    empty: 'أكمل ملفك الطبي ليساعد فريق رؤى على تقديم رعاية أدق.',
    medical_profile: 'الملف الطبي',
    gender: 'الجنس', dob: 'تاريخ الميلاد', blood_type: 'فصيلة الدم',
    chronic_conditions: 'الأمراض المزمنة', allergies: 'الحساسية',
    medications: 'الأدوية الحالية', emergency_name: 'اسم جهة الطوارئ',
    emergency_phone: 'هاتف الطوارئ',
    male: 'ذكر', female: 'أنثى',
    cancel: 'إلغاء', save: 'حفظ',
  },
  en: {
    my_medical_file: 'My Medical File', edit: 'Edit',
    empty: 'Complete your medical file to help the RU-MD team provide more precise care.',
    medical_profile: 'Medical Profile',
    gender: 'Gender', dob: 'Date of birth', blood_type: 'Blood type',
    chronic_conditions: 'Chronic conditions', allergies: 'Allergies',
    medications: 'Current medications', emergency_name: 'Emergency contact name',
    emergency_phone: 'Emergency phone',
    male: 'Male', female: 'Female',
    cancel: 'Cancel', save: 'Save',
  },
};

export default function MedicalProfile() {
  const { lang } = useLang();
  const tt = T[lang];
  const [p, setP] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = () => AccountAPI.profile().then(setP).catch(() => setP({}));
  useEffect(() => { load(); }, []);
  if (!p) return null;

  const filled = FIELDS.filter(([k]) => p[k]);

  return (
    <div className="med-profile panel">
      <div className="med-head">
        <h3><HeartPulse size={18} /> {tt.my_medical_file}</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> {tt.edit}</button>
      </div>
      {filled.length === 0 ? (
        <p className="empty small">{tt.empty}</p>
      ) : (
        <div className="med-grid">
          {FIELDS.filter(([k]) => p[k]).map(([k, labelKey]) => (
            <div key={k} className="med-item"><span>{tt[labelKey]}</span><b dir="auto">{p[k]}</b></div>
          ))}
        </div>
      )}
      {editing && <ProfileEditor data={p} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
    </div>
  );
}

function ProfileEditor({ data, onClose, onSaved }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [f, setF] = useState({ ...data });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => { setBusy(true); try { await AccountAPI.saveProfile(f); onSaved(); } finally { setBusy(false); } };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.medical_profile}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          <div className="field-row">
            <div className="field"><label>{tt.gender}</label>
              <select value={f.gender || ''} onChange={set('gender')}><option value="">—</option><option value="ذكر">{tt.male}</option><option value="أنثى">{tt.female}</option></select></div>
            <div className="field"><label>{tt.dob}</label><DobInput value={f.dob || ''} onChange={(v) => setF((p) => ({ ...p, dob: v }))} /></div>
            <div className="field"><label>{tt.blood_type}</label>
              <select value={f.blood_type || ''} onChange={set('blood_type')}>{BLOOD.map((b) => <option key={b} value={b}>{b || '—'}</option>)}</select></div>
          </div>
          <div className="field"><label>{tt.chronic_conditions}</label><textarea rows={2} value={f.chronic_conditions || ''} onChange={set('chronic_conditions')} /></div>
          <div className="field-row">
            <div className="field"><label>{tt.allergies}</label><textarea rows={2} value={f.allergies || ''} onChange={set('allergies')} /></div>
            <div className="field"><label>{tt.medications}</label><textarea rows={2} value={f.medications || ''} onChange={set('medications')} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.emergency_name}</label><input value={f.emergency_name || ''} onChange={set('emergency_name')} /></div>
            <div className="field"><label>{tt.emergency_phone}</label><input dir="ltr" inputMode="numeric" maxLength={10} placeholder="05XXXXXXXX" value={f.emergency_phone || ''} onChange={(e) => setF((p) => ({ ...p, emergency_phone: digits10(e.target.value) }))} /></div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}><Save size={16} /> {tt.save}</button>
        </div>
      </div>
    </div>
  );
}
