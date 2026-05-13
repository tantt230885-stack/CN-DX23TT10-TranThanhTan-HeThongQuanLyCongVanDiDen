const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const upload = require('../utils/upload');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const uploadsRoot = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

// truong_phong có quyền như phong_ban về mặt visibility
const isDeptUser = (role) => role === 'phong_ban' || role === 'truong_phong';

// GET /api/documents — list with filters and role-based visibility
router.get('/', async (req, res, next) => {
  try {
    const { loai_cong_van, status, loai_id, department_id, from, to, q, da_chuyen } = req.query;
    const where = [];
    const params = [];

    if (loai_cong_van) { where.push('cv.loai_cong_van = ?'); params.push(loai_cong_van); }
    if (status) { where.push('cv.status = ?'); params.push(status); }
    if (loai_id) { where.push('cv.loai_id = ?'); params.push(loai_id); }
    if (department_id) { where.push('cv.current_department_id = ?'); params.push(department_id); }
    if (from) { where.push('DATE(cv.created_at) >= ?'); params.push(from); }
    if (to) { where.push('DATE(cv.created_at) <= ?'); params.push(to); }
    if (q) {
      where.push('(cv.so_cong_van LIKE ? OR cv.trich_yeu LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    // Visibility + da_chuyen filter (role-aware)
    let daChuyenSelect = '';
    const deptId = parseInt(req.user.departmentId, 10);

    if (isDeptUser(req.user.role)) {
      if (da_chuyen === '1') {
        // Docs this dept forwarded away (from_department_id = deptId) AND no longer here
        where.push(`cv.id IN (SELECT cong_van_id FROM cong_van_chuyen_tiep WHERE from_department_id = ?)`);
        where.push(`(cv.current_department_id IS NULL OR cv.current_department_id != ?)`);
        params.push(deptId, deptId);
        // Subquery: last dept this dept forwarded the doc to
        daChuyenSelect = `,(SELECT d2.ten_phong_ban FROM cong_van_chuyen_tiep ct2
          JOIN departments d2 ON ct2.to_department_id = d2.id
          WHERE ct2.cong_van_id = cv.id AND ct2.from_department_id = ${deptId}
          ORDER BY ct2.forwarded_at DESC LIMIT 1) AS da_chuyen_den_name`;
      } else {
        // Main list: only docs currently at this dept
        where.push(`cv.current_department_id = ?`);
        params.push(deptId);
        // Subquery: which dept forwarded this doc TO this dept (most recent)
        daChuyenSelect = `,(SELECT d2.ten_phong_ban FROM cong_van_chuyen_tiep ct2
          JOIN departments d2 ON ct2.from_department_id = d2.id
          WHERE ct2.cong_van_id = cv.id AND ct2.to_department_id = ${deptId}
          ORDER BY ct2.forwarded_at DESC LIMIT 1) AS chuyen_tu_name`;
      }
    } else {
      // admin / van_thu — see all docs, filtered by forwarded status
      if (da_chuyen === '1') {
        where.push('cv.id IN (SELECT DISTINCT cong_van_id FROM cong_van_chuyen_tiep)');
        // da_chuyen_den_name = current holder (current_dept_name aliased separately)
        daChuyenSelect = `,d.ten_phong_ban AS da_chuyen_den_name`;
      } else if (da_chuyen === '0') {
        where.push('cv.id NOT IN (SELECT DISTINCT cong_van_id FROM cong_van_chuyen_tiep)');
      }
    }

    const sql = `
    SELECT cv.*, l.ten_loai, d.ten_phong_ban AS current_dept_name,
           u.ho_ten AS created_by_name${daChuyenSelect}
    FROM cong_van cv
    LEFT JOIN cong_van_loai l ON cv.loai_id = l.id
    LEFT JOIN departments d ON cv.current_department_id = d.id
    LEFT JOIN users u ON cv.created_by = u.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY cv.created_at DESC
    LIMIT 500
  `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/documents/:id — detail with files, forward history, and confirmation history
router.get('/:id', async (req, res, next) => {
  try {
    const [[doc]] = await pool.query(
      `SELECT cv.*, l.ten_loai, d.ten_phong_ban AS current_dept_name,
            u.ho_ten AS created_by_name
     FROM cong_van cv
     LEFT JOIN cong_van_loai l ON cv.loai_id = l.id
     LEFT JOIN departments d ON cv.current_department_id = d.id
     LEFT JOIN users u ON cv.created_by = u.id
     WHERE cv.id = ?`,
      [req.params.id]
    );
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy công văn' });

    const [files] = await pool.query(
      'SELECT id, file_name, file_path, file_size, mime_type, uploaded_at FROM cong_van_file WHERE cong_van_id = ?',
      [req.params.id]
    );
    const [history] = await pool.query(
      `SELECT ct.*, df.ten_phong_ban AS from_dept, dt.ten_phong_ban AS to_dept,
            u.ho_ten AS forwarded_by_name
     FROM cong_van_chuyen_tiep ct
     LEFT JOIN departments df ON ct.from_department_id = df.id
     LEFT JOIN departments dt ON ct.to_department_id = dt.id
     LEFT JOIN users u ON ct.forwarded_by = u.id
     WHERE ct.cong_van_id = ?
     ORDER BY ct.forwarded_at ASC`,
      [req.params.id]
    );
    const [confirmations] = await pool.query(
      `SELECT xn.*, u.ho_ten AS confirmed_by_name, u.role AS confirmed_by_role,
              d.ten_phong_ban AS confirmed_by_dept
       FROM cong_van_xac_nhan xn
       LEFT JOIN users u ON xn.confirmed_by = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE xn.cong_van_id = ?
       ORDER BY xn.confirmed_at ASC`,
      [req.params.id]
    );
    res.json({ ...doc, files, history, confirmations });
  } catch (e) {
    next(e);
  }
});

// POST /api/documents — create (optional PDF via multipart field "file")
router.post('/', requireRole('admin', 'van_thu'), upload.single('file'), async (req, res, next) => {
  const {
    so_cong_van, trich_yeu, loai_id, loai_cong_van,
    ngay_ban_hanh, ngay_tiep_nhan, noi_gui, noi_nhan, do_khan
  } = req.body;

  if (!so_cong_van || !trich_yeu || !loai_id || !loai_cong_van) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [r] = await conn.query(
      `INSERT INTO cong_van
        (so_cong_van, trich_yeu, loai_id, loai_cong_van,
         ngay_ban_hanh, ngay_tiep_nhan, noi_gui, noi_nhan, do_khan,
         status, created_by)
       VALUES (?,?,?,?,?,?,?,?,?, 'moi', ?)`,
      [so_cong_van, trich_yeu, loai_id, loai_cong_van,
        ngay_ban_hanh || null, ngay_tiep_nhan || null,
        noi_gui || null, noi_nhan || null, do_khan || 'thuong',
        req.user.userId]
    );
    const docId = r.insertId;

    if (req.file) {
      const rel = path.relative(uploadsRoot, req.file.path).replace(/\\/g, '/');
      await conn.query(
        `INSERT INTO cong_van_file (cong_van_id, file_name, file_path, file_size, mime_type)
         VALUES (?,?,?,?,?)`,
        [docId, req.file.originalname, rel, req.file.size, req.file.mimetype]
      );
    }

    await conn.commit();
    res.status(201).json({ id: docId });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// PUT /api/documents/:id — update metadata (no file upload)
router.put('/:id', requireRole('admin', 'van_thu'), async (req, res, next) => {
  try {
    const allowed = ['so_cong_van', 'trich_yeu', 'loai_id', 'loai_cong_van',
      'ngay_ban_hanh', 'ngay_tiep_nhan', 'noi_gui', 'noi_nhan', 'do_khan'];
    const fields = [];
    const values = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { fields.push(`${k} = ?`); values.push(req.body[k]); }
    }
    if (!fields.length) return res.json({ updated: 0 });
    values.push(req.params.id);
    await pool.query(`UPDATE cong_van SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ updated: 1 });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/documents/:id — admin only
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const [files] = await pool.query(
      'SELECT file_path FROM cong_van_file WHERE cong_van_id = ?', [req.params.id]
    );
    await pool.query('DELETE FROM cong_van WHERE id = ?', [req.params.id]);
    for (const f of files) {
      const abs = path.join(uploadsRoot, f.file_path);
      fs.unlink(abs, () => {});
    }
    res.json({ deleted: 1 });
  } catch (e) {
    next(e);
  }
});

// POST /api/documents/:id/forward
// Chỉ admin, van_thu, truong_phong mới được chuyển tiếp.
// Nếu công văn đang thuộc phòng ban (current_department_id != null) thì phải có ít nhất 1 xác nhận thực hiện.
router.post('/:id/forward', requireRole('admin', 'van_thu', 'truong_phong'), async (req, res, next) => {
  const { to_department_id, ghi_chu } = req.body;
  if (!to_department_id) return res.status(400).json({ message: 'Thiếu phòng ban đích' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[doc]] = await conn.query(
      'SELECT current_department_id, status FROM cong_van WHERE id = ?', [req.params.id]
    );
    if (!doc) {
      await conn.rollback();
      return res.status(404).json({ message: 'Công văn không tồn tại' });
    }

    // Nếu công văn đã được giao cho phòng ban, kiểm tra phải có ít nhất 1 xác nhận thực hiện
    if (doc.current_department_id !== null) {
      const [[{ cnt }]] = await conn.query(
        'SELECT COUNT(*) AS cnt FROM cong_van_xac_nhan WHERE cong_van_id = ?',
        [req.params.id]
      );
      if (cnt === 0) {
        await conn.rollback();
        return res.status(400).json({
          message: 'Công văn chưa được xác nhận thực hiện. Cần ít nhất một nhân viên xác nhận trước khi chuyển tiếp.'
        });
      }
    }

    await conn.query(
      `INSERT INTO cong_van_chuyen_tiep
        (cong_van_id, from_department_id, to_department_id, forwarded_by, ghi_chu, status_at_forward)
       VALUES (?,?,?,?,?,?)`,
      [req.params.id, doc.current_department_id || null, to_department_id,
        req.user.userId, ghi_chu || null, doc.status]
    );
    const newStatus = doc.status === 'moi' ? 'dang_xu_ly' : doc.status;
    await conn.query(
      'UPDATE cong_van SET current_department_id = ?, status = ? WHERE id = ?',
      [to_department_id, newStatus, req.params.id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// POST /api/documents/:id/confirm — xác nhận thực hiện (phong_ban và truong_phong)
// Mỗi nhân viên chỉ xác nhận được 1 lần cho mỗi công văn.
router.post('/:id/confirm', requireRole('phong_ban', 'truong_phong'), async (req, res, next) => {
  try {
    const { noi_dung } = req.body;

    const [[doc]] = await pool.query(
      'SELECT current_department_id FROM cong_van WHERE id = ?', [req.params.id]
    );
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy công văn' });

    // Chỉ nhân viên thuộc phòng ban đang giữ công văn mới được xác nhận
    if (doc.current_department_id !== req.user.departmentId) {
      return res.status(403).json({ message: 'Công văn không thuộc phòng ban của bạn' });
    }

    await pool.query(
      `INSERT INTO cong_van_xac_nhan (cong_van_id, confirmed_by, noi_dung) VALUES (?, ?, ?)`,
      [req.params.id, req.user.userId, noi_dung || null]
    );

    // Tự động chuyển trạng thái sang đang_xu_ly nếu đang là moi
    await pool.query(
      `UPDATE cong_van SET status = 'dang_xu_ly' WHERE id = ? AND status = 'moi'`,
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Bạn đã xác nhận thực hiện công văn này rồi' });
    }
    next(e);
  }
});

// PATCH /api/documents/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['moi', 'dang_xu_ly', 'da_xu_ly', 'luu_tru'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

    if (isDeptUser(req.user.role)) {
      const [[doc]] = await pool.query(
        'SELECT current_department_id FROM cong_van WHERE id = ?', [req.params.id]
      );
      if (!doc) return res.status(404).json({ message: 'Không tìm thấy' });
      if (doc.current_department_id !== req.user.departmentId) {
        return res.status(403).json({ message: 'Công văn không thuộc phòng ban của bạn' });
      }
    }

    await pool.query('UPDATE cong_van SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// GET /api/documents/:id/file/:fileId — stream PDF (auth required)
router.get('/:id/file/:fileId', async (req, res, next) => {
  try {
    const [[file]] = await pool.query(
      'SELECT * FROM cong_van_file WHERE id = ? AND cong_van_id = ?',
      [req.params.fileId, req.params.id]
    );
    if (!file) return res.status(404).json({ message: 'File không tồn tại' });
    const abs = path.join(uploadsRoot, file.file_path);
    res.setHeader('Content-Type', file.mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.file_name)}"`);
    fs.createReadStream(abs).pipe(res);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
