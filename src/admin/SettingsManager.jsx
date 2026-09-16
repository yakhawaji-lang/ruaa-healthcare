import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Plus, X } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import ImageUpload from './ImageUpload.jsx';
import { useLang } from '../i18n.jsx';
import { VISIT_TYPES_BI, CLINICIAN_ROLES_BI, normBiList } from '../account/status.js';

const labels = {
  ar: {
    name: 'اسم المركز', tagline: 'الشعار النصي', address: 'العنوان', hours: 'أوقات العمل',
    phone: 'الهاتف', phone_intl: 'الهاتف (دولي)', whatsapp: 'واتساب', email: 'البريد',
    instagram: 'إنستغرام', twitter: 'تويتر/X', founded: 'سنة التأسيس',
    hero_image: 'صورة البانر الرئيسي', about_image: 'صورة صفحة من نحن', cta_image: 'صورة شريط الدعوة',
    telemed_enabled: 'الطب الاتصالي (1 = مفعّلة / 0 = معطّلة)', telemed_price: 'رسوم استشارة الطب الاتصالي (ريال، اختياري)',
    telemed_slot_minutes: 'المدة الافتراضية للاستشارة (دقيقة)', jitsi_domain: 'نطاق خادم Jitsi للمكالمات (مثال: meet.jit.si)',
    telemed_require_confirm: 'الحجوزات تحتاج تأكيد الإدارة قبل اعتمادها (1 = نعم / 0 = تُعتمد مباشرة)',
  },
  en: {
    name: 'Center name', tagline: 'Tagline', address: 'Address', hours: 'Working hours',
    phone: 'Phone', phone_intl: 'Phone (international)', whatsapp: 'WhatsApp', email: 'Email',
    instagram: 'Instagram', twitter: 'Twitter/X', founded: 'Founded year',
    hero_image: 'Main banner image', about_image: 'About page image', cta_image: 'CTA strip image',
    telemed_enabled: 'Remote consultations (1 = on / 0 = off)', telemed_price: 'Remote consultation fee (SAR, optional)',
    telemed_slot_minutes: 'Default consultation length (min)', jitsi_domain: 'Jitsi server domain for calls (e.g. meet.jit.si)',
    telemed_require_confirm: 'Bookings need admin confirmation (1 = yes / 0 = auto-confirm)',
  },
};
const T = {
  ar: {
    site_settings: 'إعدادات الموقع', save: 'حفظ', saved: 'تم حفظ الإعدادات',
    ph_ar: 'عربي', ph_en: 'English', banners_subhead: 'صور الموقع والبنرات',
    lists_subhead: 'قوائم الزيارات والمهن',
    visit_types: 'قائمة نوع الزيارة',
    specialties: 'قائمة تخصص الكادر الطبي',
    staff: 'الكادر الطبي (الأسماء)',
    staff_hint: 'أضف اسم الكادر بالعربية والإنجليزية وحدّد تخصصاته. يمكن ربط الاسم الواحد بأكثر من تخصص.',
    add_item: 'إضافة', add_staff: 'إضافة كادر', remove: 'حذف',
    new_ar: 'بالعربية', new_en: 'بالإنجليزية',
    name_ar: 'الاسم (عربي)', name_en: 'الاسم (إنجليزي)',
    no_specialties: 'أضف تخصصات أولًا لربطها بالأسماء.',
  },
  en: {
    site_settings: 'Site Settings', save: 'Save', saved: 'Settings saved',
    ph_ar: 'Arabic', ph_en: 'English', banners_subhead: 'Site images & banners',
    lists_subhead: 'Visit & profession lists',
    visit_types: 'Visit type list',
    specialties: 'Clinician specialty list',
    staff: 'Clinical staff (names)',
    staff_hint: 'Add the staff name in Arabic and English and select their specialties. One name can be linked to multiple specialties.',
    add_item: 'Add', add_staff: 'Add staff', remove: 'Remove',
    new_ar: 'Arabic', new_en: 'English',
    name_ar: 'Name (Arabic)', name_en: 'Name (English)',
    no_specialties: 'Add specialties first to link them to names.',
  },
};
const bilingual = new Set(['name', 'tagline', 'address', 'hours']);
const imageKeys = new Set(['hero_image', 'about_image', 'cta_image']);
const LIST_KEYS = ['visit_types', 'clinician_roles', 'clinical_staff'];
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };

