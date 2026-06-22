// Shared file-saver for base64 data URLs (attachments + images).
// Saves under /uploads/<subdir> and returns the public path + safe name.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');

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
  const dir = path.join(uploadsDir, subdir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, stored), buf);
  return { url: `/uploads/${subdir}/${stored}`, name: `${base}.${ext}` };
}
