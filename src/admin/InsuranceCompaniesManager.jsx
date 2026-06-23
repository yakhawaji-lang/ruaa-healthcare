import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Power, KeyRound, Pencil, Check, Users2, UserPlus } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import { isSaudiMobile, digits10 } from '../validation.js';

const T = {
  ar: {
    confirm_delete: 'حذف حساب شركة التأمين؟',
    title: 'شركات التأمين',
    hint: 'تُنشأ حسابات شركات التأمين من هنا فقط (لا تسجيل ذاتي).',
    new_company: 'شركة تأمين جديدة',
    empty: 'لا توجد حسابات تأمين بعد.',
    th_company: 'الشركة',
    th_email: 'البريد',
    th_phone: 'الجوال',
    th_status: 'الحالة',
    th_actions: 'إجراءات',
    active: 'مُفعّل',
    suspended: 'موقوف',
    toggle: 'تفعيل/إيقاف',
    reset_password: 'تغيير كلمة المرور',
    edit: 'تعديل',
    delete: 'حذف',
    edit_modal_title: 'تعديل شركة التأمين',
    services_section: 'الخدمات المتعاقد عليها',
    services_hint: 'حدّد الخدمات المسموح لهذه الشركة بطلبها. إن لم تُحدَّد أي خدمة فيُسمح بكل الخدمات.',
    select_all: 'تحديد الكل',
    clear_all: 'مسح الكل',
    saved_ok: 'تم حفظ التعديلات',
    update_failed: 'تعذّر حفظ التعديلات',
    pw_modal_title: 'تغيير كلمة مرور الشركة',
    new_password: 'كلمة المرور الجديدة',
    pw_done: 'تم تحديث كلمة المرور بنجاح',
    pw_weak: 'كلمة المرور قصيرة (6 أحرف على الأقل)',
    pw_failed: 'تعذّر تحديث كلمة المرور',
    save: 'حفظ',
    modal_title: 'حساب شركة تأمين جديد',
    complete_required: 'أكمل الحقول المطلوبة',
    email_taken: 'البريد مستخدم',
    create_failed: 'تعذّر الإنشاء',
    company_name: 'اسم الشركة',
    email_login: 'البريد الإلكتروني (للدخول)',
    phone: 'الجوال',
    phone_invalid: 'رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05.',
    members: 'المستخدمون',
    password: 'كلمة المرور',
    password_ph: '6 أحرف على الأقل',
    cancel: 'إلغاء',
    create_account: 'إنشاء الحساب',
  },
  en: {
    confirm_delete: 'Delete this insurance company account?',
    title: 'Insurance Companies',
    hint: 'Insurance company accounts are created here only (no self sign-up).',
    new_company: 'New insurance company',
    empty: 'No insurance accounts yet.',
    th_company: 'Company',
    th_email: 'Email',
    th_phone: 'Phone',
    th_status: 'Status',
    th_actions: 'Actions',
    active: 'Active',
    suspended: 'Suspended',
    toggle: 'Activate / Suspend',
    reset_password: 'Change password',
    edit: 'Edit',
    delete: 'Delete',
    edit_modal_title: 'Edit insurance company',
    services_section: 'Contracted services',
    services_hint: 'Select the services this company is allowed to request. If none are selected, all services are allowed.',
    select_all: 'Select all',
    clear_all: 'Clear all',
    saved_ok: 'Changes saved',
    update_failed: 'Could not save changes',
    pw_modal_title: 'Change company password',
    new_password: 'New password',
    pw_done: 'Password updated successfully',
    pw_weak: 'Password is too short (at least 6 characters)',
    pw_failed: 'Could not update the password',
    save: 'Save',
    modal_title: 'New insurance company account',
    complete_required: 'Please complete the required fields',
    email_taken: 'Email already in use',
    create_failed: 'Could not create account',
    company_name: 'Company name',
    email_login: 'Email (for login)',
    phone: 'Phone',
    phone_invalid: 'Mobile number must be 10 digits starting with 05.',
    members: 'Members',
    password: 'Password',
    password_ph: 'At least 6 characters',
    cancel: 'Cancel',
    create_account: 'Create account',
  },
};

