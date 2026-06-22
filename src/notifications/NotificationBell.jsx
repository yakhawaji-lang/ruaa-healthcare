import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Settings2, Volume2, Play, ClipboardList, ShieldPlus, MessagesSquare, CalendarDays, RefreshCw, Trash2 } from 'lucide-react';
import { AdminAPI, AccountAPI } from '../storage/api.js';
import { SOUNDS, NOTIF_TYPES, getPrefs, setPrefs, getTypePrefs, setTypePref, getTypeSounds, setTypeSound, playSound, playIfEnabled } from './sound.js';
import { fmtDateTime } from '../account/status.js';
import { useLang } from '../i18n.jsx';

const TYPE_ICON = { request: ClipboardList, case: ShieldPlus, message: MessagesSquare, status: RefreshCw, visit: CalendarDays };

const TYPE_LABELS = {
  ar: { message: 'الرسائل', request: 'طلبات الخدمات', case: 'حالات التأمين', status: 'تحديثات الحالة', visit: 'الزيارات' },
  en: { message: 'Messages', request: 'Service Requests', case: 'Insurance Cases', status: 'Status Updates', visit: 'Visits' },
};

const T = {
  ar: {
    notifications: 'الإشعارات', notifications_aria: 'الإشعارات',
    mark_all_read: 'تحديد الكل كمقروء', clear_all: 'مسح الكل', confirm_clear: 'مسح جميع الإشعارات؟', notif_sound_settings: 'إعدادات الإشعارات والصوت',
    all: 'الكل', no_notifications: 'لا توجد إشعارات.',
    types_and_sounds: 'أنواع الإشعارات والأصوات', test_sound: 'تجربة الصوت',
    general_sound: 'الصوت العام', enable_notif_sound: 'تفعيل صوت الإشعارات',
    default_sound: 'الصوت الافتراضي', volume: 'مستوى الصوت',
  },
  en: {
    notifications: 'Notifications', notifications_aria: 'Notifications',
    mark_all_read: 'Mark all as read', clear_all: 'Clear all', confirm_clear: 'Delete all notifications?', notif_sound_settings: 'Notification & sound settings',
    all: 'All', no_notifications: 'No notifications.',
    types_and_sounds: 'Notification types & sounds', test_sound: 'Test sound',
    general_sound: 'General sound', enable_notif_sound: 'Enable notification sound',
    default_sound: 'Default sound', volume: 'Volume',
  },
};

