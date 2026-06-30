import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Power, Pencil, Ticket, CalendarRange, Check } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';
import DateRangeCalendar from './DateRangeCalendar.jsx';

const T = {
  ar: {
    title: 'أكواد الخصم', hint: 'أنشئ أكواد خصم ترويجية مفعّلة من تاريخ إلى تاريخ على خدمات محددة.',
    add: 'كود جديد', empty: 'لا توجد أكواد خصم بعد.',
    th_code: 'الكود', th_discount: 'الخصم', th_period: 'الفترة', th_services: 'الخدمات', th_status: 'الحالة', th_actions: 'إجراءات',
    active: 'مفعّل', inactive: 'موقوف', all_services: 'كل الخدمات', selected: 'محددة', no_period: 'بدون حد',
    edit: 'تعديل', toggle: 'تفعيل/إيقاف', delete: 'حذف', confirm_delete: 'حذف هذا الكود؟',
    new_code: 'كود خصم جديد', edit_code: 'تعديل كود الخصم',
    code: 'الكود', code_ph: 'مثال: RAMADAN20', discount_type: 'نوع الخصم', percent: 'نسبة %', amount: 'مبلغ ثابت (ر.س)',
    value: 'قيمة الخصم', period: 'فترة التفعيل', pick_dates: 'اختر التواريخ', from: 'من', to: 'إلى',
    apply_to: 'يطبّق على', all: 'كل الخدمات', specific: 'خدمات محددة', choose_services: 'اختر الخدمات المشمولة',
    is_active: 'مفعّل', cancel: 'إلغاء', create: 'إنشاء', save: 'حفظ',
    code_required: 'أدخل الكود', code_taken: 'الكود مستخدم', need_dates: 'حدد فترة التفعيل', failed: 'تعذّر الحفظ',
  },
  en: {
    title: 'Promo Codes', hint: 'Create promotional discount codes active within a date range for selected services.',
    add: 'New code', empty: 'No promo codes yet.',
    th_code: 'Code', th_discount: 'Discount', th_period: 'Period', th_services: 'Services', th_status: 'Status', th_actions: 'Actions',
    active: 'Active', inactive: 'Off', all_services: 'All services', selected: 'Selected', no_period: 'No limit',
    edit: 'Edit', toggle: 'Activate / Suspend', delete: 'Delete', confirm_delete: 'Delete this code?',
    new_code: 'New promo code', edit_code: 'Edit promo code',
    code: 'Code', code_ph: 'e.g. RAMADAN20', discount_type: 'Discount type', percent: 'Percent %', amount: 'Fixed amount (SAR)',
    value: 'Discount value', period: 'Active period', pick_dates: 'Pick dates', from: 'From', to: 'To',
    apply_to: 'Applies to', all: 'All services', specific: 'Specific services', choose_services: 'Choose covered services',
    is_active: 'Active', cancel: 'Cancel', create: 'Create', save: 'Save',
    code_required: 'Enter a code', code_taken: 'Code already used', need_dates: 'Set the active period', failed: 'Could not save',
  },
};

const parseIds = (v) => { try { return Array.isArray(v) ? v : JSON.parse(v || '[]'); } catch { return []; } };
const fmt = (d) => (d ? String(d).slice(0, 10) : '');

export default function PromoCodesManager() {
  const { lang } = useLang();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null); // {mode, promo}

  const load = () => AdminAPI.promos().then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggle = async (p) => { await AdminAPI.setPromoActive(p.id, !p.is_active); load(); };
  const remove = async (p) => { if (confirm(tt.confirm_delete)) { await AdminAPI.deletePromo(p.id); load(); } };

  const discountText = (p) => (p.discount_type === 'amount' ? `${Number(p.discount_value)} ${lang === 'en' ? 'SAR' : 'ر.س'}` : `${Number(p.discount_value)}%`);
  const periodText = (p) => (p.starts_at || p.ends_at ? `${fmt(p.starts_at) || '…'} → ${fmt(p.ends_at) || '…'}` : tt.no_period);

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
            <thead><tr><th>{tt.th_code}</th><th>{tt.th_discount}</th><th>{tt.th_period}</th><th>{tt.th_services}</th><th>{tt.th_status}</th><th>{tt.th_actions}</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><span className="promo-code"><Ticket size={13} /> {p.code}</span></td>
                  <td>{discountText(p)}</td>
                  <td dir="ltr">{periodText(p)}</td>
                  <td>{p.all_services ? tt.all_services : `${tt.selected} (${parseIds(p.service_ids).length})`}</td>
                  <td>{p.is_active ? <span className="badge ok">{tt.active}</span> : <span className="badge off">{tt.inactive}</span>}</td>
                  <td className="row-actions">
                    <button onClick={() => setModal({ mode: 'edit', promo: p })} title={tt.edit}><Pencil size={16} /></button>
                    <button onClick={() => toggle(p)} title={tt.toggle}><Power size={16} /></button>
                    <button onClick={() => remove(p)} className="danger" title={tt.delete}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <PromoModal mode={modal.mode} promo={modal.promo} tt={tt} lang={lang} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
}