export default function InsuranceCompaniesManager() {
  const { lang } = useLang();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [pwUser, setPwUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [membersUser, setMembersUser] = useState(null);

  const load = () => AdminAPI.insurers().then(setList);
  useEffect(() => { load(); }, []);

  const toggle = async (u) => { await AdminAPI.setInsurerActive(u.id, !u.is_active); load(); };
  const remove = async (id) => { if (confirm(tt.confirm_delete)) { await AdminAPI.deleteInsurer(id); load(); } };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{tt.title}</h1>
          <p className="page-hint">{tt.hint}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> {tt.new_company}</button>
      </div>

      <div className="panel">
        {list.length === 0 ? <p className="empty">{tt.empty}</p> : (
          <table className="admin-table">
            <thead><tr><th>{tt.th_company}</th><th>{tt.th_email}</th><th>{tt.th_phone}</th><th>{tt.th_status}</th><th>{tt.th_actions}</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.company_name || u.name}</td>
                  <td dir="ltr">{u.email}</td>
                  <td dir="ltr">{u.phone || '—'}</td>
                  <td>{u.is_active ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.suspended}</span>}</td>
                  <td className="row-actions">
                    <button onClick={() => setMembersUser(u)} title={tt.members}><Users2 size={16} /></button>
                    <button onClick={() => setEditUser(u)} title={tt.edit}><Pencil size={16} /></button>
                    <button onClick={() => setPwUser(u)} title={tt.reset_password}><KeyRound size={16} /></button>
                    <button onClick={() => toggle(u)} title={tt.toggle}><Power size={16} /></button>
                    <button onClick={() => remove(u.id)} className="danger" title={tt.delete}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && <InsurerModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />}
      {pwUser && <PasswordModal user={pwUser} onClose={() => setPwUser(null)} />}
      {editUser && <EditInsurerModal user={editUser} onClose={() => setEditUser(null)} onDone={() => { setEditUser(null); load(); }} />}
      {membersUser && <MembersModal company={membersUser} onClose={() => setMembersUser(null)} />}
    </div>
  );
}

function MembersModal({ company, onClose }) {
  const { lang } = useLang();
  const L = lang === 'en' ? {
    title: 'Members of', subtitle: 'These accounts log in and share the same company cases.',
    name: 'Name', email: 'Email (login)', phone: 'Phone', password: 'Password', password_ph: 'At least 6 characters',
    add: 'Add member', no_members: 'No additional members yet.', active: 'Active', suspended: 'Suspended',
    toggle: 'Activate / Suspend', delete: 'Delete', confirm_delete: 'Delete this member?', close: 'Close',
    required: 'Please complete the required fields', email_taken: 'Email already in use', phone_invalid: 'Mobile number must be 10 digits starting with 05.', failed: 'Could not save',
  } : {
    title: 'مستخدمو', subtitle: 'هذه الحسابات تسجّل الدخول وتتشارك نفس حالات الشركة.',
    name: 'الاسم', email: 'البريد (للدخول)', phone: 'الجوال', password: 'كلمة المرور', password_ph: '6 أحرف على الأقل',
    add: 'إضافة مستخدم', no_members: 'لا يوجد مستخدمون إضافيون بعد.', active: 'مُفعّل', suspended: 'موقوف',
    toggle: 'تفعيل/إيقاف', delete: 'حذف', confirm_delete: 'حذف هذا المستخدم؟', close: 'إغلاق',
    required: 'أكمل الحقول المطلوبة', email_taken: 'البريد مستخدم', phone_invalid: 'رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05.', failed: 'تعذّر الحفظ',
  };
  const [members, setMembers] = useState([]);
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => AdminAPI.insurerMembers(company.id).then(setMembers).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!f.name || !f.email || !f.password) { setError(L.required); return; }
    if (f.phone && !isSaudiMobile(f.phone)) { setError(L.phone_invalid); return; }
    setBusy(true); setError('');
    try {
      await AdminAPI.createInsurerMember(company.id, f);
      setF({ name: '', email: '', phone: '', password: '' }); load();
    } catch (e) {
      setError(e?.response?.data?.error === 'email_taken' ? L.email_taken : L.failed);
    } finally { setBusy(false); }
  };
  const toggle = async (m) => { await AdminAPI.setInsurerActive(m.id, !m.is_active); load(); };
  const remove = async (m) => { if (confirm(L.confirm_delete)) { await AdminAPI.deleteInsurer(m.id); load(); } };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{L.title} {company.company_name || company.name}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          <p className="page-hint" style={{ marginTop: 0 }}>{L.subtitle}</p>
          {error && <div className="form-alert error">{error}</div>}

          {members.length > 0 && (
            <table className="admin-table" style={{ marginBottom: 18 }}>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}<br /><small dir="ltr" className="muted">{m.email}</small></td>
                    <td>{m.is_active ? <span className="badge ok">{L.active}</span> : <span className="badge off">{L.suspended}</span>}</td>
                    <td className="row-actions">
                      <button onClick={() => toggle(m)} title={L.toggle}><Power size={16} /></button>
                      <button onClick={() => remove(m)} className="danger" title={L.delete}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {members.length === 0 && <p className="empty" style={{ padding: '14px 0' }}>{L.no_members}</p>}

          <div className="admin-update-box">
            <div className="field-row">
              <div className="field"><label>{L.name}</label><input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="field"><label>{L.email}</label><input type="email" dir="ltr" value={f.email} onChange={(e) => setF((p) => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>{L.phone}</label><input dir="ltr" inputMode="numeric" maxLength={10} placeholder="05XXXXXXXX" value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} /></div>
              <div className="field"><label>{L.password}</label><input type="text" dir="ltr" value={f.password} onChange={(e) => setF((p) => ({ ...p, password: e.target.value }))} placeholder={L.password_ph} /></div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={add} disabled={busy}><UserPlus size={15} /> {busy ? '...' : L.add}</button>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{L.close}</button>
        </div>
      </div>
    </div>
  );
}

