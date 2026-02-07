import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDb } from './db/index.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true, db: 'up' });
  } catch {
    return res.json({ ok: true, db: 'down' });
  }
});

app.use('/api', authRouter);
app.use('/api', publicRouter);
app.use('/api', adminRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 3000);

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to init db', error);
    process.exit(1);
  });
