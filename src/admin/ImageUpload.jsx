import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    default_label: 'الصورة',
    too_large: 'الحجم أكبر من 8 ميجابايت',
    upload_failed: 'تعذّر رفع الصورة',
    uploading: 'جارٍ الرفع...',
    upload_image: 'رفع صورة',
    remove: 'إزالة',
  },
  en: {
    default_label: 'Image',
    too_large: 'File is larger than 8 MB',
    upload_failed: 'Failed to upload image',
    uploading: 'Uploading...',
    upload_image: 'Upload image',
    remove: 'Remove',
  },
};

// Image picker + uploader. Reads the chosen file as a base64 data URL, uploads
// it to /api/admin/upload, and returns the stored path via onChange.
export default function ImageUpload({ value, onChange, label, height = 150 }) {
  const { lang } = useLang();
  const tt = T[lang];
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = () => inputRef.current?.click();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError(tt.too_large); return; }
    setError(''); setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const { url } = await AdminAPI.uploadImage(reader.result, baseName);
        onChange(url);
      } catch {
        setError(tt.upload_failed);
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="img-upload">
      <label className="block-label">{label ?? tt.default_label}</label>
      <div className="img-upload-row">
        <div className="img-preview" style={{ height }}>
          {value ? <img src={value} alt="preview" /> : <span className="img-empty"><ImageIcon size={26} /></span>}
        </div>
        <div className="img-upload-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={pick} disabled={busy}>
            <Upload size={15} /> {busy ? tt.uploading : tt.upload_image}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
              <X size={15} /> {tt.remove}
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
          {error && <span className="img-error">{error}</span>}
        </div>
      </div>
    </div>
  );
}
