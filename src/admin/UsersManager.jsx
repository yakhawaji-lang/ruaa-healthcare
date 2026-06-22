import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Power, KeyRound, Pencil, ShieldCheck } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import { useLang } from '../i18n.jsx';

// pages and which actions each supports
const PAGES = [
  { key: 'dashboard', ar: 'لوحة التحكم', en: 'Dashboard', actions: ['view'] },
  { key: 'requests', ar: 'طلبات الخدمات', en: 'Service Requests', actions: ['view', 'edit', 'delete'] },
  { key: 'cases', ar: 'حالات التأمين', en: 'Insurance Cases', actions: ['view', 'edit', 'delete'] },
  { key: 'visits', ar: 'تقويم الزيارات', en: 'Visits Calendar', actions: ['view'] },
  { key: 'insurers', ar: 'شركات التأمين', en: 'Insurance Companies', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'clients', ar: 'حسابات العملاء', en: 'Client Accounts', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'hero', ar: 'السلايدر', en: 'Slider', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'partners', ar: 'الشركاء', en: 'Partners', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'services', ar: 'الخدمات', en: 'Services', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'pages', ar: 'الصفحات', en: 'Pages', actions: ['view', 'edit'] },
  { key: 'messages', ar: 'الرسائل', en: 'Messages', actions: ['view', 'delete'] },
  { key: 'settings', ar: 'الإعدادات', en: 'Settings', actions: ['view', 'edit'] },
];
const ACTIONS = ['view', 'create', 'edit', 'delete'];

const T = {
  ar: {
    title: 'إدارة المستخدمين', hint: 'إضافة مستخدمي لوحة التحكم وتخصيص صلاحياتهم على الصفحات والإجراءات.',
    add: 'مستخدم جديد', empty: 'لا يوجد مستخدمون.',
    th_name: 'الاسم', th_email: 'البريد', th_role: 'الدور', th_status: 'الحالة', th_actions: 'إجراءات',
    super: 'مدير عام', staff: 'موظف', active: 'مُفعّل', suspended: 'موقوف',
    edit: 'تعديل', reset_password: 'تغيير كلمة المرور', toggle: 'تفعيل/إيقاف', delete: 'حذف',
    confirm_delete: 'حذف هذا المستخدم؟', name: 'الاسم', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    password_ph: '6 أحرف على الأقل', full_access: 'صلاحية كاملة (مدير عام)',
    permissions: 'الصلاحيات التفصيلية', page: 'الصفحة',
    a_view: 'عرض', a_create: 'إضافة', a_edit: 'تعديل', a_delete: 'حذف',
    cancel: 'إلغاء', create: 'إنشاء', save: 'حفظ',
    new_password: 'كلمة المرور الجديدة', pw_done: 'تم تحديث كلمة المرور', pw_modal: 'تغيير كلمة المرور',
    new_user: 'مستخدم جديد', edit_user: 'تعديل المستخدم',
    email_taken: 'البريد مستخدم', weak: 'كلمة المرور قصيرة (6 أحرف)', failed: 'تعذّر الحفظ', required: 'أكمل الحقول المطلوبة',
    you: 'أنت',
  },
  en: {
    title: 'User Management', hint: 'Add control-panel users and customize their page & action permissions.',
    add: 'New user', empty: 'No users.',
    th_name: 'Name', th_email: 'Email', th_role: 'Role', th_status: 'Status', th_actions: 'Actions',
    super: 'Super admin', staff: 'Staff', active: 'Active', suspended: 'Suspended',
    edit: 'Edit', reset_password: 'Change password', toggle: 'Activate / Suspend', delete: 'Delete',
    confirm_delete: 'Delete this user?', name: 'Name', email: 'Email', password: 'Password',
    password_ph: 'At least 6 characters', full_access: 'Full access (super admin)',
    permissions: 'Detailed permissions', page: 'Page',
    a_view: 'View', a_create: 'Create', a_edit: 'Edit', a_delete: 'Delete',
    cancel: 'Cancel', create: 'Create', save: 'Save',
    new_password: 'New password', pw_done: 'Password updated', pw_modal: 'Change password',
    new_user: 'New user', edit_user: 'Edit user',
    email_taken: 'Email already in use', weak: 'Password too short (6 chars)', failed: 'Could not save', required: 'Please complete required fields',
    you: 'You',
  },
};

