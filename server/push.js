// Web Push sender — delivers system notifications to subscribed devices
// (admins' phones) even when the PWA is closed. No-ops gracefully if VAPID
// keys are not configured.
import webpush from 'web-push';
import { PushSubs } from './db/queries.js';

let configured = null; // null=unknown, true/false once checked
function ensure() {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC;
  const priv = process.env.VAPID_PRIVATE;
  if (!pub || !priv) { configured = false; return false; }
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@rumd.me', pub, priv);
    configured = true;
  } catch { configured = false; }
  return configured;
}

export function publicKey() { return process.env.VAPID_PUBLIC || ''; }

async function sendAll(subs, payloadObj) {
  if (!ensure() || !subs || !subs.length) return;
  const payload = JSON.stringify(payloadObj);
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 86400 }
      );
    } catch (e) {
      // 404/410 = subscription expired/unsubscribed → clean it up
      if (e && (e.statusCode === 404 || e.statusCode === 410)) {
        try { await PushSubs.removeByEndpoint(s.endpoint); } catch { /* ignore */ }
      }
    }
  }));
}

export async function pushToAdmins(p) {
  try { await sendAll(await PushSubs.listAdmins(), { title: p.title || 'رؤى', body: p.body || '', url: p.url || '/admin' }); }
  catch { /* ignore */ }
}

export async function pushToUser(uid, p) {
  try { await sendAll(await PushSubs.listUser(uid), { title: p.title || 'رؤى', body: p.body || '', url: p.url || '/portal' }); }
  catch { /* ignore */ }
}
