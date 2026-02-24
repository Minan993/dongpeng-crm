require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const { pool } = require('./db');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const DEFAULT_VERSION = '2026年1.0';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, '../public')));

function requireWeComBrowser(req, res, next) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (!ua.includes('wxwork')) return res.status(403).send('请在企业微信内打开');
  return next();
}

function signSession(user) {
  return jwt.sign({ uid: user.id, role: user.role, wecom_userid: user.wecom_userid }, JWT_SECRET, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  const token = req.cookies.dp_session || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

function adminRequired(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  return next();
}

async function getAccessToken() {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${process.env.WECOM_CORP_ID}&corpsecret=${process.env.WECOM_APP_SECRET}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  if (data.errcode !== 0) throw new Error(data.errmsg || 'wecom token failed');
  return data.access_token;
}

function loginUrl(scope = 'snsapi_base', state = 'dp1972') {
  const redirect = encodeURIComponent(process.env.WECOM_REDIRECT_URI);
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.WECOM_CORP_ID}&redirect_uri=${redirect}&response_type=code&scope=${scope}&agentid=${process.env.WECOM_AGENT_ID}&state=${state}#wechat_redirect`;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/', requireWeComBrowser, (_req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/admin', requireWeComBrowser, (_req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));

app.get('/auth/wecom/login', requireWeComBrowser, (req, res) => {
  const scope = req.query.scope === 'snsapi_userinfo' ? 'snsapi_userinfo' : 'snsapi_base';
  res.redirect(loginUrl(scope));
});

app.get('/auth/wecom/callback', async (req, res) => {
  try {
    if (!req.query.code) return res.status(400).send('missing code');
    const token = await getAccessToken();
    const infoUrl = `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${token}&code=${req.query.code}`;
    const info = (await axios.get(infoUrl)).data;
    if (info.errcode !== 0 || !info.UserId) {
      return res.redirect('/auth/wecom/login?scope=snsapi_userinfo');
    }
    const detailUrl = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${token}&userid=${info.UserId}`;
    const detail = (await axios.get(detailUrl)).data;
    const name = detail.name || info.UserId;
    const dept = (detail.department || []).join(',');

    const { rows } = await pool.query(
      `INSERT INTO users(wecom_userid,name,department,last_login_at)
       VALUES($1,$2,$3,NOW())
       ON CONFLICT(wecom_userid) DO UPDATE SET name=EXCLUDED.name, department=EXCLUDED.department, last_login_at=NOW(), updated_at=NOW()
       RETURNING *`,
      [info.UserId, name, dept],
    );
    const sessionToken = signSession(rows[0]);
    res.cookie('dp_session', sessionToken, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 7 * 86400000 });
    res.redirect('/');
  } catch (e) {
    res.status(500).send(`login failed: ${e.message}`);
  }
});

app.get('/api/me', authRequired, async (req, res) => {
  const { rows } = await pool.query('SELECT id,wecom_userid,name,department,role,last_login_at FROM users WHERE id=$1', [req.user.uid]);
  res.json(rows[0]);
});

app.get('/api/products', authRequired, async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const offset = (page - 1) * pageSize;
  const orderBy = req.query.sortBy === 'price' ? 'price' : 'updated_at';
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
  const where = [];
  const params = [];

  const addLike = (field, value) => {
    params.push(`%${value}%`);
    where.push(`${field} ILIKE $${params.length}`);
  };

  if (req.query.search) {
    const v = `%${req.query.search}%`;
    params.push(v, v, v, v, v);
    where.push(`(model ILIKE $${params.length - 4} OR name ILIKE $${params.length - 3} OR spec ILIKE $${params.length - 2} OR channel_owner ILIKE $${params.length - 1} OR remark ILIKE $${params.length})`);
  }
  if (req.query.version) addLike('version', req.query.version);
  if (req.query.spec) addLike('spec', req.query.spec);
  if (req.query.grade) addLike('grade', req.query.grade);
  if (req.query.primary_secondary) addLike('primary_secondary', req.query.primary_secondary);
  if (req.query.channel_owner) {
    const list = String(req.query.channel_owner).split(',').filter(Boolean);
    if (list.length) {
      const marks = list.map((item) => {
        params.push(item);
        return `$${params.length}`;
      }).join(',');
      where.push(`channel_owner IN (${marks})`);
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const totalQ = await pool.query(`SELECT COUNT(1) FROM products ${whereSql}`, params);
  const dataQ = await pool.query(`SELECT p.*,u.name as updated_by_name FROM products p LEFT JOIN users u ON p.updated_by=u.id ${whereSql} ORDER BY ${orderBy} ${order} LIMIT ${pageSize} OFFSET ${offset}`, params);
  res.json({ total: Number(totalQ.rows[0].count), page, pageSize, data: dataQ.rows });
});

app.get('/api/products/:id', authRequired, async (req, res) => {
  const q = await pool.query('SELECT p.*,u.name as updated_by_name FROM products p LEFT JOIN users u ON p.updated_by=u.id WHERE p.id=$1', [req.params.id]);
  if (!q.rows[0]) return res.status(404).json({ message: 'Not found' });
  res.json(q.rows[0]);
});

async function logChange(client, { productId, userId, action, diff }) {
  await client.query('INSERT INTO change_logs(product_id,changed_by,action,diff_json) VALUES($1,$2,$3,$4)', [productId, userId, action, diff]);
}

app.post('/api/admin/products', authRequired, adminRequired, async (req, res) => {
  const c = await pool.connect();
  try {
    const p = req.body;
    const q = await c.query(`INSERT INTO products(channel_owner,model,name,spec,version,primary_secondary,grade,price,price_control,policy,remark,updated_by,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *`,
    [p.channel_owner, p.model, p.name, p.spec, p.version || DEFAULT_VERSION, p.primary_secondary, p.grade, p.price, p.price_control, p.policy, p.remark, req.user.uid]);
    await logChange(c, { productId: q.rows[0].id, userId: req.user.uid, action: 'create', diff: q.rows[0] });
    res.json(q.rows[0]);
  } finally { c.release(); }
});

app.put('/api/admin/products/:id', authRequired, adminRequired, async (req, res) => {
  const c = await pool.connect();
  try {
    const old = await c.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!old.rows[0]) return res.status(404).json({ message: 'Not found' });
    const p = { ...old.rows[0], ...req.body };
    const q = await c.query(`UPDATE products SET channel_owner=$1,model=$2,name=$3,spec=$4,version=$5,primary_secondary=$6,grade=$7,price=$8,price_control=$9,policy=$10,remark=$11,updated_by=$12,updated_at=NOW() WHERE id=$13 RETURNING *`,
    [p.channel_owner, p.model, p.name, p.spec, p.version, p.primary_secondary, p.grade, p.price, p.price_control, p.policy, p.remark, req.user.uid, req.params.id]);
    await logChange(c, { productId: Number(req.params.id), userId: req.user.uid, action: 'update', diff: { before: old.rows[0], after: q.rows[0] } });
    res.json(q.rows[0]);
  } finally { c.release(); }
});

app.delete('/api/admin/products/:id', authRequired, adminRequired, async (req, res) => {
  const c = await pool.connect();
  try {
    const old = await c.query('DELETE FROM products WHERE id=$1 RETURNING *', [req.params.id]);
    if (!old.rows[0]) return res.status(404).json({ message: 'Not found' });
    await logChange(c, { productId: Number(req.params.id), userId: req.user.uid, action: 'delete', diff: old.rows[0] });
    res.json({ ok: true });
  } finally { c.release(); }
});

app.post('/api/admin/products/import', authRequired, adminRequired, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'file required' });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(req.file.buffer);
  const ws = wb.worksheets[0];
  const c = await pool.connect();
  let created = 0; let updated = 0;
  try {
    for (let i = 2; i <= ws.rowCount; i += 1) {
      const row = ws.getRow(i);
      const [channel_owner, model, name, spec, version, primary_secondary, grade, price, price_control, policy, remark] = row.values.slice(1);
      if (!model || !spec || !channel_owner) continue;
      const v = version || DEFAULT_VERSION;
      const exists = await c.query('SELECT * FROM products WHERE version=$1 AND model=$2 AND spec=$3 AND channel_owner=$4', [v, model, spec, channel_owner]);
      if (exists.rows[0]) {
        const q = await c.query(`UPDATE products SET name=$1,primary_secondary=$2,grade=$3,price=$4,price_control=$5,policy=$6,remark=$7,updated_by=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
          [name, primary_secondary, grade, price, price_control, policy, remark, req.user.uid, exists.rows[0].id]);
        updated += 1;
        await logChange(c, { productId: q.rows[0].id, userId: req.user.uid, action: 'import', diff: { before: exists.rows[0], after: q.rows[0] } });
      } else {
        const q = await c.query(`INSERT INTO products(channel_owner,model,name,spec,version,primary_secondary,grade,price,price_control,policy,remark,updated_by,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *`, [channel_owner, model, name, spec, v, primary_secondary, grade, price, price_control, policy, remark, req.user.uid]);
        created += 1;
        await logChange(c, { productId: q.rows[0].id, userId: req.user.uid, action: 'import', diff: q.rows[0] });
      }
    }
    res.json({ created, updated });
  } finally { c.release(); }
});

