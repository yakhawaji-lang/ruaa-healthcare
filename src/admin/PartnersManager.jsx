import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import ImageUpload from './ImageUpload.jsx';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    confirm_delete: 'حذف هذا الشريك؟',
    need_logo: 'الرجاء رفع شعار الشريك.',
    partners_title: 'الشركاء وشركات التأمين',
    partners_hint: 'شعارات الشركاء التي تظهر في قسم «شركاؤنا» بالصفحة الرئيسية.',
    new_partner: 'شريك جديد',
    empty: 'لا يوجد شركاء بعد. أضف أول شريك.',
    no_logo: 'بدون شعار',
    hidden: 'مخفي',
    edit: 'تعديل',
    delete: 'حذف',
    edit_partner: 'تعديل شريك',
    logo_label: 'شعار الشريك (PNG بخلفية شفافة مفضّل)',
    name_ar: 'اسم الشركة (عربي)',
    name_ar_ph: 'مثال: التعاونية للتأمين',
    name_en: 'Company name (English)',
    url_label: 'رابط الموقع (اختياري)',
    sort_order: 'الترتيب',
    visible: 'ظاهر',
    cancel: 'إلغاء',
    save: 'حفظ',
  },
  en: {
    confirm_delete: 'Delete this partner?',
    need_logo: 'Please upload the partner logo.',
    partners_title: 'Partners & Insurance Companies',
    partners_hint: 'Partner logos shown in the "Our Partners" section on the home page.',
    new_partner: 'New partner',
    empty: 'No partners yet. Add the first one.',
    no_logo: 'No logo',
    hidden: 'Hidden',
    edit: 'Edit',
    delete: 'Delete',
    edit_partner: 'Edit partner',
    logo_label: 'Partner logo (PNG with transparent background preferred)',
    name_ar: 'Company name (Arabic)',
    name_ar_ph: 'e.g. Tawuniya Insurance',
    name_en: 'Company name (English)',
    url_label: 'Website link (optional)',
    sort_order: 'Sort order',
    visible: 'Visible',
    cancel: 'Cancel',
    save: 'Save',
  },
};

const blank = { name_ar: '', name_en: '', logo: '', url: '', is_published: 1, sort_order: 0 };

export default function PartnersManager() {
  const { lang, pick } = useLang();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => AdminAPI.partners().then((r) => { setList(r); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...blank, sort_order: list.length });
  const remove = async (id) => {
    if (!confirm(tt.confirm_delete)) return;
    await AdminAPI.deletePartner(id); load();
  };
  const save = async () => {
    if (!editing.logo) { alert(tt.need_logo); return; }
    if (editing.id) await AdminAPI.updatePartner(editing.id, editing);
    else await AdminAPI.createPartner(editing);
    setEditing(null); load();
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{tt.partners_title}</h1>
          <p className="page-hint">{tt.partners_hint}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> {tt.new_partner}</button>
      </div>

      {list.length === 0 && <div className="panel empty">{tt.empty}</div>}

      <div className="slides-grid">
        {list.map((p) => (
          <div key={p.id} className="slide-card">
            <div className="slide-thumb partner-thumb">
              {p.logo ? <img src={p.logo} alt="" /> : <span className="img-empty">{tt.no_logo}</span>}
              {!p.is_published && <span className="slide-hidden">{tt.hidden}</span>}
            </div>
            <div className="slide-card-body">
              <strong>{pick(p, 'name') || p.name_ar || p.name_en || '—'}</strong>
              {p.url && <small dir="ltr">{p.url}</small>}
            </div>
            <div className="slide-card-actions">
              <button onClick={() => setEditing(p)} title={tt.edit}><Pencil size={16} /></button>
              <button onClick={() => remove(p.id)} title={tt.delete} className="danger"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && <PartnerEditor data={editing} setData={setEditing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function PartnerEditor({ data, setData, onClose, onSave }) {
  const { lang } = useLang();
  const tt = T[lang];
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{data.id ? tt.edit_partner : tt.new_partner}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <ImageUpload value={data.logo} onChange={(url) => set('logo', url)} label={tt.logo_label} height={150} />

          <div className="field-row">
            <div className="field"><label>{tt.name_ar}</label>
              <input value={data.name_ar} onChange={(e) => set('name_ar', e.target.value)} placeholder={tt.name_ar_ph} /></div>
            <div className="field"><label>{tt.name_en}</label>
              <input dir="ltr" value={data.name_en} onChange={(e) => set('name_en', e.target.value)} /></div>
          </div>
          <div className="field"><label>{tt.url_label}</label>
            <input dir="ltr" value={data.url} onChange={(e) => set('url', e.target.value)} placeholder="https://..." /></div>
          <div className="field-row">
            <div className="field"><label>{tt.sort_order}</label>
              <input type="number" value={data.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} /></div>
            <div className="field checkbox-field">
              <label className="switch-label" onClick={() => set('is_published', data.is_published ? 0 : 1)}>
                {data.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                {data.is_published ? tt.visible : tt.hidden}
              </label>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={onSave}><Save size={16} /> {tt.save}</button>
        </div>
      </div>
    </div>
  );
}