function PromoModal({ mode, promo, tt, lang, onClose, onDone }) {
  const isEdit = mode === 'edit';
  const [f, setF] = useState({
    code: promo?.code || '',
    discount_type: promo?.discount_type || 'percent',
    discount_value: promo?.discount_value ?? '',
    starts_at: fmt(promo?.starts_at) || '',
    ends_at: fmt(promo?.ends_at) || '',
    all_services: promo ? !!promo.all_services : true,
    service_ids: parseIds(promo?.service_ids),
    is_active: promo ? !!promo.is_active : true,
  });
  const [services, setServices] = useState([]);
  const [showCal, setShowCal] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { AdminAPI.services().then(setServices).catch(() => {}); }, []);

  const toggleSvc = (id) => setF((p) => ({ ...p, service_ids: p.service_ids.includes(id) ? p.service_ids.filter((x) => x !== id) : [...p.service_ids, id] }));

  const save = async () => {
    if (!f.code.trim()) { setError(tt.code_required); return; }
    if (!f.starts_at || !f.ends_at) { setError(tt.need_dates); return; }
    setBusy(true); setError('');
    const payload = {
      code: f.code.trim(), discount_type: f.discount_type, discount_value: Number(f.discount_value) || 0,
      starts_at: f.starts_at, ends_at: f.ends_at, all_services: f.all_services,
      service_ids: f.all_services ? [] : f.service_ids, is_active: f.is_active,
    };
    try {
      if (isEdit) await AdminAPI.updatePromo(promo.id, payload);
      else await AdminAPI.createPromo(payload);
      onDone();
    } catch (e) {
      setError(e?.response?.data?.error === 'code_taken' ? tt.code_taken : tt.failed);
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{isEdit ? tt.edit_code : tt.new_code}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="form-alert error">{error}</div>}

          <div className="field-row">
            <div className="field"><label>{tt.code}</label>
              <input dir="ltr" value={f.code} onChange={(e) => setF((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder={tt.code_ph} /></div>
            <div className="field"><label>{tt.discount_type}</label>
              <select value={f.discount_type} onChange={(e) => setF((p) => ({ ...p, discount_type: e.target.value }))}>
                <option value="percent">{tt.percent}</option>
                <option value="amount">{tt.amount}</option>
              </select></div>
          </div>

          <div className="field"><label>{tt.value}</label>
            <input type="number" dir="ltr" min="0" value={f.discount_value} onChange={(e) => setF((p) => ({ ...p, discount_value: e.target.value }))} /></div>

          <div className="field">
            <label>{tt.period}</label>
            <button type="button" className="promo-date-btn" onClick={() => setShowCal((s) => !s)}>
              <CalendarRange size={16} />
              {f.starts_at || f.ends_at ? <span dir="ltr">{f.starts_at || '…'} → {f.ends_at || '…'}</span> : <span>{tt.pick_dates}</span>}
            </button>
            {showCal && (
              <DateRangeCalendar
                start={f.starts_at} end={f.ends_at} lang={lang}
                onChange={({ start, end }) => setF((p) => ({ ...p, starts_at: start, ends_at: end }))}
                onDone={() => setShowCal(false)}
              />
            )}
          </div>

          <div className="field">
            <label>{tt.apply_to}</label>
            <div className="promo-applyto">
              <label className={`promo-radio ${f.all_services ? 'on' : ''}`}>
                <input type="radio" checked={f.all_services} onChange={() => setF((p) => ({ ...p, all_services: true }))} /> {tt.all}
              </label>
              <label className={`promo-radio ${!f.all_services ? 'on' : ''}`}>
                <input type="radio" checked={!f.all_services} onChange={() => setF((p) => ({ ...p, all_services: false }))} /> {tt.specific}
              </label>
            </div>
          </div>

          {!f.all_services && (
            <div className="field">
              <label>{tt.choose_services}</label>
              <div className="promo-svc-grid">
                {services.map((s) => (
                  <label key={s.id} className={`promo-svc ${f.service_ids.includes(s.id) ? 'on' : ''}`}>
                    <input type="checkbox" checked={f.service_ids.includes(s.id)} onChange={() => toggleSvc(s.id)} />
                    {lang === 'en' ? (s.title_en || s.title_ar) : s.title_ar}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="switch-label" onClick={() => setF((p) => ({ ...p, is_active: !p.is_active }))} style={{ marginTop: 6 }}>
            <Check size={16} /> {tt.is_active}{f.is_active ? ' ✓' : ''}
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '...' : (isEdit ? tt.save : tt.create)}</button>
        </div>
      </div>
    </div>
  );
}
