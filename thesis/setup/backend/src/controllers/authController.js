const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const [rows] = await pool.query(
    'SELECT id, username, password_hash, ho_ten, role, department_id, is_active FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Sai mật khẩu' });

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.department_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      ho_ten: user.ho_ten,
      role: user.role,
      department_id: user.department_id
    }
  });
}

async function me(req, res) {
  const [rows] = await pool.query(
    'SELECT id, username, ho_ten, email, role, department_id FROM users WHERE id = ?',
    [req.user.userId]
  );
  if (!rows[0]) return res.status(404).json({ message: 'User không tồn tại' });
  res.json(rows[0]);
}

module.exports = { login, me };