function EditInsurerModal({ user, onClose, onDone }) {
  const { lang, pick } = useLang();
  const tt = T[lang];
  const [f, setF] = useState({ company_name: user.company_name || user.name || '', email: user.email || '', phone: user.phone || '' });
  const [services, setServices] = useState([]);
  const [sel, setSel] = useState(new Set());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    AdminAPI.services().then(setServices).catch(() => {});
    AdminAPI.insurerServices(user.id).then((ids) => setSel(new Set((ids || []).map(Number)))).catch(() => {});
  }, [user.id]);

  const toggleSvc = (id) => setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = async () => {
    if (!f.company_name || !f.email) { setError(tt.complete_required); return; }
    if (f.phone && !isSaudiMobile(f.phone)) { setError(tt.phone_invalid); return; }
    setBusy(true); setError('');
    try {
      await AdminAPI.updateInsurer(user.id, f);
      await AdminAPI.setInsurerServices(user.id, [...sel]);
      onDone();
    } catch (e) {
      setError(e?.response?.data?.error === 'email_taken' ? tt.email_taken : tt.update_failed);
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.edit_modal_title}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}
          <div className="field"><label>{tt.company_name}</label><input value={f.company_name} onChange={set('company_name')} /></div>
          <div className="field-row">
            <div className="field"><label>{tt.email_login}</label><input type="email" dir="ltr" value={f.email} onChange={set('email')} /></div>
            <div className="field"><label>{tt.phone}</label><input dir="ltr" inputMode="numeric" maxLength={10} placeholder="05XXXXXXXX" value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} /></div>
          </div>

          <div className="ed-section" style={{ marginTop: 6 }}>{tt.services_section}</div>
          <p className="muted" style={{ marginTop: 0 }}>{tt.services_hint}</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSel(new Set(services.map((s) => s.id)))}>{tt.select_all}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSel(new Set())}>{tt.clear_all}</button>
          </div>
          <div className="svc-check-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
            {services.map((s) => {
              const on = sel.has(s.id);
              return (
                <button type="button" key={s.id} onClick={() => toggleSvc(s.id)}
                  className="svc-check"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 10, cursor: 'pointer',
                    border: on ? '1px solid var(--teal)' : '1px solid var(--line)', background: on ? 'var(--teal-light)' : '#fff',
                    color: 'var(--navy)', fontFamily: 'inherit', fontWeight: 600, textAlign: 'start' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, display: 'grid', placeItems: 'center', flex: '0 0 auto',
                    border: on ? 'none' : '1px solid var(--line)', background: on ? 'var(--teal)' : '#fff', color: '#fff' }}>
                    {on && <Check size={13} />}
                  </span>
                  <span>{pick(s, 'title')}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : tt.save}</button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ user, onClose }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (password.length < 6) { setError(tt.pw_weak); return; }
    setBusy(true); setError('');
    try { await AdminAPI.setInsurerPassword(user.id, password); setDone(true); }
    catch (e) { setError(e?.response?.data?.error === 'weak_password' ? tt.pw_weak : tt.pw_failed); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.pw_modal_title}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {done ? (
            <div className="form-alert ok">{tt.pw_done}</div>
          ) : (
            <>
              {error && <div className="form-alert error">{error}</div>}
              <p className="muted" style={{ marginTop: 0 }}>{user.company_name || user.name} — <span dir="ltr">{user.email}</span></p>
              <div className="field"><label>{tt.new_password}</label>
                <input type="text" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tt.password_ph} autoFocus /></div>
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          {!done && <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : tt.save}</button>}
        </div>
      </div>
    </div>
  );
}

function InsurerModal({ onClose, onDone }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [f, setF] = useState({ company_name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!f.company_name || !f.email || !f.password) { setError(tt.complete_required); return; }
    if (f.phone && !isSaudiMobile(f.phone)) { setError(tt.phone_invalid); return; }
    setBusy(true); setError('');
    try { await AdminAPI.createInsurer(f); onDone(); }
    catch (e) { setError(e?.response?.data?.error === 'email_taken' ? tt.email_taken : tt.create_failed); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.modal_title}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}
          <div className="field"><label>{tt.company_name}</label><input value={f.company_name} onChange={set('company_name')} /></div>
          <div className="field-row">
            <div className="field"><label>{tt.email_login}</label><input type="email" dir="ltr" value={f.email} onChange={set('email')} /></div>
            <div className="field"><label>{tt.phone}</label><input dir="ltr" inputMode="numeric" maxLength={10} placeholder="05XXXXXXXX" value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: digits10(e.target.value) }))} /></div>
          </div>
          <div className="field"><label>{tt.password}</label><input type="text" dir="ltr" value={f.password} onChange={set('password')} placeholder={tt.password_ph} /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : tt.create_account}</button>
        </div>
      </div>
    </div>
  );
}
