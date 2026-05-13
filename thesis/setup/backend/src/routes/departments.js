const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM departments ORDER BY id ASC');
  res.json(rows);
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { ten_phong_ban, mo_ta } = req.body;
  if (!ten_phong_ban) return res.status(400).json({ message: 'Tên phòng ban không được trống' });
  const [r] = await pool.query(
    'INSERT INTO departments (ten_phong_ban, mo_ta) VALUES (?,?)',
    [ten_phong_ban, mo_ta || null]
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const { ten_phong_ban, mo_ta } = req.body;
  await pool.query(
    'UPDATE departments SET ten_phong_ban = ?, mo_ta = ? WHERE id = ?',
    [ten_phong_ban, mo_ta || null, req.params.id]
  );
  res.json({ updated: 1 });
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ deleted: 1 });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Phòng ban đang được tham chiếu, không thể xoá' });
    }
    throw e;
  }
});

module.exports = router;
