import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { iconKeys } from '../components/ServiceIcon.jsx';
import ServiceIcon from '../components/ServiceIcon.jsx';
import ImageUpload from './ImageUpload.jsx';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    confirm_delete: 'حذف هذه الخدمة؟',
    manage_services: 'إدارة الخدمات',
    new_service: 'خدمة جديدة',
    title_ar: 'العنوان (ع)',
    title_en: 'العنوان (En)',
    status: 'الحالة',
    actions: 'إجراءات',
    published: 'منشور',
    hidden: 'مخفي',
    edit: 'تعديل',
    delete: 'حذف',
    edit_service: 'تعديل خدمة',
    title_arabic: 'العنوان بالعربية',
    title_english: 'العنوان بالإنجليزية',
    slug: 'المعرّف (slug)',
    icon: 'الأيقونة',
    service_image: 'صورة الخدمة',
    price_label: 'السعر (ر.س) — اتركه فارغًا لـ«حسب التقييم»',
    price_note_ar_label: 'نص السعر (عربي)',
    price_note_ar_ph: 'تبدأ من',
    content_arabic: 'المحتوى بالعربية',
    content_english: 'المحتوى بالإنجليزية',
    line_ar: 'سطر',
    line_en: 'Line',
    sort_order: 'الترتيب',
    cancel: 'إلغاء',
    save: 'حفظ',
  },
  en: {
    confirm_delete: 'Delete this service?',
    manage_services: 'Manage Services',
    new_service: 'New service',
    title_ar: 'Title (AR)',
    title_en: 'Title (EN)',
    status: 'Status',
    actions: 'Actions',
    published: 'Published',
    hidden: 'Hidden',
    edit: 'Edit',
    delete: 'Delete',
    edit_service: 'Edit service',
    title_arabic: 'Title (Arabic)',
    title_english: 'Title (English)',
    slug: 'Slug',
    icon: 'Icon',
    service_image: 'Service image',
    price_label: 'Price (SAR) — leave empty for "Based on assessment"',
    price_note_ar_label: 'Price note (Arabic)',
    price_note_ar_ph: 'Starting from',
    content_arabic: 'Content (Arabic)',
    content_english: 'Content (English)',
    line_ar: 'Line',
    line_en: 'Line',
    sort_order: 'Sort order',
    cancel: 'Cancel',
    save: 'Save',
  },
};

const blank = { slug: '', icon: 'stethoscope', image: '', price: '', price_note_ar: 'تبدأ من', price_note_en: 'Starting from', title_ar: '', title_en: '', body_ar: [''], body_en: [''], is_published: 1, sort_order: 0 };

export default function ServicesManager() {
  const { lang } = useLang();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // service object or null
  const [loading, setLoading] = useState(true);

  const load = () => AdminAPI.services().then((r) => { setList(r); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...blank, body_ar: [''], body_en: [''] });
  const openEdit = async (id) => {
    const s = await AdminAPI.service(id);
    setEditing({ ...s, body_ar: s.body_ar?.length ? s.body_ar : [''], body_en: s.body_en?.length ? s.body_en : [''] });
  };

  const remove = async (id) => {
    if (!confirm(tt.confirm_delete)) return;
    await AdminAPI.deleteService(id);
    load();
  };

  const save = async () => {
    const payload = {
      ...editing,
      body_ar: editing.body_ar.filter((l) => l.trim()),
      body_en: editing.body_en.filter((l) => l.trim()),
    };
    if (editing.id) await AdminAPI.updateService(editing.id, payload);
    else await AdminAPI.createService(payload);
    setEditing(null);
    load();
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{tt.manage_services}</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> {tt.new_service}</button>
      </div>

      <div className="panel">
        <table className="admin-table">
          <thead><tr><th></th><th>{tt.title_ar}</th><th>{tt.title_en}</th><th>{tt.status}</th><th>{tt.actions}</th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td>{s.image ? <img className="tbl-thumb" src={s.image} alt="" /> : <span className="tbl-icon"><ServiceIcon name={s.icon} size={20} /></span>}</td>
                <td>{s.title_ar}</td>
                <td dir="ltr">{s.title_en}</td>
                <td>{s.is_published ? <span className="badge ok">{tt.published}</span> : <span className="badge off">{tt.hidden}</span>}</td>
                <td className="row-actions">
                  <button onClick={() => openEdit(s.id)} title={tt.edit}><Pencil size={16} /></button>
                  <button onClick={() => remove(s.id)} title={tt.delete} className="danger"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ServiceEditor data={editing} setData={setEditing} onClose={() => setEditing(null)} onSave={save} />
      )}
    </div>
  );
}