export default function SettingsManager() {
  const { lang } = useLang();
  const tt = T[lang];
  const lbl = labels[lang];
  const [rows, setRows] = useState([]);
  const [visitTypes, setVisitTypes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AdminAPI.settings().then((rs) => {
      setRows(rs);
      const get = (k) => rs.find((r) => r.key === k)?.value_ar;
      setVisitTypes(normBiList(parse(get('visit_types')), VISIT_TYPES_BI));
      setRoles(normBiList(parse(get('clinician_roles')), CLINICIAN_ROLES_BI));
    });
  }, []);

  const set = (key, field, value) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const save = async () => {
    const base = rows.filter((r) => !LIST_KEYS.includes(r.key));
    const vt = visitTypes.filter((x) => x.ar || x.en);
    const vr = roles.filter((x) => x.ar || x.en);
    const payload = [
      ...base,
      { key: 'visit_types', value_ar: JSON.stringify(vt), value_en: JSON.stringify(vt) },
      { key: 'clinician_roles', value_ar: JSON.stringify(vr), value_en: JSON.stringify(vr) },
    ];
    await AdminAPI.saveSettings(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{tt.site_settings}</h1>
        <button className="btn btn-primary" onClick={save}><Save size={16} /> {tt.save}</button>
      </div>
      {saved && <div className="form-alert success">{tt.saved}</div>}

      <div className="panel settings-grid">
        {rows.filter((r) => !imageKeys.has(r.key) && !LIST_KEYS.includes(r.key)).map((r) => (
          <div key={r.key} className="setting-row">
            <label className="setting-label">{lbl[r.key] || r.key}</label>
            {bilingual.has(r.key) ? (
              <div className="field-row">
                <input value={r.value_ar || ''} onChange={(e) => set(r.key, 'value_ar', e.target.value)} placeholder={tt.ph_ar} />
                <input dir="ltr" value={r.value_en || ''} onChange={(e) => set(r.key, 'value_en', e.target.value)} placeholder={tt.ph_en} />
              </div>
            ) : (
              <input dir="ltr" value={r.value_ar || ''} onChange={(e) => { set(r.key, 'value_ar', e.target.value); set(r.key, 'value_en', e.target.value); }} />
            )}
          </div>
        ))}
      </div>

      <h2 className="settings-subhead">{tt.lists_subhead}</h2>
      <div className="panel">
        <div className="field-row" style={{ alignItems: 'flex-start' }}>
          <BiListEditor title={tt.visit_types} items={visitTypes} setItems={setVisitTypes} tt={tt} />
          <BiListEditor title={tt.specialties} items={roles} setItems={setRoles} tt={tt} />
        </div>
        <div className="form-alert" style={{ background: 'var(--teal-light)', color: 'var(--navy)', marginTop: 16, marginBottom: 0 }}>
          {lang === 'en'
            ? <>Clinical staff names moved to the unified <Link to="/admin/staff"><b>Clinical Staff</b></Link> page (professions, contracts and access grants).</>
            : <>انتقلت أسماء الكادر الطبي إلى صفحة <Link to="/admin/staff"><b>الكادر الطبي</b></Link> الموحّدة (المهن، التعاقدات، ومنح الصلاحيات).</>}
        </div>
      </div>

      <h2 className="settings-subhead">{tt.banners_subhead}</h2>
      <div className="panel banner-grid">
        {rows.filter((r) => imageKeys.has(r.key)).map((r) => (
          <ImageUpload
            key={r.key}
            label={lbl[r.key] || r.key}
            value={r.value_ar || ''}
            height={120}
            onChange={(url) => { set(r.key, 'value_ar', url); set(r.key, 'value_en', url); }}
          />
        ))}
      </div>
    </div>
  );
}

function BiListEditor({ title, items, setItems, tt }) {
  const update = (i, field, v) => setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, [field]: v } : x)));
  const remove = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const add = () => setItems((arr) => [...arr, { ar: '', en: '' }]);
  return (
    <div className="field" style={{ flex: 1 }}>
      <label className="setting-label">{title}</label>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input className="fld-input" style={{ flex: 1, minWidth: 0 }} value={it.ar} onChange={(e) => update(i, 'ar', e.target.value)} placeholder={tt.new_ar} />
            <input className="fld-input" style={{ flex: 1, minWidth: 0 }} dir="ltr" value={it.en} onChange={(e) => update(i, 'en', e.target.value)} placeholder={tt.new_en} />
            <button type="button" className="icon-act danger" title={tt.remove} onClick={() => remove(i)}
              style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 36, height: 36 }}><X size={15} /></button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={add} style={{ justifySelf: 'start' }}><Plus size={15} /> {tt.add_item}</button>
      </div>
    </div>
  );
}