export default function UsersManager() {
  const { lang } = useLang();
  const { admin } = useAdminAuth();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null); // {mode:'create'|'edit', user}
  const [pwUser, setPwUser] = useState(null);

  const load = () => AdminAPI.admins().then(setList);
  useEffect(() => { load(); }, []);

  const toggle = async (u) => { await AdminAPI.setAdminActive(u.id, !u.is_active); load(); };
  const remove = async (u) => { if (confirm(tt.confirm_delete)) { try { await AdminAPI.deleteAdmin(u.id); load(); } catch { /* ignore */ } } };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{tt.title}</h1>
          <p className="page-hint">{tt.hint}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}><Plus size={18} /> {tt.add}</button>
      </div>

      <div className="panel">
        {list.length === 0 ? <p className="empty">{tt.empty}</p> : (
          <table className="admin-table">
            <thead><tr><th>{tt.th_name}</th><th>{tt.th_email}</th><th>{tt.th_role}</th><th>{tt.th_status}</th><th>{tt.th_actions}</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.id === admin.id ? ` (${tt.you})` : ''}</td>
                  <td dir="ltr">{u.email}</td>
                  <td>{u.is_super ? <span className="badge ok"><ShieldCheck size={12} /> {tt.super}</span> : <span className="badge">{tt.staff}</span>}</td>
                  <td>{u.is_active ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.suspended}</span>}</td>
                  <td className="row-actions">
                    <button onClick={() => setModal({ mode: 'edit', user: u })} title={tt.edit}><Pencil size={16} /></button>
                    <button onClick={() => setPwUser(u)} title={tt.reset_password}><KeyRound size={16} /></button>
                    {u.id !== admin.id && <button onClick={() => toggle(u)} title={tt.toggle}><Power size={16} /></button>}
                    {u.id !== admin.id && <button onClick={() => remove(u)} className="danger" title={tt.delete}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <UserModal mode={modal.mode} user={modal.user} tt={tt} lang={lang} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {pwUser && <PasswordModal user={pwUser} tt={tt} onClose={() => setPwUser(null)} />}
    </div>
  );
}

function emptyPerms() {
  const pages = {};
  PAGES.forEach((p) => { pages[p.key] = {}; });
  return { pages };
}

function UserModal({ mode, user, tt, lang, onClose, onDone }) {
  const isEdit = mode === 'edit';
  const [f, setF] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [isSuper, setIsSuper] = useState(isEdit ? !!user.is_super : false);
  const [perms, setPerms] = useState(() => {
    const base = emptyPerms();
    if (isEdit && user.permissions?.pages) {
      for (const k in user.permissions.pages) base.pages[k] = { ...user.permissions.pages[k] };
    }
    return base;
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const toggleAct = (page, action) => setPerms((pr) => {
    const cur = { ...(pr.pages[page] || {}) };
    cur[action] = !cur[action];
    if (action !== 'view' && cur[action]) cur.view = true; // any action implies view
    return { ...pr, pages: { ...pr.pages, [page]: cur } };
  });

  const save = async () => {
    if (!f.name || !f.email || (!isEdit && !f.password)) { setError(tt.required); return; }
    setBusy(true); setError('');
    const payload = { name: f.name, email: f.email, is_super: isSuper, permissions: perms };
    if (!isEdit) payload.password = f.password;
    try {
      if (isEdit) await AdminAPI.updateAdmin(user.id, payload);
      else await AdminAPI.createAdmin(payload);
      onDone();
    } catch (e) {
      const code = e?.response?.data?.error;
      setError(code === 'email_taken' ? tt.email_taken : code === 'weak_password' ? tt.weak : tt.failed);
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{isEdit ? tt.edit_user : tt.new_user}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}
          <div className="field-row">
            <div className="field"><label>{tt.name}</label><input value={f.name} onChange={set('name')} /></div>
            <div className="field"><label>{tt.email}</label><input type="email" dir="ltr" value={f.email} onChange={set('email')} /></div>
          </div>
          {!isEdit && <div className="field"><label>{tt.password}</label><input type="text" dir="ltr" value={f.password} onChange={set('password')} placeholder={tt.password_ph} /></div>}

          <label className="perm-super">
            <input type="checkbox" checked={isSuper} onChange={(e) => setIsSuper(e.target.checked)} />
            <span><ShieldCheck size={15} /> {tt.full_access}</span>
          </label>

          {!isSuper && (
            <>
              <div className="ed-section">{tt.permissions}</div>
              <div className="perm-table-wrap">
                <table className="perm-table">
                  <thead><tr><th>{tt.page}</th>{ACTIONS.map((a) => <th key={a}>{tt['a_' + a]}</th>)}</tr></thead>
                  <tbody>
                    {PAGES.map((p) => (
                      <tr key={p.key}>
                        <td className="perm-page">{lang === 'en' ? p.en : p.ar}</td>
                        {ACTIONS.map((a) => (
                          <td key={a} className="perm-cell">
                            {p.actions.includes(a)
                              ? <input type="checkbox" checked={!!perms.pages[p.key]?.[a]} onChange={() => toggleAct(p.key, a)} />
                              : <span className="perm-na">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : (isEdit ? tt.save : tt.create)}</button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ user, tt, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (password.length < 6) { setError(tt.weak); return; }
    setBusy(true); setError('');
    try { await AdminAPI.setAdminPassword(user.id, password); setDone(true); }
    catch { setError(tt.failed); } finally { setBusy(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.pw_modal}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {done ? <div className="form-alert ok">{tt.pw_done}</div> : (
            <>
              {error && <div className="form-alert error">{error}</div>}
              <p className="muted" style={{ marginTop: 0 }}>{user.name} — <span dir="ltr">{user.email}</span></p>
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
