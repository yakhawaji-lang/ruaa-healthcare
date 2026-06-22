import { useEffect, useState } from 'react';
import { Trash2, Mail, MailOpen, Phone, AtSign } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { useLang } from '../i18n.jsx';

const KIND_LABEL = {
  ar: { contact: 'تواصل', appointment: 'طلب خدمة', inquiry: 'استفسار', complaint: 'شكوى' },
  en: { contact: 'Contact', appointment: 'Service request', inquiry: 'Inquiry', complaint: 'Complaint' },
};

const T = {
  ar: {
    title: 'رسائل التواصل', no_messages_dot: 'لا توجد رسائل.',
    confirm_delete: 'حذف هذه الرسالة؟', service: 'الخدمة',
    reply_whatsapp: 'رد عبر واتساب', select_message: 'اختر رسالة لعرضها.',
  },
  en: {
    title: 'Contact Messages', no_messages_dot: 'No messages.',
    confirm_delete: 'Delete this message?', service: 'Service',
    reply_whatsapp: 'Reply via WhatsApp', select_message: 'Select a message to view it.',
  },
};

export default function MessagesManager() {
  const { lang } = useLang();
  const tt = T[lang];
  const kindLabel = KIND_LABEL[lang];
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);

  const load = () => AdminAPI.messages().then(setList);
  useEffect(() => { load(); }, []);

  const open = async (m) => {
    setActive(m);
    if (!m.is_read) { await AdminAPI.markMessage(m.id, true); load(); }
  };
  const remove = async (id) => {
    if (!confirm(tt.confirm_delete)) return;
    await AdminAPI.deleteMessage(id);
    setActive(null); load();
  };

  return (
    <div>
      <h1 className="page-title">{tt.title}</h1>
      <div className="messages-layout">
        <div className="msg-list panel">
          {list.length === 0 && <p className="empty">{tt.no_messages_dot}</p>}
          {list.map((m) => (
            <button key={m.id} className={`msg-item ${active?.id === m.id ? 'active' : ''} ${m.is_read ? '' : 'unread'}`} onClick={() => open(m)}>
              <span className="msg-icon">{m.is_read ? <MailOpen size={18} /> : <Mail size={18} />}</span>
              <span className="msg-meta">
                <strong>{m.name}</strong>
                <small>{kindLabel[m.kind] || m.kind} · {new Date(m.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="msg-detail panel">
          {active ? (
            <>
              <div className="msg-detail-head">
                <h2>{active.name}</h2>
                <button className="danger icon-btn" onClick={() => remove(active.id)}><Trash2 size={18} /></button>
              </div>
              <div className="msg-fields">
                {active.phone && <div><Phone size={15} /> <a href={`tel:${active.phone}`} dir="ltr">{active.phone}</a></div>}
                {active.email && <div><AtSign size={15} /> <a href={`mailto:${active.email}`} dir="ltr">{active.email}</a></div>}
                {active.service && <div className="msg-service">{tt.service}: <strong>{active.service}</strong></div>}
              </div>
              <div className="msg-body">{active.body || '—'}</div>
              <div className="msg-foot">
                {active.phone && <a className="btn btn-primary" href={`https://wa.me/${active.phone.replace(/\D/g, '').replace(/^0/, '966')}`} target="_blank" rel="noreferrer">{tt.reply_whatsapp}</a>}
              </div>
            </>
          ) : <p className="empty">{tt.select_message}</p>}
        </div>
      </div>
    </div>
  );
}
