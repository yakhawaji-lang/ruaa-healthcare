// Customizable notification sounds via the Web Audio API (no audio files).
// Preferences (enabled / sound / volume) persist in localStorage.

let ctx;
function getCtx() {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(c, freq, start, dur, vol, type = 'sine') {
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

// Clear, distinct tones — labels shown in the settings UI.
export const SOUNDS = {
  chime:  { label: 'جرس مزدوج', fn: (c, v) => { tone(c, 880, 0, 0.18, v); tone(c, 1318, 0.15, 0.3, v); } },
  bell:   { label: 'جرس رنّان', fn: (c, v) => { tone(c, 1568, 0, 0.6, v * 0.9, 'triangle'); tone(c, 2093, 0.0, 0.45, v * 0.5); } },
  ding:   { label: 'دينغ', fn: (c, v) => { tone(c, 1046, 0, 0.5, v, 'sine'); } },
  alert:  { label: 'تنبيه قوي', fn: (c, v) => { [0, 0.13, 0.26].forEach((t) => tone(c, 1320, t, 0.1, v, 'square')); } },
  pop:    { label: 'نقرة', fn: (c, v) => { tone(c, 660, 0, 0.12, v, 'sine'); tone(c, 990, 0.09, 0.16, v); } },
};

const KEY = 'ruaa_notif_prefs';
export function getPrefs() {
  try { return { enabled: true, sound: 'chime', volume: 0.8, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { enabled: true, sound: 'chime', volume: 0.8 }; }
}
export function setPrefs(p) { localStorage.setItem(KEY, JSON.stringify({ ...getPrefs(), ...p })); }

// Play a specific sound (for the "test" button) or the saved preference.
export function playSound(key, volume) {
  const p = getPrefs();
  const k = key || p.sound;
  const v = volume != null ? volume : p.volume;
  const def = SOUNDS[k] || SOUNDS.chime;
  try { def.fn(getCtx(), Math.max(0.02, Math.min(1, v))); } catch {}
}

// Per-type notification preferences (show + sound).
export const NOTIF_TYPES = {
  message: 'الرسائل',
  request: 'طلبات الخدمات',
  case: 'حالات التأمين',
  status: 'تحديثات الحالة',
  visit: 'الزيارات',
};
export function getTypePrefs() {
  const stored = getPrefs().types || {};
  const out = {};
  for (const k of Object.keys(NOTIF_TYPES)) out[k] = stored[k] !== false; // default on
  return out;
}
export function setTypePref(type, on) {
  setPrefs({ types: { ...getTypePrefs(), [type]: on } });
}
export function typeEnabled(type) {
  return getTypePrefs()[type] !== false;
}

// Per-type sound selection. Each type defaults to the global sound.
export function getTypeSounds() {
  const p = getPrefs();
  const stored = p.sounds || {};
  const out = {};
  for (const k of Object.keys(NOTIF_TYPES)) out[k] = stored[k] || p.sound || 'chime';
  return out;
}
export function setTypeSound(type, key) {
  setPrefs({ sounds: { ...getTypeSounds(), [type]: key } });
}
export function typeSound(type) {
  return getTypeSounds()[type] || getPrefs().sound || 'chime';
}

// Play only if notifications are enabled globally AND for this type — using the type's own sound.
export function playIfEnabled(type) {
  const p = getPrefs();
  if (!p.enabled) return;
  if (type && !typeEnabled(type)) return;
  playSound(type ? typeSound(type) : undefined);
}
