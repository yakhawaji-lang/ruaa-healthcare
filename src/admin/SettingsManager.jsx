import { useEffect, useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import ImageUpload from './ImageUpload.jsx';
import { useLang } from '../i18n.jsx';
import { VISIT_TYPES_BI, CLINICIAN_ROLES_BI, normBiList, normStaffList, biLabel } from '../account/status.js';

const labels = {
  ar: {
    name: 'اسم المركز', tagline: 'الشعار النصي', address: 'العنوان', hours: 'أوقات العمل',
    phone: 'الهاتف', phone_intl: 'الهاتف (دولي)', whatsapp: 'واتساب', email: 'البريد',
    instagram: 'إنستغرام', twitter: 'تويتر/X', founded: 'سنة التأسيس',
    hero_image: 'صورة البانر الرئيسي', about_image: 'صورة صفحة من نحن', cta_image: 'صورة شريط الدعوة',
  },
  en: {
    name: 'Center name', tagline: 'Tagline', address: 'Address', hours: 'Working hours',
    phone: 'Phone', phone_intl: 'Phone (international)', whatsapp: 'WhatsApp', email: 'Email',
    instagram: 'Instagram', twitter: 'Twitter/X', founded: 'Founded year',
    hero_image: 'Main banner image', about_image: 'About page image', cta_image: 'CTA strip image',
  },
};
const T = {
  ar: {
    site_settings: 'إعدادات الموقع', save: 'حفظ', saved: 'تم حفظ الإعدادات',
    ph_ar: 'عربي', ph_en: 'English', banners_subhead: 'صور الموقع والبنرات',
    lists_subhead: 'قوائم الزيارات والكادر الطبي',
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
    lists_subhead: 'Visit & clinical staff lists',
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
  const [staff, setStaff] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AdminAPI.settings().then((rs) => {
      setRows(rs);
      const get = (k) => rs.find((r) => r.key === k)?.value_ar;
      setVisitTypes(normBiList(parse(get('visit_types')), VISIT_TYPES_BI));
      setRoles(normBiList(parse(get('clinician_roles')), CLINICIAN_ROLES_BI));
      setStaff(normStaffList(parse(get('clinical_staff'))));
    });
  }, []);

  const set = (key, field, value) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const save = async () => {
    const base = rows.filter((r) => !LIST_KEYS.includes(r.key));
    const vt = visitTypes.filter((x) => x.ar || x.en);
    const vr = roles.filter((x) => x.ar || x.en);
    const st = staff.filter((s) => (s.name_ar || s.name_en || '').trim());
    const payload = [
      ...base,
      { key: 'visit_types', value_ar: JSON.stringify(vt), value_en: JSON.stringify(vt) },
      { key: 'clinician_roles', value_ar: JSON.stringify(vr), value_en: JSON.stringify(vr) },
      { key: 'clinical_staff', value_ar: JSON.stringify(st), value_en: JSON.stringify(st) },
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
        <StaffEditor staff={staff} setStaff={setStaff} roles={roles.filter((r) => r.ar || r.en)} tt={tt} lang={lang} />
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

function StaffEditor({ staff, setStaff, roles, tt, lang }) {
  const setField = (i, field, v) => setStaff((arr) => arr.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));
  const toggleRole = (i, roleKey) => setStaff((arr) => arr.map((s, idx) => {
    if (idx !== i) return s;
    const cur = new Set(s.roles || []);
    cur.has(roleKey) ? cur.delete(roleKey) : cur.add(roleKey);
    return { ...s, roles: [...cur] };
  }));
  const remove = (i) => setStaff((arr) => arr.filter((_, idx) => idx !== i));
  const add = () => setStaff((arr) => [...arr, { name_ar: '', name_en: '', roles: [] }]);

  return (
    <div style={{ marginTop: 18 }}>
      <label className="setting-label">{tt.staff}</label>
      <p className="muted" style={{ marginTop: 2 }}>{tt.staff_hint}</p>
      {roles.length === 0 && <p className="empty small">{tt.no_specialties}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {staff.map((s, i) => (
          <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <input className="fld-input" style={{ flex: 1, minWidth: 0 }} value={s.name_ar || ''} onChange={(e) => setField(i, 'name_ar', e.target.value)} placeholder={tt.name_ar} />
              <input className="fld-input" style={{ flex: 1, minWidth: 0 }} dir="ltr" value={s.name_en || ''} onChange={(e) => setField(i, 'name_en', e.target.value)} placeholder={tt.name_en} />
              <button type="button" className="icon-act danger" title={tt.remove} onClick={() => remove(i)}
                style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 38, height: 38 }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roles.map((role) => {
                const key = role.ar || role.en; // ar value is the stable link key
                const on = (s.roles || []).includes(key);
                return (
                  <button type="button" key={key} onClick={() => toggleRole(i, key)}
                    style={{ padding: '5px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem',
                      border: on ? '1px solid var(--teal)' : '1px solid var(--line)', background: on ? 'var(--teal-light)' : '#fff', color: on ? 'var(--teal-dark)' : 'var(--muted)' }}>
                    {biLabel(role, lang)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={add} style={{ justifySelf: 'start' }}><Plus size={15} /> {tt.add_staff}</button>
      </div>
    </div>
  );
}