app.get('/api/admin/products/export', authRequired, adminRequired, async (req, res) => {
  const q = await pool.query('SELECT channel_owner,model,name,spec,version,primary_secondary,grade,price,price_control,policy,remark FROM products ORDER BY updated_at DESC');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('products');
  ws.addRow(['渠道归属', '产品型号', '产品名称', '产品规格', '版本', '主次', '5A/4A/常规', '价格', '控价', '政策', '备注']);
  q.rows.forEach((r) => ws.addRow([r.channel_owner, r.model, r.name, r.spec, r.version, r.primary_secondary, r.grade, r.price, r.price_control, r.policy, r.remark]));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

app.post('/api/admin/versions', authRequired, adminRequired, async (req, res) => {
  const { name, from_version } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const c = await pool.connect();
  try {
    await c.query('INSERT INTO versions(name,created_by) VALUES($1,$2)', [name, req.user.uid]);
    if (from_version) {
      await c.query(`INSERT INTO products(channel_owner,model,name,spec,version,primary_secondary,grade,price,price_control,policy,remark,updated_by,updated_at,created_at)
      SELECT channel_owner,model,name,spec,$1,primary_secondary,grade,price,price_control,policy,remark,$2,NOW(),NOW()
      FROM products WHERE version=$3`, [name, req.user.uid, from_version]);
    }
    res.json({ ok: true });
  } finally { c.release(); }
});

app.route('/api/admin/users')
  .get(authRequired, adminRequired, async (_req, res) => {
    const q = await pool.query('SELECT id,wecom_userid,name,department,role,last_login_at FROM users ORDER BY id DESC');
    res.json(q.rows);
  })
  .post(authRequired, adminRequired, async (req, res) => {
    const { id, role } = req.body;
    await pool.query('UPDATE users SET role=$1,updated_at=NOW() WHERE id=$2', [role, id]);
    res.json({ ok: true });
  });

app.get('/api/admin/logs', authRequired, adminRequired, async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const offset = (page - 1) * pageSize;
  const q = await pool.query(`SELECT l.*,u.name as changed_by_name FROM change_logs l LEFT JOIN users u ON l.changed_by=u.id ORDER BY l.changed_at DESC LIMIT ${pageSize} OFFSET ${offset}`);
  res.json(q.rows);
});

app.get('/api/admin/template', authRequired, adminRequired, async (_req, res) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('template');
  ws.addRow(['渠道归属', '产品型号', '产品名称', '产品规格', '版本', '主次', '5A/4A/常规', '价格', '控价', '政策', '备注']);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
