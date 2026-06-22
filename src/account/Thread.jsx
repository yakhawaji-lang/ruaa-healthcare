import { useState, useRef, useEffect } from 'react';
import { Send, MessagesSquare, Paperclip, X, FileText, Download } from 'lucide-react';
import { fmtDateTime } from './status.js';
import { useLang } from '../i18n.jsx';

const isImage = (u) => /\.(png|jpe?g|webp|gif)$/i.test(u || '');

const T = {
  ar: {
    correspondence: 'المراسلات', too_large: 'الحجم أكبر من 10 ميجابايت',
    upload_failed: 'نوع الملف غير مدعوم أو تعذّر الرفع',
    empty: 'لا توجد مراسلات بعد. ابدأ المحادثة.',
    admin: 'إدارة رؤى', account: 'الحساب', file: 'ملف',
    attach_file: 'إرفاق ملف', uploading: 'جارٍ رفع الملف...',
    write_message: 'اكتب رسالة...', send: 'إرسال',
  },
  en: {
    correspondence: 'Correspondence', too_large: 'Size is larger than 10 MB',
    upload_failed: 'File type not supported or upload failed',
    empty: 'No messages yet. Start the conversation.',
    admin: 'RU-MD Administration', account: 'Account', file: 'File',
    attach_file: 'Attach a file', uploading: 'Uploading file...',
    write_message: 'Write a message...', send: 'Send',
  },
};

// Two-way correspondence with file attachments. `currentRole` is 'admin' or
// 'user'. onSend({ body, attachment_url, attachment_name }); onUpload(dataUrl, name) -> { url, name }.
export default function Thread({ messages = [], currentRole, onSend, onUpload, title }) {
  const { lang } = useLang();
  const tt = T[lang];
  const heading = title ?? tt.correspondence;
  const [text, setText] = useState('');
  const [pending, setPending] = useState(null); // { url, name }
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError(tt.too_large); return; }
    setError(''); setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try { const out = await onUpload(reader.result, file.name); setPending(out); }
      catch { setError(tt.upload_failed); }
      finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
    };
    reader.readAsDataURL(file);
  };

  const send = async () => {
    const t = text.trim();
    if ((!t && !pending) || busy) return;
    setBusy(true);
    try {
      await onSend({ body: t, attachment_url: pending?.url, attachment_name: pending?.name });
      setText(''); setPending(null);
    } finally { setBusy(false); }
  };

  return (
    <div className="thread side-card">
      <div className="side-card-head"><MessagesSquare size={18} /> <h3>{heading}</h3></div>
      <div className="thread-body">
        <div className="thread-msgs">
          {messages.length === 0 && <p className="empty small">{tt.empty}</p>}
          {messages.map((m) => {
            const mine = m.sender_role === currentRole;
            return (
              <div key={m.id} className={`bubble-row ${mine ? 'mine' : 'theirs'}`}>
                <div className="bubble">
                  <div className="bubble-head">
                    <strong>{m.sender_role === 'admin' ? tt.admin : (m.sender_name || tt.account)}</strong>
                    <small dir="ltr">{fmtDateTime(m.created_at)}</small>
                  </div>
                  {m.body && <p>{m.body}</p>}
                  {m.attachment_url && (
                    isImage(m.attachment_url)
                      ? <a href={m.attachment_url} target="_blank" rel="noreferrer" className="msg-img"><img src={m.attachment_url} alt={m.attachment_name} /></a>
                      : <a href={m.attachment_url} target="_blank" rel="noreferrer" download className="msg-file"><FileText size={18} /><span>{m.attachment_name || tt.file}</span><Download size={15} /></a>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {(pending || error) && (
          <div className="thread-pending">
            {pending && <span className="pending-chip"><Paperclip size={13} /> {pending.name} <button onClick={() => setPending(null)}><X size={13} /></button></span>}
            {error && <span className="pending-err">{error}</span>}
          </div>
        )}

        <div className="thread-input">
          <button className="attach-btn" onClick={() => fileRef.current?.click()} disabled={uploading} title={tt.attach_file}>
            <Paperclip size={18} />
          </button>
          <input ref={fileRef} type="file" hidden onChange={pickFile}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder={uploading ? tt.uploading : tt.write_message}
          />
          <button className="btn btn-primary" onClick={send} disabled={busy || uploading}><Send size={16} /> {tt.send}</button>
        </div>
      </div>
    </div>
  );
}
