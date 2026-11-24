// Shared file-saver for base64 data URLs (attachments + images).
// Saves under /uploads/<subdir> and returns the public path + safe name.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploaded files must survive redeploys. The app folder (server/uploads) is
// replaced on every deploy from GitHub, so files are kept in a folder OUTSIDE
// the app: UPLOADS_DIR from .env, else ~/rumd-uploads. server/uploads stays as
// the legacy location (still served, and copied across once at startup).
export const LEGACY_UPLOADS_DIR = path.join(__dirname, 'uploads');
function pickDir() {
  const want = process.env.UPLOADS_DIR || path.join(os.homedir(), 'rumd-uploads');
  try { fs.mkdirSync(want, { recursive: true }); fs.accessSync(want, fs.constants.W_OK); return want; }
  catch (e) { console.warn('[uploads] cannot use', want, '-', e.message, '— falling back to', LEGACY_UPLOADS_DIR); return LEGACY_UPLOADS_DIR; }
}
let dirCache = null;
export const uploadsRoot = () => (dirCache ||= pickDir());

// Copy files that exist only in the legacy folder into the persistent one.
export function migrateLegacyUploads() {
  const root = uploadsRoot();
  if (path.resolve(root) === path.resolve(LEGACY_UPLOADS_DIR) || !fs.existsSync(LEGACY_UPLOADS_DIR)) return 0;
  let n = 0;
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(LEGACY_UPLOADS_DIR, rel), { withFileTypes: true })) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) walk(r);
      else if (e.isFile() && e.name !== '.gitkeep') {
        const dst = path.join(root, r);
        if (!fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(path.join(LEGACY_UPLOADS_DIR, r), dst); n++; }
      }
    }
  };
  walk('');
  return n;
}

// mime -> extension for allowed attachment types
const EXT = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
  'application/pdf': 'pdf', 'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};
const MAX_BYTES = 10 * 1024 * 1024;

// Returns { url, name } or throws { code }.
export function saveDataUrl(data, filename, subdir = 'attachments') {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(data || '');
  if (!m) throw { code: 'invalid_file' };
  const mime = m[1].toLowerCase();
  const ext = EXT[mime];
  if (!ext) throw { code: 'unsupported_type' };
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_BYTES) throw { code: 'too_large' };

  const base = String(filename || 'file').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_\-؀-ۿ ]/gi, '').slice(0, 60).trim() || 'file';
  const stored = `${Date.now()}-${Math.floor(Math.random() * 1e4)}.${ext}`;
  const dir = path.join(uploadsRoot(), subdir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, stored), buf);
  return { url: `/uploads/${subdir}/${stored}`, name: `${base}.${ext}` };
}
