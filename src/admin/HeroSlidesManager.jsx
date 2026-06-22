import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff, GripVertical } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import ImageUpload from './ImageUpload.jsx';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    confirm_delete: 'حذف هذه الشريحة؟',
    slider_title: 'سلايدر الصفحة الرئيسية',
    slider_hint: 'تحكّم في صور الشريحة المتحركة وعباراتها الدعائية. عدد الشرائح غير محدود.',
    new_slide: 'شريحة جديدة',
    empty: 'لا توجد شرائح بعد. أضف أول شريحة.',
    no_image: 'بدون صورة',
    hidden: 'مخفية',
    edit: 'تعديل',
    delete: 'حذف',
    edit_slide: 'تعديل شريحة',
    slide_image: 'صورة الشريحة',
    title_ar: 'العنوان الدعائي (عربي)',
    title_ar_ph: 'خدمات مرنة تناسب احتياجك الصحي',
    title_en: 'Title (English)',
    subtitle_ar: 'الوصف (عربي)',
    subtitle_en: 'Subtitle (English)',
    badge_ar: 'الشارة العلوية (عربي)',
    badge_ar_ph: 'مقدم الرعاية الأول...',
    badge_en: 'Badge (English)',
    sort_order: 'الترتيب',
    visible: 'ظاهرة',
    cancel: 'إلغاء',
    save: 'حفظ',
  },
  en: {
    confirm_delete: 'Delete this slide?',
    slider_title: 'Home Page Slider',
    slider_hint: 'Manage the carousel images and their promotional captions. Unlimited number of slides.',
    new_slide: 'New slide',
    empty: 'No slides yet. Add the first one.',
    no_image: 'No image',
    hidden: 'Hidden',
    edit: 'Edit',
    delete: 'Delete',
    edit_slide: 'Edit slide',
    slide_image: 'Slide image',
    title_ar: 'Headline (Arabic)',
    title_ar_ph: 'Flexible services that fit your health needs',
    title_en: 'Title (English)',
    subtitle_ar: 'Subtitle (Arabic)',
    subtitle_en: 'Subtitle (English)',
    badge_ar: 'Top badge (Arabic)',
    badge_ar_ph: 'The leading care provider...',
    badge_en: 'Badge (English)',
    sort_order: 'Sort order',
    visible: 'Visible',
    cancel: 'Cancel',
    save: 'Save',
  },
};

const blank = {
  image: '', title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '',
  badge_ar: '', badge_en: '', is_published: 1, sort_order: 0,
};

export default function HeroSlidesManager() {
  const { lang, pick } = useLang();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => AdminAPI.heroSlides().then((r) => { setList(r); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...blank, sort_order: list.length });
  const openEdit = async (id) => setEditing(await AdminAPI.heroSlide(id));
  const remove = async (id) => {
    if (!confirm(tt.confirm_delete)) return;
    await AdminAPI.deleteHeroSlide(id); load();
  };
  const save = async () => {
    if (editing.id) await AdminAPI.updateHeroSlide(editing.id, editing);
    else await AdminAPI.createHeroSlide(editing);
    setEditing(null); load();
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{tt.slider_title}</h1>
          <p className="page-hint">{tt.slider_hint}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> {tt.new_slide}</button>
      </div>

      {list.length === 0 && <div className="panel empty">{tt.empty}</div>}

      <div className="slides-grid">
        {list.map((sl) => (
          <div key={sl.id} className="slide-card">
            <div className="slide-thumb">
              {sl.image ? <img src={sl.image} alt="" /> : <span className="img-empty">{tt.no_image}</span>}
              {!sl.is_published && <span className="slide-hidden">{tt.hidden}</span>}
            </div>
            <div className="slide-card-body">
              <strong>{pick(sl, 'title') || '—'}</strong>
              <small>{pick(sl, 'subtitle')?.slice(0, 60)}</small>
            </div>
            <div className="slide-card-actions">
              <button onClick={() => openEdit(sl.id)} title={tt.edit}><Pencil size={16} /></button>
              <button onClick={() => remove(sl.id)} title={tt.delete} className="danger"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && <SlideEditor data={editing} setData={setEditing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function SlideEditor({ data, setData, onClose, onSave }) {
  const { lang } = useLang();
  const tt = T[lang];
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{data.id ? tt.edit_slide : tt.new_slide}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <ImageUpload value={data.image} onChange={(url) => set('image', url)} label={tt.slide_image} height={170} />

          <div className="field-row">
            <div className="field"><label>{tt.title_ar}</label>
              <input value={data.title_ar} onChange={(e) => set('title_ar', e.target.value)} placeholder={tt.title_ar_ph} /></div>
            <div className="field"><label>{tt.title_en}</label>
              <input dir="ltr" value={data.title_en} onChange={(e) => set('title_en', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.subtitle_ar}</label>
              <textarea rows={2} value={data.subtitle_ar} onChange={(e) => set('subtitle_ar', e.target.value)} /></div>
            <div className="field"><label>{tt.subtitle_en}</label>
              <textarea rows={2} dir="ltr" value={data.subtitle_en} onChange={(e) => set('subtitle_en', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>{tt.badge_ar}</label>
              <input value={data.badge_ar} onChange={(e) => set('badge_ar', e.target.value)} placeholder={tt.badge_ar_ph} /></div>
            <div className="field"><label>{tt.badge_en}</label>
              <input dir="ltr" value={data.badge_en} onChange={(e) => set('badge_en', e.target.value)} /></div>
          </div>
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