export default function NotificationBell({ kind = 'admin' }) {
  const { lang } = useLang();
  const tt = T[lang];
  const typeLabels = TYPE_LABELS[lang];
  const api = kind === 'admin' ? AdminAPI : AccountAPI;
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [filter, setFilter] = useState('all');
  const [tp, setTp] = useState(getTypePrefs());
  const lastId = useRef(null);
  const boxRef = useRef(null);

  const poll = async () => {
    try {
      const r = await api.notifications();
      setItems(r.items || []);
      const newest = r.items?.[0];
      if (lastId.current !== null && newest && newest.id > lastId.current) playIfEnabled(newest.type);
      lastId.current = newest?.id || 0;
    } catch {}
  };

  useEffect(() => { poll(); const t = setInterval(poll, 15000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) { setOpen(false); setSettings(false); } };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // only count/show types the user kept enabled
  const visible = items.filter((n) => tp[n.type] !== false);
  const unread = visible.filter((n) => !n.is_read).length;
  const shown = visible.filter((n) => filter === 'all' || n.type === filter);
  const counts = Object.keys(NOTIF_TYPES).reduce((a, k) => { a[k] = visible.filter((n) => n.type === k).length; return a; }, {});

  const openItem = async (n) => {
    // remove it from the list immediately, then navigate to its source
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    setOpen(false);
    if (n.link) nav(n.link);
    try { await api.dismissNotif(n.id); } catch {}
  };
  const markAll = async () => { await api.readAllNotifs(); poll(); };
  const clearAll = async () => { if (confirm(tt.confirm_clear)) { setItems([]); try { await api.clearNotifs(); } catch {} poll(); } };
  const toggleType = (k, on) => { setTypePref(k, on); setTp(getTypePrefs()); };

  return (
    <div className="notif" ref={boxRef}>
      <button className="notif-bell" onClick={() => { setOpen((o) => !o); setSettings(false); }} aria-label={tt.notifications_aria}>
        <Bell size={20} />
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <strong>{tt.notifications}{unread > 0 ? ` (${unread})` : ''}</strong>
            <div className="notif-head-actions">
              {unread > 0 && <button onClick={markAll} title={tt.mark_all_read}><Check size={16} /></button>}
              {items.length > 0 && <button onClick={clearAll} title={tt.clear_all}><Trash2 size={16} /></button>}
              <button onClick={() => setSettings((s) => !s)} title={tt.notif_sound_settings}><Settings2 size={16} /></button>
            </div>
          </div>

          {settings && <NotifSettings tp={tp} onToggleType={toggleType} typeLabels={typeLabels} tt={tt} />}

          {/* type filter tabs */}
          <div className="notif-tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>{tt.all}</button>
            {Object.keys(NOTIF_TYPES).filter((k) => tp[k] !== false).map((k) => (
              <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>
                {typeLabels[k] || k}{counts[k] ? ` (${counts[k]})` : ''}
              </button>
            ))}
          </div>

          <div className="notif-list">
            {shown.length === 0 && <p className="notif-empty">{tt.no_notifications}</p>}
            {shown.map((n) => {
              const Icon = TYPE_ICON[n.type] || Bell;
              return (
                <button key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`} onClick={() => openItem(n)}>
                  <span className="notif-ico"><Icon size={16} /></span>
                  <span className="notif-body">
                    <strong>{n.title}</strong>
                    {n.body && <span className="notif-text">{n.body}</span>}
                    <small dir="ltr">{fmtDateTime(n.created_at)}</small>
                  </span>
                  {!n.is_read && <span className="notif-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifSettings({ tp, onToggleType, typeLabels, tt }) {
  const [p, setP] = useState(getPrefs());
  const [ts, setTs] = useState(getTypeSounds());
  const update = (patch) => { const next = { ...p, ...patch }; setP(next); setPrefs(patch); };
  const changeSound = (k, val) => { setTypeSound(k, val); setTs(getTypeSounds()); playSound(val); };
  return (
    <div className="notif-settings">
      <div className="ns-section">{tt.types_and_sounds}</div>
      <div className="ns-types">
        {Object.keys(NOTIF_TYPES).map((k) => {
          const Icon = TYPE_ICON[k] || Bell;
          const on = tp[k] !== false;
          return (
            <div key={k} className={`ns-type ${on ? 'on' : ''}`}>
              <label className="ns-type-head">
                <span className="ns-type-l"><Icon size={15} /> {typeLabels[k] || k}</span>
                <input type="checkbox" checked={on} onChange={(e) => onToggleType(k, e.target.checked)} />
              </label>
              <div className="ns-type-sound">
                <select value={ts[k]} disabled={!on} onChange={(e) => changeSound(k, e.target.value)}>
                  {Object.entries(SOUNDS).map(([sk, v]) => <option key={sk} value={sk}>{v.label}</option>)}
                </select>
                <button type="button" className="ns-play" disabled={!on} title={tt.test_sound} onClick={() => playSound(ts[k])}><Play size={13} /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ns-section">{tt.general_sound}</div>
      <label className="ns-toggle">
        <input type="checkbox" checked={p.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
        {tt.enable_notif_sound}
      </label>
      <div className="ns-row">
        <span>{tt.default_sound}</span>
        <select value={p.sound} onChange={(e) => { update({ sound: e.target.value }); playSound(e.target.value); }}>
          {Object.entries(SOUNDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="ns-row">
        <span>{tt.volume}</span>
        <input type="range" min="0" max="1" step="0.1" value={p.volume} onChange={(e) => update({ volume: Number(e.target.value) })} />
      </div>
      <button className="ns-test" onClick={() => playSound()}><Volume2 size={15} /> {tt.test_sound}</button>
    </div>
  );
}
