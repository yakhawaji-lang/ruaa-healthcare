import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { Admins, isSuperAdmin, parsePerms } from '../db/queries.js';
import { signToken, requireAuth } from '../auth.js';

const shapeAdmin = (a) => ({ id: a.id, name: a.name, email: a.email, role: a.role, is_super: isSuperAdmin(a), permissions: parsePerms(a) });

const router = Router();

// Protect the login endpoint against brute force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing_credentials' });

  const admin = await Admins.byEmail(String(email).toLowerCase().trim());
  if (!admin) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  if (admin.is_active === 0) return res.status(403).json({ error: 'suspended' });
  const token = signToken(admin);
  res.json({ token, admin: shapeAdmin(admin) });
});

router.get('/me', requireAuth, async (req, res) => {
  const admin = await Admins.byId(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'not_found' });
  res.json({ admin: shapeAdmin(admin) });
});

export default router;
