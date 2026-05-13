import { useEffect, useState } from 'react';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SEO from '../../components/SEO';

const ROLES = [
  { value: 'admin', label: 'Quản trị' },
  { value: 'van_thu', label: 'Văn thư' },
  { value: 'truong_phong', label: 'Trưởng phòng' },
  { value: 'phong_ban', label: 'Nhân viên phòng ban' }
];

export default function Users() {
  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/users').then(r => setList(r.data));
  useEffect(() => {
    load();
    api.get('/departments').then(r => setDepartments(r.data));
  }, []);

  const save = async (form) => {
    if (editing.id) {
      const body = { ...form };
      if (!body.password) delete body.password;
      await api.put(`/users/${editing.id}`, body);
    } else {
      await api.post('/users', form);
    }
    setEditing(null);
    load();
  };

  const remove = async () => {
    try {
      await api.delete(`/users/${confirm.id}`);
      setConfirm(null);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div>
      <SEO title="Người dùng" description="Quản lý tài khoản và phân quyền người dùng trong hệ thống." />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản lý người dùng</h2>
        <button className="btn" onClick={() => setEditing({})}>+ Thêm người dùng</button>
      </div>

      <DataTable
        columns={[
          { key: 'username', label: 'Tên đăng nhập' },
          { key: 'ho_ten', label: 'Họ tên' },
          { key: 'role', label: 'Vai trò', render: r => ROLES.find(x => x.value === r.role)?.label },
          { key: 'ten_phong_ban', label: 'Phòng ban' },
          { key: 'is_active', label: 'Trạng thái', render: r => r.is_active ? 'Hoạt động' : 'Khóa' }
        ]}
        data={list}
        actions={(row) => (<>
          <button className="btn" onClick={() => setEditing(row)}>Sửa</button>
          <button className="btn btn-danger" onClick={() => setConfirm(row)}>Xoá</button>
        </>)}
      />

      {editing && <UserForm
        initial={editing}
        departments={departments}
        onCancel={() => setEditing(null)}
        onSubmit={save}
      />}

      <ConfirmDialog
        open={!!confirm}
        message={`Xoá người dùng "${confirm?.username}"?`}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </div>
  );
}

function UserForm({ initial, departments, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    username: initial.username || '',
    password: '',
    ho_ten: initial.ho_ten || '',
    email: initial.email || '',
    role: initial.role || 'phong_ban',
    department_id: initial.department_id || '',
    is_active: initial.is_active ?? 1
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open title={initial.id ? 'Sửa người dùng' : 'Thêm người dùng'} onClose={onCancel}
      footer={<>
        <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
        <button className="btn" onClick={() => onSubmit(form)}>Lưu</button>
      </>}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label>Tên đăng nhập
          <input value={form.username} disabled={!!initial.id}
            onChange={e => set('username', e.target.value)} />
        </label>
        <label>Mật khẩu {initial.id && <small>(để trống nếu không đổi)</small>}
          <input type="password" value={form.password}
            onChange={e => set('password', e.target.value)} />
        </label>
        <label>Họ tên
          <input value={form.ho_ten} onChange={e => set('ho_ten', e.target.value)} />
        </label>
        <label>Email
          <input value={form.email} onChange={e => set('email', e.target.value)} />
        </label>
        <label>Vai trò
          <select value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <label>Phòng ban
          <select value={form.department_id || ''}
            onChange={e => set('department_id', e.target.value || null)}>
            <option value="">— Không —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.ten_phong_ban}</option>)}
          </select>
        </label>
        {initial.id && (
          <label>Trạng thái
            <select value={form.is_active}
              onChange={e => set('is_active', Number(e.target.value))}>
              <option value={1}>Hoạt động</option>
              <option value={0}>Khoá</option>
            </select>
          </label>
        )}
      </div>
    </Modal>
  );
}
