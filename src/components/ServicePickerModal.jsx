// Shared multi-select service picker used by the insurance portal AND the admin
// case editor. Supports search, multi-select, free-text custom entries, and
// pre-selecting from the current "، "-joined value. Emits a "، "-joined string.
import { useState } from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n.jsx';
import ServiceIcon from './ServiceIcon.jsx';

const T = {
  ar: {
    title: 'اختر الخدمات المطلوبة', search: 'ابحث عن خدمة...', no_services: 'لا توجد خدمات مطابقة.',
    multi_hint: 'يمكنك اختيار أكثر من خدمة', custom_ph: 'خدمة أخرى غير موجودة بالقائمة؟ اكتبها هنا',
    add_custom: 'إضافة', add_selected: 'إضافة المحدد', cancel: 'إلغاء',
  },
  en: {
    title: 'Choose the requested services', search: 'Search for a service...', no_services: 'No matching services.',
    multi_hint: 'You can select more than one service', custom_ph: 'Another service not in the list? Type it here',
    add_custom: 'Add', add_selected: 'Add selected', cancel: 'Cancel',
  },
};

export default function ServicePickerModal({ services = [], initial, onApply, onClose }) {
  const { lang, pick } = useLang();
  const tt = T[lang === 'en' ? 'en' : 'ar'];
  const [q, setQ] = useState('');
  const [customDraft, setCustomDraft] = useState('');

  const parsed = (() => {
    const tokens = (initial || '').split('،').map((t) => t.trim()).filter(Boolean);
    const sel = new Set();
    const customs = [];
    tokens.forEach((tok) => {
      const match = services.find((sv) => pick(sv, 'title') === tok || sv.title_ar === tok || sv.title_en === tok);
      if (match) sel.add(match.slug); else customs.push(tok);
    });
    return { sel, customs };
  })();
  const [sel, setSel] = useState(parsed.sel);
  const [customs, setCustoms] = useState(parsed.customs);

  const toggle = (slug) => setSel((prev) => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });
  const addCustom = () => { const v = customDraft.trim(); if (v && !customs.includes(v)) setCustoms((c) => [...c, v]); setCustomDraft(''); };
  const removeCustom = (v) => setCustoms((c) => c.filter((x) => x !== v));

  const total = sel.size + customs.length;
  const apply = () => {
    const names = services.filter((sv) => sel.has(sv.slug)).map((sv) => pick(sv, 'title'));
    onApply([...names, ...customs].join('، '));
  };

  const query = q.trim().toLowerCase();
  const filtered = services.filter((sv) => {
    if (!query) return true;
    const t = `${pick(sv, 'title') || ''} ${sv.title_ar || ''} ${sv.title_en || ''}`.toLowerCase();
    return t.includes(query);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal portal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.title}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          <div className="field"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt.search} autoFocus /></div>
          <p className="muted" style={{ marginTop: 0 }}>{tt.multi_hint}</p>
          {filtered.length === 0 ? (
            <p className="empty">{tt.no_services}</p>
          ) : (
            <div className="svc-order-grid svc-picker-grid">
              {filtered.map((sv) => {
                const on = sel.has(sv.slug);
                return (
                  <button key={sv.slug} type="button" className={`svc-card${on ? ' selected' : ''}`}
                    onClick={() => toggle(sv.slug)}
                    style={on ? { borderColor: '#1f7d92', boxShadow: '0 0 0 2px rgba(31,125,146,.25)' } : undefined}>
                    <div className="svc-card-top">
                      <span className="svc-card-icon"><ServiceIcon name={sv.icon} size={20} /></span>
                      {on ? <CheckCircle2 size={20} color="#1f7d92" /> : null}
                    </div>
                    <strong className="svc-card-title">{pick(sv, 'title')}</strong>
                  </button>
                );
              })}
            </div>
          )}

          <div className="svc-custom-row">
            <input value={customDraft} onChange={(e) => setCustomDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder={tt.custom_ph} />
            <button type="button" className="btn btn-outline btn-sm" onClick={addCustom}><Plus size={15} /> {tt.add_custom}</button>
          </div>
          {customs.length > 0 && (
            <div className="svc-chips">
              {customs.map((c) => (
                <span key={c} className="svc-chip">{c}<button type="button" onClick={() => removeCustom(c)}><X size={13} /></button></span>
              ))}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button type="button" className="btn btn-primary" onClick={apply} disabled={total === 0}>
            {tt.add_selected}{total ? ` (${total})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
