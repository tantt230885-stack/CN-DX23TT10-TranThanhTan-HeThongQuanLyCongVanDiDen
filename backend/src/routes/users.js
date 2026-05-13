const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.username, u.ho_ten, u.email, u.role, u.is_active,
           u.department_id, d.ten_phong_ban, u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY u.id DESC
  `);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { username, password, ho_ten, email, role, department_id } = req.body;
  if (!username || !password || !ho_ten || !role) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, ho_ten, email, role, department_id)
       VALUES (?,?,?,?,?,?)`,
      [username, hash, ho_ten, email || null, role, department_id || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const { ho_ten, email, role, department_id, is_active, password } = req.body;
  const fields = [];
  const values = [];
  if (ho_ten !== undefined) {
    fields.push('ho_ten = ?');
    values.push(ho_ten);
  }
  if (email !== undefined) {
    fields.push('email = ?');
    values.push(email);
  }
  if (role !== undefined) {
    fields.push('role = ?');
    values.push(role);
  }
  if (department_id !== undefined) {
    fields.push('department_id = ?');
    values.push(department_id);
  }
  if (is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(is_active ? 1 : 0);
  }
  if (password) {
    fields.push('password_hash = ?');
    values.push(await bcrypt.hash(password, 10));
  }
  if (!fields.length) return res.json({ updated: 0 });
  values.push(req.params.id);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  res.json({ updated: 1 });
});

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.userId) {
    return res.status(400).json({ message: 'Không thể xoá chính tài khoản đang đăng nhập' });
  }
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ deleted: 1 });
});

module.exports = router;
