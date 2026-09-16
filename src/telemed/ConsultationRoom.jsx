// Full-page room wrapper for the patient (/portal/consultations/:id/room) and
// the doctor (same path — the role decides which API issues the credentials).
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from '../account/AccountContext.jsx';
import { AccountAPI, DoctorAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import VideoRoom from './VideoRoom.jsx';

const T = {
  ar: { patient_sub: 'استشارتك مع طبيب رؤى', doctor_sub: 'استشارة مع مريض', you_doctor: 'الطبيب', you_patient: 'المريض' },
  en: { patient_sub: 'Your consultation with a RU-MD doctor', doctor_sub: 'Consultation with a patient', you_doctor: 'Doctor', you_patient: 'Patient' },
};

export default function ConsultationRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAccount();
  const { lang } = useLang();
  const tt = T[lang];
  const isDoctor = user?.role === 'doctor';
  const fetchJoin = () => (isDoctor ? DoctorAPI.join(id) : AccountAPI.joinConsultation(id));
  return (
    <VideoRoom
      fetchJoin={fetchJoin}
      onLeave={() => nav(`/portal/consultations/${id}`, { replace: true })}
      subtitle={isDoctor ? tt.doctor_sub : tt.patient_sub}
      badge={<span className="tm-role-badge">{isDoctor ? tt.you_doctor : tt.you_patient}</span>}
    />
  );
}
