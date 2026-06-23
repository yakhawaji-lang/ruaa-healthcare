// RU-MD REST API server (Express). Domain routers are mounted separately,
// mirroring the PlayTix 2.0 backend layout.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import accountRoutes from './routes/account.js';
import { requireAuth } from './auth.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', 1); // trust first proxy (Hostinger reverse proxy)
app.use(express.json({ limit: '12mb' })); // allow base64 image uploads

// Runtime-uploaded images (admin), persisted outside the build output.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Downloadable app file (APK) — kept outside dist so rebuilds don't remove it.
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: origins, credentials: true }));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', requireAuth, adminRoutes);

// In production, serve the built front-end (Vite output) from /dist.
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'), (err) => err && next());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`RU-MD API running on http://localhost:${PORT}`));
