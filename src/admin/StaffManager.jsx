// Admin — unified staff directory ("الكادر الطبي"): one record per person with
// their profession(s), type (in-house / visiting-contracted) and the accesses
// they hold: home-visit scheduling, the telemedicine portal, the control panel.
// Used as a full page (/admin/staff) and embedded inside the telemedicine
// manager (filter="telemed").
import { useEffect, useMemo, useState } from 'react';
import { Plus, X, Pencil, Power, Trash2, Search, UserRound, ShieldCheck, Briefcase, Video, Home, KeyRound, Link2, Unlink, Clock, Trash, LayoutDashboard, Check } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import { useLang } from '../i18n.jsx';
import { isSaudiMobile, digits10, phoneInputProps } from '../validation.js';
import { CLINICIAN_ROLES_BI, normBiList, biLabel } from '../account/status.js';
import ImageUpload from './ImageUpload.jsx';
import DobInput from '../components/DobInput.jsx';
import AvailabilityEditor from '../telemed/AvailabilityEditor.jsx';
import { doctorName } from '../telemed/status.js';
import '../telemed/telemed.css';

const T = {
  ar: {
    title: 'الكادر الطبي', hint: 'قائمة واحدة لكل من يعمل مع رؤى: الأطباء والممرضون والأخصائيون — الموظفون والمتعاقدون. من هنا تُمنح الصلاحيات: الزيارات المنزلية، الطب الاتصالي، ولوحة التحكم.',
    add: 'إضافة فرد للكادر', search: 'بحث بالاسم أو المهنة أو البريد...', empty: 'لا يوجد أفراد بعد.',
    f_all: 'الكل', f_staff: 'كادر رؤى', f_visiting: 'زائر / متعاقد', f_telemed: 'لديهم الطب الاتصالي', f_admin: 'لديهم لوحة التحكم',
    th_name: 'الاسم', th_prof: 'المهنة / التخصصات', th_type: 'النوع', th_contact: 'التواصل', th_access: 'الصلاحيات', th_status: 'الحالة', th_actions: 'إجراءات',
    type_staff: 'كادر رؤى', type_visiting: 'زائر / متعاقد', until: 'حتى',
    acc_visits: 'زيارات منزلية', acc_telemed: 'الطب الاتصالي', acc_admin: 'لوحة التحكم',
    active: 'مُفعّل', suspended: 'موقوف', edit: 'تعديل', toggle: 'تفعيل/إيقاف', delete: 'حذف',
    confirm_delete: 'حذف هذا الفرد من الكادر؟ ستُسحب صلاحياته (الطب الاتصالي ولوحة التحكم) وتبقى سجلاته السابقة.',
    // modal
    new_title: 'إضافة فرد للكادر', edit_title: 'بيانات الفرد', tab_info: 'البيانات', tab_access: 'الصلاحيات والحسابات',
    name_ar: 'الاسم (عربي)', name_en: 'الاسم (إنجليزي)', phone: 'الجوال', email: 'البريد الإلكتروني', photo: 'الصورة',
    profession: 'المهنة الأساسية', profession_ph: 'اختر المهنة...', roles: 'التخصصات التي يغطيها في الزيارات المنزلية', roles_hint: 'تظهر أسماء الكادر في جدولة الزيارة بحسب التخصص المختار.',
    title_ar: 'اللقب (عربي)', title_en: 'اللقب (إنجليزي)', spec_ar: 'التخصص الدقيق (عربي)', spec_en: 'التخصص الدقيق (إنجليزي)', bio_ar: 'نبذة (عربي)', bio_en: 'نبذة (إنجليزي)',
    type: 'نوع الفرد', staff_hint: 'موظف ضمن كادر رؤى', visiting_hint: 'طبيب/ممارس زائر أو متعاقد',
    organization: 'الجهة / المنشأة', license_no: 'رقم الترخيص المهني', contract_start: 'بداية التعاقد', contract_end: 'نهاية التعاقد', contract_notes: 'ملاحظات التعاقد (الرسوم، النسبة، الشروط...)',
    home_visits: 'يظهر في قائمة الزيارات المنزلية', save: 'حفظ', saved: 'تم الحفظ', cancel: 'إلغاء', close: 'إغلاق', required: 'أدخل الاسم على الأقل.', phone_invalid: 'رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05.',
    email_taken: 'البريد مستخدم في حساب آخر', weak: 'كلمة المرور قصيرة (6 أحرف)', failed: 'تعذّر الحفظ', save_first: 'احفظ البيانات أولًا ثم امنح الصلاحيات من تبويب «الصلاحيات والحسابات».',
    // access cards
    tm_title: 'الطب الاتصالي', tm_off: 'لا يملك حسابًا للطب الاتصالي.', tm_on: 'يملك حسابًا — يدخل من /login ويرى جدوله وينضم للاستشارات.',
    tm_email: 'بريد الدخول', tm_password: 'كلمة المرور', tm_grant: 'منح الصلاحية', tm_revoke: 'سحب الصلاحية', tm_confirm_revoke: 'سحب صلاحية الطب الاتصالي؟ سيُغلق حساب الدخول وتبقى استشاراته السابقة.',
    slot: 'مدة الاستشارة (دقيقة)', published: 'يظهر للمرضى في الحجز الذاتي', availability: 'أوقات التوفر', days_off: 'أيام الإجازة', add_off: 'إضافة',
    reset_pw: 'تغيير كلمة المرور', new_pw: 'كلمة المرور الجديدة', pw_done: 'تم تحديث كلمة المرور', pw_all: 'كلمة مرور واحدة للفرد — تُطبَّق على كل حسابات الدخول المرتبطة به (الطب الاتصالي ولوحة التحكم).',
    same_login_admin: 'سيدخل بنفس بريد وكلمة مرور لوحة التحكم — لا حاجة لكلمة مرور جديدة.', same_login_tm: 'سيدخل بنفس بريد وكلمة مرور الطب الاتصالي — لا حاجة لكلمة مرور جديدة.', set_other_pw: 'أو حدّد كلمة مرور مختلفة (اختياري)',
    ad_title: 'لوحة التحكم', ad_off: 'لا يملك حساب دخول للوحة التحكم.', ad_on: 'يملك حساب دخول للوحة التحكم.', ad_super_only: 'منح صلاحية لوحة التحكم متاح لمدير النظام فقط.',
    ad_link: 'ربط بحساب موجود', ad_pick: 'اختر مستخدمًا...', ad_create: 'إنشاء حساب جديد', ad_email: 'بريد الدخول', ad_password: 'كلمة المرور', ad_grant: 'منح الصلاحية',
    ad_perm_hint: 'يُنشأ الحساب بصلاحيات عرض أساسية (لوحة التحكم، الزيارات، الطب الاتصالي). عدّل التفاصيل من «إدارة المستخدمين».',
    ad_unlink: 'فك الربط', ad_unlink_hint: 'يبقى حساب لوحة التحكم ويُفك ربطه بالفرد فقط.',
    hv_title: 'الزيارات المنزلية', hv_on: 'يظهر اسمه في قائمة الكادر عند جدولة الزيارة حسب التخصصات المحددة.', hv_off: 'مخفي من قائمة جدولة الزيارات.',
    linked: 'مرتبط', role_super: 'مدير نظام', role_staff: 'مستخدم', off: 'غير مفعّل',
  },
  en: {
    title: 'Clinical Staff', hint: 'One list for everyone working with RU-MD: doctors, nurses and therapists — employees and contractors. Grant access from here: home visits, telemedicine, and the control panel.',
    add: 'Add staff member', search: 'Search by name, profession or email...', empty: 'No staff yet.',
    f_all: 'All', f_staff: 'RU-MD staff', f_visiting: 'Visiting / contracted', f_telemed: 'Has telemedicine', f_admin: 'Has control panel',
    th_name: 'Name', th_prof: 'Profession / specialties', th_type: 'Type', th_contact: 'Contact', th_access: 'Access', th_status: 'Status', th_actions: 'Actions',
    type_staff: 'RU-MD staff', type_visiting: 'Visiting / contracted', until: 'until',
    acc_visits: 'Home visits', acc_telemed: 'Telemedicine', acc_admin: 'Control panel',
    active: 'Active', suspended: 'Suspended', edit: 'Edit', toggle: 'Activate / Suspend', delete: 'Delete',
    confirm_delete: 'Delete this staff member? Their accesses (telemedicine, control panel) are revoked; past records stay.',
    new_title: 'Add staff member', edit_title: 'Staff member', tab_info: 'Details', tab_access: 'Access & accounts',
    name_ar: 'Name (Arabic)', name_en: 'Name (English)', phone: 'Mobile', email: 'Email', photo: 'Photo',
    profession: 'Primary profession', profession_ph: 'Choose a profession...', roles: 'Specialties covered for home visits', roles_hint: 'Staff names appear in the visit scheduler by the chosen specialty.',
    title_ar: 'Title (Arabic)', title_en: 'Title (English)', spec_ar: 'Sub-specialty (Arabic)', spec_en: 'Sub-specialty (English)', bio_ar: 'Bio (Arabic)', bio_en: 'Bio (English)',
    type: 'Type', staff_hint: 'Employee of RU-MD', visiting_hint: 'Visiting or contracted clinician',
    organization: 'Organization / facility', license_no: 'Professional license no.', contract_start: 'Contract start', contract_end: 'Contract end', contract_notes: 'Contract notes (fees, share, terms...)',
    home_visits: 'Listed for home-visit scheduling', save: 'Save', saved: 'Saved', cancel: 'Cancel', close: 'Close', required: 'Enter at least a name.', phone_invalid: 'Mobile number must be 10 digits starting with 05.',
    email_taken: 'Email already used by another account', weak: 'Password too short (6 chars)', failed: 'Could not save', save_first: 'Save the details first, then grant access from the "Access & accounts" tab.',
    tm_title: 'Telemedicine', tm_off: 'No telemedicine account.', tm_on: 'Has an account — signs in at /login to see the schedule and join consultations.',
    tm_email: 'Login email', tm_password: 'Password', tm_grant: 'Grant access', tm_revoke: 'Revoke access', tm_confirm_revoke: 'Revoke telemedicine access? The login is closed; past consultations stay.',
    slot: 'Consultation length (min)', published: 'Visible to patients for self-booking', availability: 'Availability', days_off: 'Days off', add_off: 'Add',
    reset_pw: 'Change password', new_pw: 'New password', pw_done: 'Password updated', pw_all: 'One password per person — applied to every login linked to them (telemedicine and control panel).',
    same_login_admin: 'Signs in with the same control-panel email and password — no new password needed.', same_login_tm: 'Signs in with the same telemedicine email and password — no new password needed.', set_other_pw: 'Or set a different password (optional)',
    ad_title: 'Control panel', ad_off: 'No control-panel login.', ad_on: 'Has a control-panel login.', ad_super_only: 'Granting control-panel access is for the super admin only.',
    ad_link: 'Link an existing user', ad_pick: 'Pick a user...', ad_create: 'Create a new user', ad_email: 'Login email', ad_password: 'Password', ad_grant: 'Grant access',
    ad_perm_hint: 'The user is created with basic view permissions (dashboard, visits, telemedicine). Fine-tune in "User Management".',
    ad_unlink: 'Unlink', ad_unlink_hint: 'The control-panel user stays; only the link to this person is removed.',
    hv_title: 'Home visits', hv_on: 'Appears in the clinician list when scheduling a visit, by the chosen specialties.', hv_off: 'Hidden from the visit scheduler.',
    linked: 'Linked', role_super: 'Super admin', role_staff: 'User', off: 'Not granted',
  },
};
const parse = (v) => { try { return JSON.parse(v); } catch { return null; } };

