import { Router } from 'express';
import { pool } from '../db/index.js';

export const publicRouter = Router();

publicRouter.get('/items', async (req, res) => {
  const keyword = (req.query.keyword || '').trim();
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 100);
  const offset = (page - 1) * pageSize;

  const where = keyword ? `WHERE model ILIKE $1 OR name ILIKE $1` : '';
  const values = keyword ? [`%${keyword}%`, pageSize, offset] : [pageSize, offset];

  const listSql = keyword
    ? `SELECT * FROM inventory_items ${where} ORDER BY updated_at DESC LIMIT $2 OFFSET $3`
    : `SELECT * FROM inventory_items ORDER BY updated_at DESC LIMIT $1 OFFSET $2`;
  const countSql = keyword
    ? `SELECT COUNT(*)::int AS total FROM inventory_items ${where}`
    : `SELECT COUNT(*)::int AS total FROM inventory_items`;

  const [listResult, countResult] = await Promise.all([
    pool.query(listSql, values),
    pool.query(countSql, keyword ? [`%${keyword}%`] : [])
  ]);

  res.json({
    page,
    pageSize,
    total: countResult.rows[0].total,
    items: listResult.rows
  });
});

publicRouter.get('/items/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
  if (!rows.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.json(rows[0]);
});
