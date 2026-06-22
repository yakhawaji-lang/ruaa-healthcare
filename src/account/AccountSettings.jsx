import { useEffect, useState } from 'react';
import { UserCog, Pencil, X, Save, MapPin, Crosshair, Map as MapIcon, ExternalLink, Check } from 'lucide-react';
import { AccountAPI } from '../storage/api.js';
import { useAccount } from './AccountContext.jsx';
import LocationMap from './LocationMap.jsx';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    my_account: 'بياناتي وحسابي', edit: 'تعديل', name: 'الاسم',
    email_login: 'البريد / اسم الدخول', mobile: 'الجوال', location: 'الموقع',
    not_set_yet: '— لم يُحدّد بعد',
    personal_data: 'البيانات الشخصية', email_label: 'البريد الإلكتروني (اسم الدخول)',
    phone_label: 'رقم الجوال', new_password: 'كلمة مرور جديدة',
    leave_empty: '(اتركها فارغة لعدم التغيير)',
    address_label: 'العنوان (كتابةً)', address_ph: 'الحي، الشارع، المدينة، أقرب معلم',
    use_my_location: 'تحديد موقعي الحالي', open_gmaps: 'فتح خرائط قوقل',
    paste_label: 'أو الصق رابط خرائط قوقل', read: 'قراءة',
    latitude: 'خط العرض (Latitude)', longitude: 'خط الطول (Longitude)',
    open_in_gmaps: 'فتح الموقع في خرائط قوقل',
    cancel: 'إلغاء', save: 'حفظ', saving: 'جارٍ الحفظ...',
    paste_ph: 'https://maps.google.com/...  أو  24.71,46.67',
    geo_unsupported: 'المتصفح لا يدعم تحديد الموقع.',
    geo_locating: 'جارٍ تحديد موقعك...', geo_done: 'تم تحديد موقعك ✓',
    geo_failed: 'تعذّر تحديد الموقع. تأكد من السماح بالوصول للموقع.',
    paste_done: 'تم قراءة الإحداثيات من الرابط ✓',
    paste_failed: 'لم أتمكن من قراءة الموقع من الرابط. الصق رابط خرائط قوقل أو الإحداثيات.',
    err_email_taken: 'البريد مستخدم بحساب آخر.',
    err_weak_password: 'كلمة المرور قصيرة (6 أحرف على الأقل).',
    err_save: 'تعذّر الحفظ، حاول مجددًا.',
  },
  en: {
    my_account: 'My Profile & Account', edit: 'Edit', name: 'Name',
    email_login: 'Email / Login', mobile: 'Mobile', location: 'Location',
    not_set_yet: '— Not set yet',
    personal_data: 'Personal Information', email_label: 'Email (login)',
    phone_label: 'Mobile number', new_password: 'New password',
    leave_empty: '(leave empty to keep unchanged)',
    address_label: 'Address (in writing)', address_ph: 'District, street, city, nearest landmark',
    use_my_location: 'Use my current location', open_gmaps: 'Open Google Maps',
    paste_label: 'Or paste a Google Maps link', read: 'Read',
    latitude: 'Latitude', longitude: 'Longitude',
    open_in_gmaps: 'Open location in Google Maps',
    cancel: 'Cancel', save: 'Save', saving: 'Saving...',
    paste_ph: 'https://maps.google.com/...  or  24.71,46.67',
    geo_unsupported: 'Your browser does not support location detection.',
    geo_locating: 'Detecting your location...', geo_done: 'Location detected ✓',
    geo_failed: 'Could not detect location. Make sure location access is allowed.',
    paste_done: 'Coordinates read from the link ✓',
    paste_failed: 'Could not read the location from the link. Paste a Google Maps link or coordinates.',
    err_email_taken: 'This email is used by another account.',
    err_weak_password: 'Password is too short (at least 6 characters).',
    err_save: 'Could not save, please try again.',
  },
};

// Pull "lat,lng" out of a pasted Google Maps URL/text. Supports @lat,lng / q=lat,lng / !3d!4d / ll=.
export function parseLatLng(text) {
  if (!text) return null;
  const pats = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /[?&]ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/,
  ];
  for (const re of pats) {
    const m = text.match(re);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
}

