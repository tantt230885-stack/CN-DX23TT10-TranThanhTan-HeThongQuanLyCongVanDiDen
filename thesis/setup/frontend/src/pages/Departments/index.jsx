import { useEffect, useState } from 'react';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SEO from '../../components/SEO';

export default function Departments() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const load = () => api.get('/departments').then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (editing.id) await api.put(`/departments/${editing.id}`, form);
    else await api.post('/departments', form);
    setEditing(null); load();
  };

  return (
    <div>
      <SEO title="Phòng ban" description="Quản lý danh sách phòng ban trong tổ chức." />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Phòng ban</h2>
        <button className="btn" onClick={() => setEditing({})}>+ Thêm phòng ban</button>
      </div>
      <DataTable
        columns={[{ key: 'ten_phong_ban', label: 'Tên phòng ban' }, { key: 'mo_ta', label: 'Mô tả' }]}
        data={list}
        actions={(row) => (<>
          <button className="btn" onClick={() => setEditing(row)}>Sửa</button>
          <button className="btn btn-danger" onClick={() => setConfirm(row)}>Xoá</button>
        </>)}
      />
      {editing && (
        <Modal open title={editing.id ? 'Sửa phòng ban' : 'Thêm phòng ban'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>Hủy</button>
            <button className="btn" onClick={() => save(editing)}>Lưu</button>
          </>}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label>Tên phòng ban<input value={editing.ten_phong_ban || ''}
              onChange={e => setEditing({ ...editing, ten_phong_ban: e.target.value })} /></label>
            <label>Mô tả<textarea rows={3} value={editing.mo_ta || ''}
              onChange={e => setEditing({ ...editing, mo_ta: e.target.value })} /></label>
          </div>
        </Modal>
      )}
      <ConfirmDialog open={!!confirm}
        message={`Xoá phòng ban "${confirm?.ten_phong_ban}"?`}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try { await api.delete(`/departments/${confirm.id}`); setConfirm(null); load(); }
          catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
        }} />
    </div>
  );
}
