const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

/** WHERE clause for cong_van (optional table alias, e.g. cv) */
function buildDateWhere(from, to, tableAlias) {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  const where = [];
  const params = [];
  if (from) {
    where.push(`DATE(${prefix}created_at) >= ?`);
    params.push(from);
  }
  if (to) {
    where.push(`DATE(${prefix}created_at) <= ?`);
    params.push(to);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

/** Extra AND ... conditions for joining cong_van (alias cv) on date range */
function buildCvDateJoin(from, to, alias = 'cv') {
  const parts = [];
  const params = [];
  if (from) {
    parts.push(`DATE(${alias}.created_at) >= ?`);
    params.push(from);
  }
  if (to) {
    parts.push(`DATE(${alias}.created_at) <= ?`);
    params.push(to);
  }
  return { sql: parts.length ? ` AND ${parts.join(' AND ')}` : '', params };
}

// GET /api/reports/summary — counts per status
router.get('/summary', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { sql, params } = buildDateWhere(from, to);
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS total FROM cong_van ${sql} GROUP BY status`,
      params
    );
    const result = { moi: 0, dang_xu_ly: 0, da_xu_ly: 0, luu_tru: 0, total: 0 };
    for (const r of rows) {
      result[r.status] = Number(r.total);
      result.total += Number(r.total);
    }
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/by-category — count per document type (all categories, zero if none)
router.get('/by-category', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { sql: dateOnJoin, params } = buildCvDateJoin(from, to, 'cv');
    const [rows] = await pool.query(
      `SELECT l.id, l.ten_loai, COUNT(cv.id) AS total
       FROM cong_van_loai l
       LEFT JOIN cong_van cv ON cv.loai_id = l.id${dateOnJoin}
       GROUP BY l.id, l.ten_loai
       ORDER BY total DESC`,
      params
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/by-department — documents currently held per department
router.get('/by-department', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { sql: dateOnJoin, params } = buildCvDateJoin(from, to, 'cv');
    const [rows] = await pool.query(
      `SELECT d.id, d.ten_phong_ban, COUNT(cv.id) AS total
       FROM departments d
       LEFT JOIN cong_van cv ON cv.current_department_id = d.id${dateOnJoin}
       GROUP BY d.id, d.ten_phong_ban
       ORDER BY total DESC`,
      params
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/by-month?year=YYYY
router.get('/by-month', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT MONTH(created_at) AS thang, COUNT(*) AS total
       FROM cong_van
       WHERE YEAR(created_at) = ?
       GROUP BY MONTH(created_at)
       ORDER BY thang`,
      [year]
    );
    const result = Array.from({ length: 12 }, (_, i) => ({ thang: i + 1, total: 0 }));
    for (const r of rows) {
      result[r.thang - 1].total = Number(r.total);
    }
    res.json({ year, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/recent — latest 10 documents (dashboard)
router.get('/recent', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT cv.id, cv.so_cong_van, cv.trich_yeu, cv.loai_cong_van, cv.status,
              cv.created_at, l.ten_loai
       FROM cong_van cv
       LEFT JOIN cong_van_loai l ON cv.loai_id = l.id
       ORDER BY cv.created_at DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
