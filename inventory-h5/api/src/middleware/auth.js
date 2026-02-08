import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'replace-with-strong-secret');
    if (payload?.username !== (process.env.ADMIN_USERNAME || 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
