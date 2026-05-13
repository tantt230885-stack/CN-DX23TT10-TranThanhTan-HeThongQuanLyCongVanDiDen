const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM cong_van_loai ORDER BY id DESC');
  res.json(rows);
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { ten_loai, mo_ta } = req.body;
  if (!ten_loai) return res.status(400).json({ message: 'Tên loại không được trống' });
  const [r] = await pool.query(
    'INSERT INTO cong_van_loai (ten_loai, mo_ta) VALUES (?,?)',
    [ten_loai, mo_ta || null]
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const { ten_loai, mo_ta } = req.body;
  await pool.query(
    'UPDATE cong_van_loai SET ten_loai = ?, mo_ta = ? WHERE id = ?',
    [ten_loai, mo_ta || null, req.params.id]
  );
  res.json({ updated: 1 });
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM cong_van_loai WHERE id = ?', [req.params.id]);
    res.json({ deleted: 1 });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Loại đang được sử dụng, không thể xoá' });
    }
    throw e;
  }
});

module.exports = router;