export default function AccountSettings() {
  const { lang } = useLang();
  const tt = T[lang];
  const { user, updateUser } = useAccount();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = () => AccountAPI.profile().then(setProfile).catch(() => setProfile({}));
  useEffect(() => { load(); }, []);
  if (!user) return null;

  const hasLoc = profile && (profile.address || (profile.latitude && profile.longitude));

  return (
    <div className="acct-card panel">
      <div className="med-head">
        <h3><UserCog size={18} /> {tt.my_account}</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> {tt.edit}</button>
      </div>
      <div className="acct-grid">
        <div className="acct-item"><span>{tt.name}</span><b>{user.name}</b></div>
        <div className="acct-item"><span>{tt.email_login}</span><b dir="ltr">{user.email}</b></div>
        <div className="acct-item"><span>{tt.mobile}</span><b dir="ltr">{user.phone || '—'}</b></div>
        <div className="acct-item loc"><span><MapPin size={13} /> {tt.location}</span>
          <b>{hasLoc ? (profile.address || `${profile.latitude}, ${profile.longitude}`) : tt.not_set_yet}</b>
        </div>
      </div>
      {profile?.latitude && profile?.longitude && (
        <iframe className="acct-map" title={tt.location}
          src={`https://maps.google.com/maps?q=${profile.latitude},${profile.longitude}&z=15&output=embed`}
          loading="lazy" />
      )}
      {editing && <AccountEditor user={user} profile={profile || {}} onUser={updateUser}
        onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
    </div>
  );
}

function AccountEditor({ user, profile, onUser, onClose, onSaved }) {
  const { lang } = useLang();
  const tt = T[lang];
  const [f, setF] = useState({ name: user.name || '', email: user.email || '', phone: user.phone || '', password: '' });
  const [loc, setLoc] = useState({ address: profile.address || '', latitude: profile.latitude || '', longitude: profile.longitude || '' });
  const [paste, setPaste] = useState('');
  const [geoMsg, setGeoMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setL = (k) => (e) => setLoc((p) => ({ ...p, [k]: e.target.value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) { setGeoMsg(tt.geo_unsupported); return; }
    setGeoMsg(tt.geo_locating);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoc((p) => ({ ...p, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })); setGeoMsg(tt.geo_done); },
      () => setGeoMsg(tt.geo_failed),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const applyPaste = () => {
    const ll = parseLatLng(paste.trim());
    if (ll) { setLoc((p) => ({ ...p, latitude: ll.lat.toFixed(6), longitude: ll.lng.toFixed(6) })); setGeoMsg(tt.paste_done); }
    else setGeoMsg(tt.paste_failed);
  };

  const pickFromMap = (la, ln) => setLoc((p) => ({ ...p, latitude: la.toFixed(6), longitude: ln.toFixed(6) }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const r = await AccountAPI.updateMe({ name: f.name, email: f.email, phone: f.phone, password: f.password || undefined });
      if (r.user && onUser) onUser(r.user);
      await AccountAPI.saveProfile({ ...profile, address: loc.address, latitude: loc.latitude || null, longitude: loc.longitude || null });
      onSaved();
    } catch (e) {
      const code = e?.response?.data?.error;
      setError(code === 'email_taken' ? tt.err_email_taken : code === 'weak_password' ? tt.err_weak_password : tt.err_save);
    } finally { setBusy(false); }
  };

  const hasLL = loc.latitude && loc.longitude;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{tt.my_account}</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          {error && <div className="auth-error">{error}</div>}

          <div className="ed-section">{tt.personal_data}</div>
          <div className="field"><label>{tt.name}</label><input value={f.name} onChange={set('name')} /></div>
          <div className="field-row">
            <div className="field"><label>{tt.email_label}</label><input dir="ltr" value={f.email} onChange={set('email')} /></div>
            <div className="field"><label>{tt.phone_label}</label><input dir="ltr" inputMode="tel" value={f.phone} onChange={set('phone')} /></div>
          </div>
          <div className="field"><label>{tt.new_password} <small className="muted">{tt.leave_empty}</small></label>
            <input type="password" dir="ltr" value={f.password} onChange={set('password')} placeholder="••••••" /></div>

          <div className="ed-section"><MapPin size={15} /> {tt.location}</div>
          <div className="field"><label>{tt.address_label}</label>
            <input value={loc.address} onChange={setL('address')} placeholder={tt.address_ph} /></div>

          <div className="loc-tools">
            <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation}><Crosshair size={15} /> {tt.use_my_location}</button>
            <a className="btn btn-ghost btn-sm" href="https://www.google.com/maps" target="_blank" rel="noreferrer"><MapIcon size={15} /> {tt.open_gmaps}</a>
          </div>

          {/* Interactive picker — click or drag the pin for an exact spot */}
          <LocationMap lat={loc.latitude} lng={loc.longitude} onPick={pickFromMap} />

          <div className="field"><label>{tt.paste_label}</label>
            <div className="paste-row">
              <input dir="ltr" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={tt.paste_ph} />
              <button type="button" className="btn btn-outline btn-sm" onClick={applyPaste}><Check size={15} /> {tt.read}</button>
            </div>
          </div>

          <div className="field-row">
            <div className="field"><label>{tt.latitude}</label><input dir="ltr" value={loc.latitude} onChange={setL('latitude')} placeholder="24.7136" /></div>
            <div className="field"><label>{tt.longitude}</label><input dir="ltr" value={loc.longitude} onChange={setL('longitude')} placeholder="46.6753" /></div>
          </div>
          {geoMsg && <p className="loc-msg">{geoMsg}</p>}

          {hasLL && (
            <a className="loc-open" href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`} target="_blank" rel="noreferrer">
              <ExternalLink size={13} /> {tt.open_in_gmaps}
            </a>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}><Save size={16} /> {busy ? tt.saving : tt.save}</button>
        </div>
      </div>
    </div>
  );
}
