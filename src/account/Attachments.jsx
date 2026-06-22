import { useRef, useState } from 'react';
import { Paperclip, X, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { useLang } from '../i18n.jsx';

const isImage = (u) => /\.(png|jpe?g|webp|gif)$/i.test(u || '');

const T = {
  ar: {
    attachments: 'المرفقات', file: 'ملف',
    attach_files: 'إرفاق ملفات (تقارير، تحاليل...)',
    uploading: 'جارٍ الرفع...', choose_files: 'اختر ملفات',
    too_large: (n) => `«${n}» أكبر من 10 ميجابايت`,
    upload_failed: (n) => `تعذّر رفع «${n}» (نوع غير مدعوم)`,
  },
  en: {
    attachments: 'Attachments', file: 'File',
    attach_files: 'Attach files (reports, lab tests...)',
    uploading: 'Uploading...', choose_files: 'Choose files',
    too_large: (n) => `"${n}" is larger than 10 MB`,
    upload_failed: (n) => `Could not upload "${n}" (unsupported type)`,
  },
};

// Read-only display of attachments (image thumbs / download chips).
export function AttachmentList({ items = [], label }) {
  const { lang } = useLang();
  const tt = T[lang];
  const heading = label ?? tt.attachments;
  if (!items.length) return null;
  return (
    <div className="att-list-wrap">
      <span className="att-label"><Paperclip size={14} /> {heading} ({items.length})</span>
      <div className="att-list">
        {items.map((a) => (
          isImage(a.url)
            ? <a key={a.id || a.url} href={a.url} target="_blank" rel="noreferrer" className="att-thumb"><img src={a.url} alt={a.name} /></a>
            : <a key={a.id || a.url} href={a.url} target="_blank" rel="noreferrer" download className="att-chip"><FileText size={16} /><span>{a.name || tt.file}</span><Download size={14} /></a>
        ))}
      </div>
    </div>
  );
}

// Multi-file picker that uploads each file and manages a list of {url,name}.
export function MultiFileUpload({ items = [], onChange, uploadFn, label }) {
  const { lang } = useLang();
  const tt = T[lang];
  const heading = label ?? tt.attach_files;
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError(''); setUploading(true);
    const added = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { setError(tt.too_large(file.name)); continue; }
      try {
        const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
        const out = await uploadFn(dataUrl, file.name);
        added.push(out);
      } catch { setError(tt.upload_failed(file.name)); }
    }
    setUploading(false);
    if (ref.current) ref.current.value = '';
    if (added.length) onChange([...items, ...added]);
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="multi-upload">
      <label className="mu-label">{heading}</label>
      <button type="button" className="mu-btn" onClick={() => ref.current?.click()} disabled={uploading}>
        <Paperclip size={16} /> {uploading ? tt.uploading : tt.choose_files}
      </button>
      <input ref={ref} type="file" multiple hidden onChange={pick} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
      {error && <div className="mu-error">{error}</div>}
      {items.length > 0 && (
        <div className="mu-items">
          {items.map((a, i) => (
            <span key={i} className="mu-chip">
              {isImage(a.url) ? <ImageIcon size={13} /> : <FileText size={13} />}
              <span className="mu-name">{a.name}</span>
              <button type="button" onClick={() => remove(i)}><X size={13} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