export default function StaffManager({ embedded = false, filter: initialFilter = 'all' }) {
  const { lang } = useLang();
  const { can, admin } = useAdminAuth();
  const tt = T[lang];
  const page = embedded ? 'telemed' : 'staff';
  const [list, setList] = useState([]);
  const [roles, setRoles] = useState(CLINICIAN_ROLES_BI);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [modal, setModal] = useState(null); // { id } | { id: null }
  const load = () => AdminAPI.staff().then(setList).catch(() => {});
  useEffect(() => {
    load();
    AdminAPI.settings().then((rs) => setRoles(normBiList(parse(rs.find((r) => r.key === 'clinician_roles')?.value_ar), CLINICIAN_ROLES_BI))).catch(() => {});
  }, []);
  const roleLabel = (ar) => biLabel(roles.find((r) => r.ar === ar) || { ar, en: ar }, lang);

  const shown = useMemo(() => list.filter((s) => {
    if (filter === 'staff' && s.staff_type === 'visiting') return false;
    if (filter === 'visiting' && s.staff_type !== 'visiting') return false;
    if (filter === 'telemed' && !s.has_telemed) return false;
    if (filter === 'admin' && !s.has_admin) return false;
    if (!q.trim()) return true;
    const hay = `${s.name_ar} ${s.name_en || ''} ${s.email || ''} ${s.phone || ''} ${s.profession_ar || ''} ${s.profession_en || ''} ${(s.roles || []).join(' ')} ${s.specialty_ar || ''}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  }), [list, filter, q]);

  const toggle = async (s) => { await AdminAPI.setStaffActive(s.id, !s.is_active); load(); };
  const remove = async (id) => { if (confirm(tt.confirm_delete)) { await AdminAPI.deleteStaff(id); load(); } };

  return (
    <div>
      {!embedded && (
        <div className="page-head">
          <div><h1 className="page-title">{tt.title}</h1><p className="page-hint">{tt.hint}</p></div>
          {can(page, 'create') && <button className="btn btn-primary" onClick={() => setModal({ id: null })}><Plus size={18} /> {tt.add}</button>}
        </div>
      )}
      <div className="page-head" style={{ marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
        <div className="tm-filters">
          {[['all', tt.f_all], ['staff', tt.f_staff], ['visiting', tt.f_visiting], ['telemed', tt.f_telemed], ['admin', tt.f_admin]].map(([k, l]) => (
            <button key={k} type="button" className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="st-search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt.search} /></div>
          {embedded && can(page, 'create') && <button className="btn btn-primary btn-sm" onClick={() => setModal({ id: null })}><Plus size={16} /> {tt.add}</button>}
        </div>
      </div>

      <div className="panel">
        {shown.length === 0 ? <p className="empty">{tt.empty}</p> : (
          <table className="admin-table st-table">
            <thead><tr><th>{tt.th_name}</th><th>{tt.th_prof}</th><th>{tt.th_type}</th><th>{tt.th_contact}</th><th>{tt.th_access}</th><th>{tt.th_status}</th><th>{tt.th_actions}</th></tr></thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id} className={s.is_active ? '' : 'st-row-off'}>
                  <td>
                    <div className="tm-doc-card">
                      <span className="tm-avatar">{s.photo ? <img src={s.photo} alt="" /> : <UserRound size={18} />}</span>
                      <div><strong>{doctorName({ name: lang === 'en' ? (s.name_en || s.name_ar) : s.name_ar, title_ar: s.title_ar, title_en: s.title_en, profession_ar: s.profession_ar, profession_en: s.profession_en }, lang)}</strong>
                        <small>{lang === 'en' ? s.name_ar : (s.name_en || '')}</small></div>
                    </div>
                  </td>
                  <td>
                    <div className="st-chips">
                      {s.profession_ar && <span className="st-chip main">{roleLabel(s.profession_ar)}</span>}
                      {(s.roles || []).filter((r) => r !== s.profession_ar).map((r) => <span key={r} className="st-chip">{roleLabel(r)}</span>)}
                    </div>
                    {(lang === 'en' ? s.specialty_en || s.specialty_ar : s.specialty_ar || s.specialty_en) && <small className="muted">{lang === 'en' ? s.specialty_en || s.specialty_ar : s.specialty_ar || s.specialty_en}</small>}
                  </td>
                  <td>{s.staff_type === 'visiting'
                    ? <span className="badge tm-badge-visiting" title={s.organization || ''}><Briefcase size={12} /> {tt.type_visiting}{s.contract_end ? <small dir="ltr"> · {s.contract_end}</small> : null}</span>
                    : <span className="badge ok"><ShieldCheck size={12} /> {tt.type_staff}</span>}</td>
                  <td dir="ltr" className="st-contact">{s.phone && <div>{s.phone}</div>}{s.email && <div>{s.email}</div>}</td>
                  <td>
                    <div className="st-access">
                      <span className={`st-acc ${s.home_visits ? 'on' : ''}`} title={tt.acc_visits}><Home size={13} /> {tt.acc_visits}</span>
                      <span className={`st-acc ${s.has_telemed ? 'on' : ''}`} title={tt.acc_telemed}><Video size={13} /> {tt.acc_telemed}</span>
                      <span className={`st-acc ${s.has_admin ? 'on' : ''}`} title={tt.acc_admin}><LayoutDashboard size={13} /> {tt.acc_admin}</span>
                    </div>
                  </td>
                  <td>{s.is_active ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.suspended}</span>}</td>
                  <td className="row-actions">
                    {can(page, 'edit') && <button onClick={() => setModal({ id: s.id })} title={tt.edit}><Pencil size={16} /></button>}
                    {can(page, 'edit') && <button onClick={() => toggle(s)} title={tt.toggle}><Power size={16} /></button>}
                    {can(page, 'delete') && <button onClick={() => remove(s.id)} className="danger" title={tt.delete}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <StaffModal id={modal.id} roles={roles} tt={tt} lang={lang} isSuper={!!admin?.is_super} canEdit={can(page, 'edit') || can(page, 'create')}
        onClose={() => { setModal(null); load(); }} onCreated={(id) => { setModal({ id }); load(); }} />}
    </div>
  );
}

/* ================================ Modal ================================ */
const blank = { name_ar: '', name_en: '', phone: '', email: '', photo: '', profession_ar: '', profession_en: '', roles: [], title_ar: '', title_en: '', specialty_ar: '', specialty_en: '', bio_ar: '', bio_en: '', staff_type: 'staff', organization: '', license_no: '', contract_start: '', contract_end: '', contract_notes: '', home_visits: 1, is_active: 1, sort_order: 0 };

function StaffModal({ id, roles, tt, lang, isSuper, canEdit, onClose, onCreated }) {
  const isEdit = !!id;
  const [tab, setTab] = useState('info');
  const [s, setS] = useState(null);      // full record (edit)
  const [f, setF] = useState(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = () => AdminAPI.staffOne(id).then((r) => { setS(r); setF({ ...blank, ...r, roles: r.roles || [], photo: r.photo || '' }); });
  useEffect(() => { if (isEdit) load(); }, [id]);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const roleEn = (ar) => roles.find((r) => r.ar === ar)?.en || ar;
  const setProfession = (ar) => setF((p) => ({ ...p, profession_ar: ar, profession_en: roleEn(ar), roles: ar && !p.roles.includes(ar) ? [...p.roles, ar] : p.roles }));
  const toggleRole = (ar) => setF((p) => ({ ...p, roles: p.roles.includes(ar) ? p.roles.filter((x) => x !== ar) : [...p.roles, ar] }));
  const visiting = f.staff_type === 'visiting';

  const save = async () => {
    if (!f.name_ar && !f.name_en) { setError(tt.required); return; }
    if (f.phone && !isSaudiMobile(f.phone)) { setError(tt.phone_invalid); return; }
    setBusy(true); setError('');
    try {
      if (isEdit) { await AdminAPI.updateStaff(id, f); setSaved(true); setTimeout(() => setSaved(false), 2000); await load(); }
      else { const r = await AdminAPI.createStaff(f); onCreated(r.id); setTab('access'); }
    } catch (e) {
      const code = e?.response?.data?.error;
      setError(code === 'email_taken' ? tt.email_taken : tt.failed);
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 940 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{isEdit ? tt.edit_title : tt.new_title}{s ? ` — ${s.name_ar}` : ''}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="tm-admin-tabs" style={{ padding: '0 24px', marginBottom: 0 }}>
          <button type="button" className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}><UserRound size={15} /> {tt.tab_info}</button>
          <button type="button" className={tab === 'access' ? 'active' : ''} onClick={() => setTab('access')}><KeyRound size={15} /> {tt.tab_access}</button>
        </div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}

          {tab === 'info' && (
            <>
              <div className="st-info-grid">
                <div>
                  <div className="field-row">
                    <div className="field"><label>{tt.name_ar}</label><input value={f.name_ar} onChange={set('name_ar')} /></div>
                    <div className="field"><label>{tt.name_en}</label><input dir="ltr" value={f.name_en || ''} onChange={set('name_en')} /></div>
                  </div>
                  <div className="field-row">
                    <div className="field"><label>{tt.phone}</label><input {...phoneInputProps} value={f.phone || ''} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} /></div>
                    <div className="field"><label>{tt.email}</label><input type="email" dir="ltr" value={f.email || ''} onChange={set('email')} /></div>
                  </div>
                </div>
                <ImageUpload label={tt.photo} value={f.photo || ''} height={110} onChange={(url) => setF((p) => ({ ...p, photo: url }))} />
              </div>

              <div className="field-row">
                <div className="field"><label>{tt.profession}</label>
                  <select value={f.profession_ar || ''} onChange={(e) => setProfession(e.target.value)}>
                    <option value="">{tt.profession_ph}</option>
                    {f.profession_ar && !roles.some((r) => r.ar === f.profession_ar) && <option value={f.profession_ar}>{f.profession_ar}</option>}
                    {roles.map((r) => <option key={r.ar} value={r.ar}>{biLabel(r, lang)}</option>)}
                  </select>
                </div>
                <div className="field"><label>{tt.type}</label>
                  <div className="tm-mode-toggle">
                    <button type="button" className={!visiting ? 'active' : ''} title={tt.staff_hint} onClick={() => setF((p) => ({ ...p, staff_type: 'staff' }))}><ShieldCheck size={15} /> {tt.type_staff}</button>
                    <button type="button" className={visiting ? 'active' : ''} title={tt.visiting_hint} onClick={() => setF((p) => ({ ...p, staff_type: 'visiting' }))}><Briefcase size={15} /> {tt.type_visiting}</button>
                  </div>
                </div>
              </div>
              <div className="field"><label>{tt.roles}</label>
                <div className="st-chips pick">
                  {roles.map((r) => { const on = f.roles.includes(r.ar); return <button key={r.ar} type="button" className={`st-chip ${on ? 'main' : ''}`} onClick={() => toggleRole(r.ar)}>{on && <Check size={12} />} {biLabel(r, lang)}</button>; })}
                </div>
                <small className="muted">{tt.roles_hint}</small>
              </div>
              {visiting && (
                <div className="tm-sched-box" style={{ marginTop: 0, marginBottom: 14 }}>
                  <div className="field-row">
                    <div className="field"><label>{tt.organization}</label><input value={f.organization || ''} onChange={set('organization')} /></div>
                    <div className="field"><label>{tt.license_no}</label><input dir="ltr" value={f.license_no || ''} onChange={set('license_no')} /></div>
                  </div>
                  <div className="field-row">
                    <div className="field"><label>{tt.contract_start}</label><DobInput iso value={f.contract_start || ''} onChange={(v) => setF((p) => ({ ...p, contract_start: v }))} /></div>
                    <div className="field"><label>{tt.contract_end}</label><DobInput iso value={f.contract_end || ''} onChange={(v) => setF((p) => ({ ...p, contract_end: v }))} /></div>
                  </div>
                  <div className="field"><label>{tt.contract_notes}</label><textarea rows={2} value={f.contract_notes || ''} onChange={set('contract_notes')} /></div>
                </div>
              )}
              <div className="field-row">
                <div className="field"><label>{tt.title_ar}</label><input value={f.title_ar || ''} onChange={set('title_ar')} placeholder="استشاري / أخصائي" /></div>
                <div className="field"><label>{tt.title_en}</label><input dir="ltr" value={f.title_en || ''} onChange={set('title_en')} placeholder="Consultant / Specialist" /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>{tt.spec_ar}</label><input value={f.specialty_ar || ''} onChange={set('specialty_ar')} /></div>
                <div className="field"><label>{tt.spec_en}</label><input dir="ltr" value={f.specialty_en || ''} onChange={set('specialty_en')} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>{tt.bio_ar}</label><textarea rows={2} value={f.bio_ar || ''} onChange={set('bio_ar')} /></div>
                <div className="field"><label>{tt.bio_en}</label><textarea rows={2} dir="ltr" value={f.bio_en || ''} onChange={set('bio_en')} /></div>
              </div>
              <label className="tm-check"><input type="checkbox" checked={!!f.home_visits} onChange={(e) => setF((p) => ({ ...p, home_visits: e.target.checked ? 1 : 0 }))} /> <span>{tt.home_visits}</span></label>
            </>
          )}

          {tab === 'access' && (!isEdit || !s ? <p className="empty">{tt.save_first}</p> : (
            <AccessPanel s={s} tt={tt} lang={lang} isSuper={isSuper} canEdit={canEdit} reload={load} />
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.close}</button>
          {tab === 'info' && canEdit && <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : tt.save}</button>}
          {saved && <span className="tm-saved">{tt.saved}</span>}
        </div>
      </div>
    </div>
  );
}

/* ============================ Access panel ============================ */
function AccessPanel({ s, tt, lang, isSuper, canEdit, reload }) {
  const [tm, setTm] = useState({ email: s.telemed_email || s.admin_email || s.email || '', password: '' });
  const [slot, setSlot] = useState(s.slot_minutes || 20);
  const [pub, setPub] = useState(s.is_published == null ? true : !!s.is_published);
  const [rules, setRules] = useState(s.availability || []);
  const [dates, setDates] = useState(s.date_availability || []);
  const [off, setOff] = useState(s.days_off || []);
  const [newOff, setNewOff] = useState('');
  const [admins, setAdmins] = useState([]);
  const [ad, setAd] = useState({ mode: 'link', admin_id: '', email: s.telemed_email || s.email || '', password: '' });
  const [pw, setPw] = useState({ which: null, value: '', done: false });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (isSuper) AdminAPI.admins().then(setAdmins).catch(() => {}); }, [isSuper]);
  useEffect(() => { setRules(s.availability || []); setDates(s.date_availability || []); setOff(s.days_off || []); setSlot(s.slot_minutes || 20); setPub(s.is_published == null ? true : !!s.is_published); }, [s.id, s.user_id]);
  const linkedAdminIds = new Set();
  const err = (e) => { const c = e?.response?.data?.error; setMsg(c === 'email_taken' ? tt.email_taken : c === 'weak_password' ? tt.weak : c === 'admin_linked' ? tt.linked : tt.failed); };

  const grantTm = async () => { setBusy(true); setMsg(''); try { await AdminAPI.staffGrantTelemed(s.id, { email: tm.email, password: tm.password || undefined, slot_minutes: slot, is_published: pub ? 1 : 0, availability: rules, date_availability: dates }); await reload(); } catch (e) { err(e); } finally { setBusy(false); } };
  const revokeTm = async () => { if (!confirm(tt.tm_confirm_revoke)) return; await AdminAPI.staffRevokeTelemed(s.id); await reload(); };
  const saveTm = async () => { setBusy(true); setMsg(''); try { await AdminAPI.updateStaff(s.id, { ...s, slot_minutes: slot, is_published: pub ? 1 : 0, availability: rules.filter((r) => r.start_time < r.end_time), date_availability: dates }); setMsg(tt.saved); await reload(); } catch (e) { err(e); } finally { setBusy(false); } };
  const addOff = async () => { if (!newOff || !s.user_id) return; await AdminAPI.addDoctorDayOff(s.user_id, newOff); setNewOff(''); await reload(); };
  const removeOff = async (oid) => { await AdminAPI.removeDoctorDayOff(s.user_id, oid); await reload(); };
  const grantAd = async () => { setBusy(true); setMsg(''); try { await AdminAPI.staffGrantAdmin(s.id, ad.mode === 'link' ? { admin_id: ad.admin_id } : { email: ad.email, password: ad.password || undefined }); await reload(); } catch (e) { err(e); } finally { setBusy(false); } };
  const unlinkAd = async () => { await AdminAPI.staffRevokeAdmin(s.id); await reload(); };
  const setPassword = async () => {
    if (pw.value.length < 6) { setMsg(tt.weak); return; }
    try { await AdminAPI.staffPassword(s.id, pw.value); setPw({ which: null, value: '', done: true }); setMsg(tt.pw_done); } catch (e) { err(e); }
  };
  const adminRow = admins.find((a) => String(a.id) === String(s.admin_id));

  return (
    <div className="st-access-grid">
      {msg && <div className={`form-alert ${msg === tt.saved || msg === tt.pw_done ? 'success' : 'error'}`} style={{ gridColumn: '1 / -1' }}>{msg}</div>}

      {/* Home visits */}
      <div className={`st-card ${s.home_visits ? 'on' : ''}`}>
        <div className="st-card-head"><Home size={18} /> <h3>{tt.hv_title}</h3>{s.home_visits ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.off}</span>}</div>
        <p className="muted">{s.home_visits ? tt.hv_on : tt.hv_off}</p>
        {(s.roles || []).length > 0 && <div className="st-chips">{(s.roles || []).map((r) => <span key={r} className="st-chip">{r}</span>)}</div>}
      </div>

      {/* Telemedicine */}
      <div className={`st-card ${s.user_id ? 'on' : ''}`}>
        <div className="st-card-head"><Video size={18} /> <h3>{tt.tm_title}</h3>{s.user_id ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.off}</span>}</div>
        {!s.user_id ? (
          <>
            <p className="muted">{tt.tm_off}</p>
            {canEdit && (
              <>
                {s.admin_id && <p className="muted st-note"><KeyRound size={13} /> {tt.same_login_admin}</p>}
                <div className="field-row">
                  <div className="field"><label>{tt.tm_email}</label><input type="email" dir="ltr" value={tm.email} onChange={(e) => setTm((p) => ({ ...p, email: e.target.value }))} /></div>
                  <div className="field"><label>{s.admin_id ? tt.set_other_pw : tt.tm_password}</label><input type="text" dir="ltr" value={tm.password} onChange={(e) => setTm((p) => ({ ...p, password: e.target.value }))} placeholder="6+" /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>{tt.slot}</label><input type="number" dir="ltr" min={5} step={5} value={slot} onChange={(e) => setSlot(e.target.value)} /></div>
                  <div className="field"><label>&nbsp;</label><label className="tm-check"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} /> <span>{tt.published}</span></label></div>
                </div>
                <h4 className="st-h4"><Clock size={14} /> {tt.availability}</h4>
                <AvailabilityEditor rules={rules} onChange={setRules} dates={dates} onChangeDates={setDates} />
                <div className="tm-actions-row"><button type="button" className="btn btn-primary" disabled={busy || !tm.email || (!tm.password && !s.admin_id)} onClick={grantTm}><Video size={15} /> {tt.tm_grant}</button></div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="muted">{tt.tm_on}</p>
            <div className="st-kv"><span>{tt.tm_email}</span><b dir="ltr">{s.telemed_email}</b></div>
            {canEdit && (
              <>
                <div className="field-row">
                  <div className="field"><label>{tt.slot}</label><input type="number" dir="ltr" min={5} step={5} value={slot} onChange={(e) => setSlot(e.target.value)} /></div>
                  <div className="field"><label>&nbsp;</label><label className="tm-check"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} /> <span>{tt.published}</span></label></div>
                </div>
                <h4 className="st-h4"><Clock size={14} /> {tt.availability}</h4>
                <AvailabilityEditor rules={rules} onChange={setRules} dates={dates} onChangeDates={setDates} />
                <h4 className="st-h4">{tt.days_off}</h4>
                {off.length > 0 && <ul className="tm-off-list">{off.map((o) => <li key={o.id}><b dir="ltr">{o.off_date}</b>{o.note && <span> — {o.note}</span>}<button type="button" className="tm-icon-btn danger" onClick={() => removeOff(o.id)}><Trash size={15} /></button></li>)}</ul>}
                <div className="tm-off-add" style={{ gridTemplateColumns: 'auto auto' }}>
                  <DobInput iso value={newOff} onChange={setNewOff} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addOff} disabled={!newOff}><Plus size={15} /> {tt.add_off}</button>
                </div>
                <div className="tm-actions-row wrap">
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={saveTm}>{tt.save}</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setPw({ which: 'tm', value: '', done: false })}><KeyRound size={14} /> {tt.reset_pw}</button>
                  <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={revokeTm}><Unlink size={14} /> {tt.tm_revoke}</button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Control panel */}
      <div className={`st-card ${s.admin_id ? 'on' : ''}`}>
        <div className="st-card-head"><LayoutDashboard size={18} /> <h3>{tt.ad_title}</h3>{s.admin_id ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.off}</span>}</div>
        {!s.admin_id ? (
          <>
            <p className="muted">{tt.ad_off}</p>
            {!isSuper ? <p className="muted"><small>{tt.ad_super_only}</small></p> : (
              <>
                <div className="tm-mode-toggle" style={{ marginBottom: 10 }}>
                  <button type="button" className={ad.mode === 'link' ? 'active' : ''} onClick={() => setAd((p) => ({ ...p, mode: 'link' }))}><Link2 size={14} /> {tt.ad_link}</button>
                  <button type="button" className={ad.mode === 'create' ? 'active' : ''} onClick={() => setAd((p) => ({ ...p, mode: 'create' }))}><Plus size={14} /> {tt.ad_create}</button>
                </div>
                {ad.mode === 'link' ? (
                  <div className="field"><label>{tt.ad_pick}</label>
                    <select value={ad.admin_id} onChange={(e) => setAd((p) => ({ ...p, admin_id: e.target.value }))}>
                      <option value="">{tt.ad_pick}</option>
                      {admins.filter((a) => !linkedAdminIds.has(a.id)).map((a) => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    {s.user_id && <p className="muted st-note"><KeyRound size={13} /> {tt.same_login_tm}</p>}
                    <div className="field-row">
                      <div className="field"><label>{tt.ad_email}</label><input type="email" dir="ltr" value={ad.email} onChange={(e) => setAd((p) => ({ ...p, email: e.target.value }))} /></div>
                      <div className="field"><label>{s.user_id ? tt.set_other_pw : tt.ad_password}</label><input type="text" dir="ltr" value={ad.password} onChange={(e) => setAd((p) => ({ ...p, password: e.target.value }))} placeholder="6+" /></div>
                    </div>
                    <p className="muted"><small>{tt.ad_perm_hint}</small></p>
                  </>
                )}
                <div className="tm-actions-row"><button type="button" className="btn btn-primary" disabled={busy || (ad.mode === 'link' ? !ad.admin_id : !(ad.email && (ad.password || s.user_id)))} onClick={grantAd}><LayoutDashboard size={15} /> {tt.ad_grant}</button></div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="muted">{tt.ad_on}</p>
            <div className="st-kv"><span>{tt.ad_email}</span><b dir="ltr">{s.admin_email}</b></div>
            {adminRow && <div className="st-kv"><span>{tt.linked}</span><b>{adminRow.is_super ? tt.role_super : tt.role_staff}</b></div>}
            {isSuper && (
              <div className="tm-actions-row wrap">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setPw({ which: 'ad', value: '', done: false })}><KeyRound size={14} /> {tt.reset_pw}</button>
                <button type="button" className="btn btn-ghost btn-sm danger-text" title={tt.ad_unlink_hint} onClick={unlinkAd}><Unlink size={14} /> {tt.ad_unlink}</button>
              </div>
            )}
          </>
        )}
      </div>

      {pw.which && (
        <div className="st-card" style={{ gridColumn: '1 / -1' }}>
          {s.user_id && s.admin_id && <p className="muted st-note"><KeyRound size={13} /> {tt.pw_all}</p>}
          <div className="field-row" style={{ alignItems: 'end' }}>
            <div className="field"><label>{tt.new_pw}{!(s.user_id && s.admin_id) && <> — {pw.which === 'tm' ? tt.tm_title : tt.ad_title}</>}</label><input type="text" dir="ltr" value={pw.value} onChange={(e) => setPw((p) => ({ ...p, value: e.target.value }))} autoFocus /></div>
            <div className="tm-actions-row" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={setPassword}>{tt.save}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPw({ which: null, value: '', done: false })}>{tt.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
