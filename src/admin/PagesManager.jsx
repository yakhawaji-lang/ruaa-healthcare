import { useEffect, useState } from 'react';
import { Save, FileText } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    manage_pages: 'إدارة الصفحات والمحتوى',
    save: 'حفظ',
    saved: 'تم الحفظ بنجاح',
    managed_elsewhere: 'هذه الصفحة تُدار من خلال أقسام أخرى (الخدمات / الإعدادات).',
    choose_page: 'اختر صفحة لتحريرها.',
  },
  en: {
    manage_pages: 'Pages & Content',
    save: 'Save',
    saved: 'Saved successfully',
    managed_elsewhere: 'This page is managed through other sections (Services / Settings).',
    choose_page: 'Choose a page to edit.',
  },
};

// Generic JSON-block editor for the home/about pages. Renders every leaf string
// in content_json as an editable field so non-technical admins can edit copy
// without touching code.
export default function PagesManager() {
  const { lang, pick } = useLang();
  const tt = T[lang];
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [saved, setSaved] = useState(false);

  const load = () => AdminAPI.pages().then(setList);
  useEffect(() => { load(); }, []);

  const open = async (id) => {
    const p = await AdminAPI.page(id);
    setActive(p); setSaved(false);
  };

  const save = async () => {
    await AdminAPI.updatePage(active.id, {
      title_ar: active.title_ar, title_en: active.title_en,
      content: active.content, is_published: active.is_published,
    });
    setSaved(true); load();
  };

  const updateLeaf = (path, value) => {
    setActive((a) => {
      const next = structuredClone(a);
      let node = next.content;
      for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
      node[path[path.length - 1]] = value;
      return next;
    });
  };

  return (
    <div>
      <h1 className="page-title">{tt.manage_pages}</h1>
      <div className="messages-layout">
        <div className="msg-list panel">
          {list.map((p) => (
            <button key={p.id} className={`msg-item ${active?.id === p.id ? 'active' : ''}`} onClick={() => open(p.id)}>
              <span className="msg-icon"><FileText size={18} /></span>
              <span className="msg-meta"><strong>{pick(p, 'title')}</strong><small dir="ltr">{p.title_en} · /{p.slug}</small></span>
            </button>
          ))}
        </div>

        <div className="msg-detail panel">
          {active ? (
            <>
              <div className="msg-detail-head">
                <h2>{pick(active, 'title')}</h2>
                <button className="btn btn-primary" onClick={save}><Save size={16} /> {tt.save}</button>
              </div>
              {saved && <div className="form-alert success">{tt.saved}</div>}
              {Object.keys(active.content || {}).length === 0 ? (
                <p className="empty">{tt.managed_elsewhere}</p>
              ) : (
                <div className="json-editor">
                  <JsonBlock node={active.content} path={[]} onChange={updateLeaf} lang={lang} />
                </div>
              )}
            </>
          ) : <p className="empty">{tt.choose_page}</p>}
        </div>
      </div>
    </div>
  );
}

const LABELS = {
  ar: {
    hero_title_ar: 'عنوان رئيسي (ع)', hero_title_en: 'عنوان رئيسي (En)',
    hero_sub_ar: 'وصف (ع)', hero_sub_en: 'وصف (En)',
    hero_badge_ar: 'شارة (ع)', hero_badge_en: 'شارة (En)',
    cta_ar: 'زر (ع)', cta_en: 'زر (En)', intro_ar: 'مقدمة (ع)', intro_en: 'مقدمة (En)',
    title_ar: 'العنوان (ع)', title_en: 'العنوان (En)', body_ar: 'النص (ع)', body_en: 'النص (En)',
    ar: 'عربي', en: 'إنجليزي',
  },
  en: {
    hero_title_ar: 'Hero title (AR)', hero_title_en: 'Hero title (EN)',
    hero_sub_ar: 'Subtitle (AR)', hero_sub_en: 'Subtitle (EN)',
    hero_badge_ar: 'Badge (AR)', hero_badge_en: 'Badge (EN)',
    cta_ar: 'Button (AR)', cta_en: 'Button (EN)', intro_ar: 'Intro (AR)', intro_en: 'Intro (EN)',
    title_ar: 'Title (AR)', title_en: 'Title (EN)', body_ar: 'Text (AR)', body_en: 'Text (EN)',
    ar: 'Arabic', en: 'English',
  },
};

const labelFor = (k, lang) => LABELS[lang][k] || k;

function JsonBlock({ node, path, onChange, lang }) {
  if (typeof node === 'string') {
    const isEn = path[path.length - 1]?.toString().endsWith('en');
    return (
      <div className="field">
        <label>{labelFor(path[path.length - 1], lang)}</label>
        <textarea rows={node.length > 70 ? 3 : 1} dir={isEn ? 'ltr' : 'rtl'} value={node}
          onChange={(e) => onChange(path, e.target.value)} />
      </div>
    );
  }
  if (Array.isArray(node)) {
    return node.map((item, i) => (
      <div key={i} className="json-array-item"><JsonBlock node={item} path={[...path, i]} onChange={onChange} lang={lang} /></div>
    ));
  }
  if (node && typeof node === 'object') {
    return Object.entries(node).map(([k, v]) => {
      const leaf = typeof v === 'string';
      return (
        <div key={k} className={leaf ? '' : 'json-group'}>
          {!leaf && <div className="json-group-title">{labelFor(k, lang)}</div>}
          <JsonBlock node={v} path={[...path, k]} onChange={onChange} lang={lang} />
        </div>
      );
    });
  }
  return null;
}
