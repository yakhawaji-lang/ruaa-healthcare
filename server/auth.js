// JWT-based auth for admins and for account users (visitors / insurance).
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const EXPIRES = process.env.JWT_EXPIRES || '7d';

/* ---- Admin ---- */
export function signToken(admin) {
  return jwt.sign({ id: admin.id, email: admin.email, role: admin.role, kind: 'admin' }, SECRET, { expiresIn: EXPIRES });
}
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.kind === 'user') return res.status(403).json({ error: 'forbidden' }); // user token cannot access admin
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

/* ---- Account users ---- */
export function signUserToken(user) {
  return jwt.sign({ uid: user.id, role: user.role, kind: 'user' }, SECRET, { expiresIn: EXPIRES });
}
export function requireUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.kind !== 'user') return res.status(403).json({ error: 'forbidden' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
// Guard a route to a specific account role.
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: 'wrong_role' });
    next();
  };
}
