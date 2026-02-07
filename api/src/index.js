import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { stringify } from 'csv-stringify/sync';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'dongpeng_crm',
});

const LEAD_STATUS = ['新线索', '已联系', '已量房', '已报价', '已下定', '已成交', '已流失'];
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '123';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-secret';

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      lead_no TEXT UNIQUE NOT NULL,
      data JSONB NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      source TEXT NOT NULL,
      store TEXT NOT NULL,
      staff TEXT NOT NULL,
      community TEXT NOT NULL,
      expected_tile_time TEXT,
      status TEXT NOT NULL DEFAULT '新线索',
      next_follow_up_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_notes (
      id BIGSERIAL PRIMARY KEY,
      lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
  `);
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: '未授权' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token 无效' });
  }
}

function toLeadNo(id) {
  const date = new Date();
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `DP${y}${m}${d}${String(id).padStart(6, '0')}`;
}

app.get('/api/health', async (_, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ message: '账号或密码错误' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.post('/api/leads', async (req, res) => {
  const data = req.body || {};
  const needCompany = ['全包', '整装公司'].includes(data.decorationMode);
  if (!data.customerName || !/^1\d{10}$/.test(data.phone || '') || !data.source || !data.store || !data.staff || !data.community || !data.houseType || !data.layout || !data.buildingArea || !data.currentStage || !data.decorationMode || (needCompany && !data.companyName) || !data.budgetRange || !data.expectedTileTime) {
    return res.status(400).json({ message: '请完善必填字段并检查手机号格式' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insert = await client.query(
      `INSERT INTO leads (lead_no, data, customer_name, phone, source, store, staff, community, expected_tile_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      ['PENDING', data, data.customerName, data.phone, data.source, data.store, data.staff, data.community, data.expectedTileTime]
    );
    const id = insert.rows[0].id;
    const leadNo = toLeadNo(id);
    await client.query('UPDATE leads SET lead_no=$1 WHERE id=$2', [leadNo, id]);
    await client.query('COMMIT');
    res.json({ leadId: leadNo, id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: '提交失败', error: e.message });
  } finally {
    client.release();
  }
});

app.get('/api/leads', auth, async (req, res) => {
  const { page = 1, pageSize = 20, status, store, staff, source, keyword, startDate, endDate } = req.query;
  const where = [];
  const values = [];
  let i = 1;
  if (status) { where.push(`status = $${i++}`); values.push(status); }
  if (store) { where.push(`store = $${i++}`); values.push(store); }
  if (staff) { where.push(`staff = $${i++}`); values.push(staff); }
  if (source) { where.push(`source = $${i++}`); values.push(source); }
  if (startDate) { where.push(`created_at >= $${i++}`); values.push(startDate); }
  if (endDate) { where.push(`created_at <= $${i++}`); values.push(endDate); }
  if (keyword) {
    where.push(`(customer_name ILIKE $${i} OR phone ILIKE $${i} OR community ILIKE $${i})`);
    values.push(`%${keyword}%`); i++;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const list = await pool.query(
    `SELECT id, lead_no, customer_name, phone, store, staff, source, expected_tile_time, status, next_follow_up_at, created_at
      FROM leads ${whereSql} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
    [...values, limit, offset]
  );
  const total = await pool.query(`SELECT COUNT(*)::int AS total FROM leads ${whereSql}`, values);
  res.json({ items: list.rows, total: total.rows[0].total });
});

app.get('/api/leads/:id', auth, async (req, res) => {
  const { id } = req.params;
  const lead = await pool.query('SELECT * FROM leads WHERE id=$1 OR lead_no=$1', [id]);
  if (!lead.rows.length) return res.status(404).json({ message: '未找到记录' });
  const notes = await pool.query('SELECT * FROM lead_notes WHERE lead_id=$1 ORDER BY created_at DESC', [lead.rows[0].id]);
  res.json({ ...lead.rows[0], notes: notes.rows });
});

app.patch('/api/leads/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { status, nextFollowUpAt } = req.body || {};
  if (status && !LEAD_STATUS.includes(status)) {
    return res.status(400).json({ message: '状态值无效' });
  }
  const result = await pool.query(
    `UPDATE leads SET status = COALESCE($1, status), next_follow_up_at = $2, updated_at = NOW()
      WHERE id=$3 OR lead_no=$3 RETURNING *`,
    [status || null, nextFollowUpAt || null, id]
  );
  if (!result.rows.length) return res.status(404).json({ message: '未找到记录' });
  res.json(result.rows[0]);
});

app.post('/api/leads/:id/notes', auth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ message: '跟进内容不能为空' });
  const lead = await pool.query('SELECT id FROM leads WHERE id=$1 OR lead_no=$1', [id]);
  if (!lead.rows.length) return res.status(404).json({ message: '未找到记录' });
  const note = await pool.query('INSERT INTO lead_notes (lead_id, content) VALUES ($1, $2) RETURNING *', [lead.rows[0].id, content]);
  res.json(note.rows[0]);
});

app.get('/api/export', auth, async (req, res) => {
  if ((req.query.format || 'csv') !== 'csv') return res.status(400).json({ message: '仅支持 CSV' });
  const result = await pool.query('SELECT lead_no, customer_name, phone, store, staff, source, community, expected_tile_time, status, next_follow_up_at, created_at FROM leads ORDER BY created_at DESC');
  const csv = stringify(result.rows, { header: true });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${Date.now()}.csv"`);
  res.send(`\uFEFF${csv}`);
});

const port = Number(process.env.API_PORT || 3000);
initDb().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`API running on ${port}`);
  });
}).catch((e) => {
  console.error('DB init failed', e);
  process.exit(1);
});
