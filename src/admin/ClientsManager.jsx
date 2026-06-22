import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Power, KeyRound, Pencil } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useAdminAuth } from './AdminApp.jsx';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    title: 'حسابات العملاء', hint: 'إدارة حسابات العملاء (الزوّار): الإضافة، التعديل، تغيير كلمة المرور، الإيقاف والحذف.',
    add: 'عميل جديد', empty: 'لا توجد حسابات عملاء بعد.',
    th_name: 'الاسم', th_email: 'البريد / الدخول', th_phone: 'الجوال', th_status: 'الحالة', th_actions: 'إجراءات',
    active: 'مُفعّل', suspended: 'موقوف', edit: 'تعديل', reset_password: 'تغيير كلمة المرور', toggle: 'تفعيل/إيقاف', delete: 'حذف',
    confirm_delete: 'حذف حساب العميل؟',
    name: 'الاسم', email: 'البريد الإلكتروني', phone: 'الجوال', password: 'كلمة المرور', password_ph: '6 أحرف على الأقل',
    cancel: 'إلغاء', create: 'إنشاء الحساب', save: 'حفظ',
    new_user: 'حساب عميل جديد', edit_user: 'تعديل حساب العميل',
    new_password: 'كلمة المرور الجديدة', pw_done: 'تم تحديث كلمة المرور', pw_modal: 'تغيير كلمة المرور',
    required: 'أكمل الحقول المطلوبة', email_taken: 'البريد مستخدم', weak: 'كلمة المرور قصيرة (6 أحرف)', failed: 'تعذّر الحفظ',
  },
  en: {
    title: 'Client Accounts', hint: 'Manage client (visitor) accounts: add, edit, change password, suspend and delete.',
    add: 'New client', empty: 'No client accounts yet.',
    th_name: 'Name', th_email: 'Email / Login', th_phone: 'Phone', th_status: 'Status', th_actions: 'Actions',
    active: 'Active', suspended: 'Suspended', edit: 'Edit', reset_password: 'Change password', toggle: 'Activate / Suspend', delete: 'Delete',
    confirm_delete: 'Delete this client account?',
    name: 'Name', email: 'Email', phone: 'Phone', password: 'Password', password_ph: 'At least 6 characters',
    cancel: 'Cancel', create: 'Create account', save: 'Save',
    new_user: 'New client account', edit_user: 'Edit client account',
    new_password: 'New password', pw_done: 'Password updated', pw_modal: 'Change password',
    required: 'Please complete required fields', email_taken: 'Email already in use', weak: 'Password too short (6 chars)', failed: 'Could not save',
  },
};

export default function ClientsManager() {
  const { lang } = useLang();
  const { can } = useAdminAuth();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null);
  const [pwUser, setPwUser] = useState(null);

  const load = () => AdminAPI.clients().then(setList);
  useEffect(() => { load(); }, []);

  const canCreate = can('clients', 'create');
  const canEdit = can('clients', 'edit');
  const canDelete = can('clients', 'delete');

  const toggle = async (u) => { await AdminAPI.setClientActive(u.id, !u.is_active); load(); };
  const remove = async (id) => { if (confirm(tt.confirm_delete)) { await AdminAPI.deleteClient(id); load(); } };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{tt.title}</h1>
          <p className="page-hint">{tt.hint}</p>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}><Plus size={18} /> {tt.add}</button>}
      </div>

      <div className="panel">
        {list.length === 0 ? <p className="empty">{tt.empty}</p> : (
          <table className="admin-table">
            <thead><tr><th>{tt.th_name}</th><th>{tt.th_email}</th><th>{tt.th_phone}</th><th>{tt.th_status}</th><th>{tt.th_actions}</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td dir="ltr">{u.email}</td>
                  <td dir="ltr">{u.phone || '—'}</td>
                  <td>{u.is_active ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.suspended}</span>}</td>
                  <td className="row-actions">
                    {canEdit && <button onClick={() => setModal({ mode: 'edit', user: u })} title={tt.edit}><Pencil size={16} /></button>}
                    {canEdit && <button onClick={() => setPwUser(u)} title={tt.reset_password}><KeyRound size={16} /></button>}
                    {canEdit && <button onClick={() => toggle(u)} title={tt.toggle}><Power size={16} /></button>}
                    {canDelete && <button onClick={() => remove(u.id)} className="danger" title={tt.delete}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ClientModal mode={modal.mode} user={modal.user} tt={tt} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {pwUser && <PasswordModal user={pwUser} tt={tt} onClose={() => setPwUser(null)} />}
    </div>
  );
}

function ClientModal({ mode, user, tt, onClose, onDone }) {
  const isEdit = mode === 'edit';
  const [f, setF] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    if (!f.name || !f.email || (!isEdit && !f.password)) { setError(tt.required); return; }
    setBusy(true); setError('');
    try {
      if (isEdit) await AdminAPI.updateClient(user.id, { name: f.name, email: f.email, phone: f.phone });
      else await AdminAPI.createClient(f);
      onDone();
    } catch (e) {
      const code = e?.response?.data?.error;
      setError(code === 'email_taken' ? tt.email_taken : code === 'weak_password' ? tt.weak : tt.failed);
    } finally { setBusy(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{isEdit ? tt.edit_user : tt.new_user}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}
          <div className="field"><label>{tt.name}</label><input value={f.name} onChange={set('name')} /></div>
          <div className="field-row">
            <div className="field"><label>{tt.email}</label><input type="email" dir="ltr" value={f.email} onChange={set('email')} /></div>
            <div className="field"><label>{tt.phone}</label><input dir="ltr" value={f.phone} onChange={set('phone')} /></div>
          </div>
          {!isEdit && <div className="field"><label>{tt.password}</label><input type="text" dir="ltr" value={f.password} onChange={set('password')} placeholder={tt.password_ph} /></div>}
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
    try { await AdminAPI.setClientPassword(user.id, password); setDone(true); }
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