function ServiceEditor({ data, setData, onClose, onSave }) {
  const { lang } = useLang();
  const tt = T[lang];
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const setLine = (field, i, v) => setData((d) => { const arr = [...d[field]]; arr[i] = v; return { ...d, [field]: arr }; });
  const addLine = (field) => setData((d) => ({ ...d, [field]: [...d[field], ''] }));
  const delLine = (field, i) => setData((d) => ({ ...d, [field]: d[field].filter((_, idx) => idx !== i) }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{data.id ? tt.edit_service : tt.new_service}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="field-row">
            <div className="field"><label>{tt.title_arabic}</label>
              <input value={data.title_ar} onChange={(e) => set('title_ar', e.target.value)} /></div>
            <div className="field"><label>{tt.title_english}</label>
              <input dir="ltr" value={data.title_en} onChange={(e) => set('title_en', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.slug}</label>
              <input dir="ltr" value={data.slug} onChange={(e) => set('slug', e.target.value)} placeholder="medical-supervision" /></div>
            <div className="field"><label>{tt.icon}</label>
              <select value={data.icon} onChange={(e) => set('icon', e.target.value)}>
                {iconKeys.map((k) => <option key={k} value={k}>{k}</option>)}
              </select></div>
          </div>

          <ImageUpload value={data.image} onChange={(url) => set('image', url)} label={tt.service_image} />

          <div className="field-row">
            <div className="field"><label>{tt.price_label}</label>
              <input type="number" dir="ltr" value={data.price ?? ''} onChange={(e) => set('price', e.target.value)} /></div>
            <div className="field"><label>{tt.price_note_ar_label}</label>
              <input value={data.price_note_ar || ''} onChange={(e) => set('price_note_ar', e.target.value)} placeholder={tt.price_note_ar_ph} /></div>
          </div>

          <div className="dual-editor">
            <div>
              <label className="block-label">{tt.content_arabic}</label>
              {data.body_ar.map((line, i) => (
                <div key={i} className="line-row">
                  <textarea rows={2} value={line} onChange={(e) => setLine('body_ar', i, e.target.value)} dir="rtl" />
                  <button onClick={() => delLine('body_ar', i)} className="line-del"><X size={14} /></button>
                </div>
              ))}
              <button className="add-line" onClick={() => addLine('body_ar')}><Plus size={14} /> {tt.line_ar}</button>
            </div>
            <div>
              <label className="block-label">{tt.content_english}</label>
              {data.body_en.map((line, i) => (
                <div key={i} className="line-row">
                  <textarea rows={2} value={line} onChange={(e) => setLine('body_en', i, e.target.value)} dir="ltr" />
                  <button onClick={() => delLine('body_en', i)} className="line-del"><X size={14} /></button>
                </div>
              ))}
              <button className="add-line" onClick={() => addLine('body_en')}><Plus size={14} /> {tt.line_en}</button>
            </div>
          </div>

          <div className="field-row">
            <div className="field"><label>{tt.sort_order}</label>
              <input type="number" value={data.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} /></div>
            <div className="field checkbox-field">
              <label className="switch-label" onClick={() => set('is_published', data.is_published ? 0 : 1)}>
                {data.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                {data.is_published ? tt.published : tt.hidden}
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
