import { Link } from 'react-router-dom';
import { MessagesSquare, FileText, User } from 'lucide-react';
import { fmtDateTime } from './status.js';
import { useLang } from '../i18n.jsx';

const isImage = (u) => /\.(png|jpe?g|webp|gif)$/i.test(u || '');

const T = {
  ar: {
    title: 'المراسلات مع إدارة رؤى', empty: 'لا توجد مراسلات بعد.',
    admin: 'إدارة رؤى', you: 'أنت',
    image_attached: 'صورة مرفقة', file_attached: 'ملف مرفق',
  },
  en: {
    title: 'Correspondence with RU-MD Administration', empty: 'No messages yet.',
    admin: 'RU-MD Administration', you: 'You',
    image_attached: 'Image attached', file_attached: 'File attached',
  },
};

// Read-only aggregated correspondence: every message across the account's cases/
// requests, each clearly labeled with the patient name + reference it belongs to.
export default function CorrespondenceFeed({ items = [], linkBase = '/portal/cases' }) {
  const { lang } = useLang();
  const tt = T[lang];
  return (
    <div className="side-card corr-card">
      <div className="side-card-head"><MessagesSquare size={18} /> <h3>{tt.title}</h3></div>
      <div className="corr-feed">
        {items.length === 0 && <p className="empty small">{tt.empty}</p>}
        {items.map((m) => (
          <Link key={m.id} to={`${linkBase}/${m.case_id || m.req_id}`} className="corr-item">
            <div className="corr-top">
              <span className="corr-patient"><User size={12} /> {m.subject || '—'}</span>
              <span className="corr-ref" dir="ltr">{m.ref}</span>
            </div>
            <div className={`corr-msg ${m.sender_role}`}>
              <span className="corr-sender">{m.sender_role === 'admin' ? tt.admin : tt.you}</span>
              {m.body && <p>{m.body}</p>}
              {m.attachment_url && (
                <span className="corr-att"><FileText size={12} /> {isImage(m.attachment_url) ? tt.image_attached : (m.attachment_name || tt.file_attached)}</span>
              )}
            </div>
            <small className="corr-time" dir="ltr">{fmtDateTime(m.created_at)}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
