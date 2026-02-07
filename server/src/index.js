import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';
import db, { initSchema } from './db.js';
import { genDemandNo, maskPhone } from './utils.js';
import { leadSchema } from './validation.js';

initSchema();
const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'dev_secret';
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('Admin@123', 10);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const publicLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true });

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: '未登录' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: '登录已过期' });
  }
};

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== adminUser || !bcrypt.compareSync(password, adminPasswordHash)) {
    return res.status(401).json({ message: '账号或密码错误' });
  }
  const token = jwt.sign({ username }, jwtSecret, { expiresIn: '10h' });
  res.json({ token });
});

app.get('/api/meta/sales', (_req, res) => {
  const list = db.prepare('SELECT name FROM sales_people ORDER BY id DESC').all();
  res.json(list.map((i) => i.name));
});

app.post('/api/public/lead', publicLimiter, (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: '表单校验失败', errors: parsed.error.flatten() });
  }
  const now = new Date().toISOString();
  const p = parsed.data;
  const insert = db.prepare(`INSERT INTO leads
    (payload, customer_name, phone, region, source, sales, community, expected_tile_date, budget_range, submitted_at, ip, ua, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = insert.run(
    JSON.stringify(p),
    p.basic.customerName,
    p.basic.phone,
    p.basic.region,
    p.basic.source,
    p.basic.sales || '',
    p.house.community,
    p.tilePlan.expectedTileDate,
    p.budget.budgetRange,
    now,
    req.ip,
    req.headers['user-agent'] || '',
    now
  );
  const demandNo = genDemandNo(result.lastInsertRowid);
  db.prepare('UPDATE leads SET demand_no = ? WHERE id = ?').run(demandNo, result.lastInsertRowid);
  res.json({ demandNo, submittedAt: now });
});

app.get('/api/admin/leads', auth, (req, res) => {
  const { page = 1, pageSize = 10, sales, source, status, community, customerName, phone } = req.query;
  const where = [];
  const params = {};
  const addLike = (field, key, value) => { if (value) { where.push(`${field} LIKE @${key}`); params[key] = `%${value}%`; } };
  addLike('sales', 'sales', sales);
  addLike('source', 'source', source);
  addLike('status', 'status', status);
  addLike('community', 'community', community);
  addLike('customer_name', 'customerName', customerName);
  addLike('phone', 'phone', phone);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as count FROM leads ${whereSql}`).get(params).count;
  const offset = (Number(page) - 1) * Number(pageSize);
  const list = db.prepare(`SELECT id,demand_no,customer_name,phone,source,sales,community,status,expected_tile_date,submitted_at
      FROM leads ${whereSql} ORDER BY id DESC LIMIT @pageSize OFFSET @offset`)
    .all({ ...params, pageSize: Number(pageSize), offset })
    .map((i) => ({ ...i, phoneMasked: maskPhone(i.phone) }));
  res.json({ total, list });
});

app.get('/api/admin/leads/:id', auth, (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ message: '线索不存在' });
  const followups = db.prepare('SELECT * FROM followups WHERE lead_id = ? ORDER BY id DESC').all(req.params.id);
  res.json({ ...lead, payload: JSON.parse(lead.payload), followups });
});

app.patch('/api/admin/leads/:id', auth, (req, res) => {
  const { status, payload } = req.body;
  const old = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ message: '线索不存在' });
  const mergedPayload = payload ? { ...JSON.parse(old.payload), ...payload } : JSON.parse(old.payload);
  db.prepare('UPDATE leads SET status=?, payload=?, updated_at=? WHERE id=?').run(status || old.status, JSON.stringify(mergedPayload), new Date().toISOString(), req.params.id);
  res.json({ message: '更新成功' });
});

app.post('/api/admin/leads/:id/followups', auth, (req, res) => {
  const { content, follower } = req.body;
  if (!content || !follower) return res.status(400).json({ message: '请填写完整' });
  db.prepare('INSERT INTO followups (lead_id, content, follower, created_at) VALUES (?, ?, ?, ?)')
    .run(req.params.id, content, follower, new Date().toISOString());
  res.json({ message: '添加成功' });
});

app.get('/api/admin/export', auth, async (req, res) => {
  const rows = db.prepare('SELECT demand_no,customer_name,phone,source,sales,community,status,expected_tile_date,submitted_at FROM leads ORDER BY id DESC').all();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('线索');
  ws.columns = [
    { header: '需求编号', key: 'demand_no', width: 20 },
    { header: '客户姓名', key: 'customer_name', width: 12 },
    { header: '手机号', key: 'phone', width: 15 },
    { header: '来源', key: 'source', width: 12 },
    { header: '导购', key: 'sales', width: 12 },
    { header: '小区', key: 'community', width: 20 },
    { header: '状态', key: 'status', width: 12 },
    { header: '用砖时间', key: 'expected_tile_date', width: 14 },
    { header: '提交时间', key: 'submitted_at', width: 22 }
  ];
  ws.addRows(rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});


const distPath = path.resolve('client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
