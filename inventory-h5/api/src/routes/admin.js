import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });

export const adminRouter = Router();

adminRouter.use('/admin', requireAdmin);

adminRouter.post('/admin/items', async (req, res) => {
  const { model, name, brand, spec, batch, qty, remark } = req.body || {};
  if (!model || !name || qty === undefined || qty === null || Number(qty) < 0 || !Number.isInteger(Number(qty))) {
    return res.status(400).json({ error: '字段校验失败' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO inventory_items (model, name, brand, spec, batch, qty, remark)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [model.trim(), name.trim(), brand || null, spec || null, batch || null, Number(qty), remark || null]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

adminRouter.put('/admin/items/:id', async (req, res) => {
  const { model, name, brand, spec, batch, qty, remark } = req.body || {};
  if (!model || !name || qty === undefined || qty === null || Number(qty) < 0 || !Number.isInteger(Number(qty))) {
    return res.status(400).json({ error: '字段校验失败' });
  }
  const { rows } = await pool.query(
    `UPDATE inventory_items SET model=$1, name=$2, brand=$3, spec=$4, batch=$5, qty=$6, remark=$7
     WHERE id=$8 RETURNING *`,
    [model.trim(), name.trim(), brand || null, spec || null, batch || null, Number(qty), remark || null, req.params.id]
  );
  if (!rows.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.json(rows[0]);
});

adminRouter.delete('/admin/items/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM inventory_items WHERE id=$1', [req.params.id]);
  return res.json({ ok: result.rowCount > 0 });
});

adminRouter.post('/admin/items/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传 CSV 文件' });
  }
  const content = req.file.buffer.toString('utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  let inserted = 0;
  for (const row of records) {
    const model = row.model;
    const name = row.name;
    const qty = Number(row.qty);
    if (!model || !name || !Number.isInteger(qty) || qty < 0) {
      continue;
    }
    await pool.query(
      `INSERT INTO inventory_items (model,name,brand,spec,batch,qty,remark)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (model) DO UPDATE SET
         name=EXCLUDED.name,
         brand=EXCLUDED.brand,
         spec=EXCLUDED.spec,
         batch=EXCLUDED.batch,
         qty=EXCLUDED.qty,
         remark=EXCLUDED.remark`,
      [model, name, row.brand || null, row.spec || null, row.batch || null, qty, row.remark || null]
    );
    inserted += 1;
  }
  return res.json({ ok: true, processed: records.length, upserted: inserted });
});

adminRouter.get('/admin/items/export', async (req, res) => {
  const keyword = (req.query.keyword || '').trim();
  const { rows } = await pool.query(
    keyword
      ? 'SELECT * FROM inventory_items WHERE model ILIKE $1 OR name ILIKE $1 ORDER BY updated_at DESC'
      : 'SELECT * FROM inventory_items ORDER BY updated_at DESC',
    keyword ? [`%${keyword}%`] : []
  );

  const csv = stringify(rows, {
    header: true,
    columns: ['id', 'model', 'name', 'brand', 'spec', 'batch', 'qty', 'remark', 'created_at', 'updated_at']
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory-export.csv"');
  return res.send(csv);
});
