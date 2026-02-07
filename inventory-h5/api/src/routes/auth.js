import { Router } from 'express';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

authRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '123';

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET || 'replace-with-strong-secret', {
    expiresIn: '12h'
  });

  return res.json({ token, username });
});
