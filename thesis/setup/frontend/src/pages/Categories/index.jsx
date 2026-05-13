import { useEffect, useState } from 'react';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SEO from '../../components/SEO';

export default function Categories() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const load = () => api.get('/categories').then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (editing.id) await api.put(`/categories/${editing.id}`, form);
    else await api.post('/categories', form);
    setEditing(null); load();
  };

  return (
    <div>
      <SEO title="Loại công văn" description="Quản lý danh mục loại công văn trong hệ thống." />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Danh mục công văn</h2>
        <button className="btn" onClick={() => setEditing({})}>+ Thêm loại</button>
      </div>
      <DataTable
        columns={[
          { key: 'ten_loai', label: 'Tên loại' },
          { key: 'mo_ta', label: 'Mô tả' }
        ]}
        data={list}
        actions={(row) => (<>
          <button className="btn" onClick={() => setEditing(row)}>Sửa</button>
          <button className="btn btn-danger" onClick={() => setConfirm(row)}>Xoá</button>
        </>)}
      />
      {editing && <CategoryForm initial={editing}
        onCancel={() => setEditing(null)} onSubmit={save} />}
      <ConfirmDialog open={!!confirm}
        message={`Xoá loại "${confirm?.ten_loai}"?`}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await api.delete(`/categories/${confirm.id}`);
            setConfirm(null); load();
          } catch (e) {
            alert(e.response?.data?.message || 'Lỗi');
          }
        }} />
    </div>
  );
}

function CategoryForm({ initial, onCancel, onSubmit }) {
  const [form, setForm] = useState({ ten_loai: initial.ten_loai || '', mo_ta: initial.mo_ta || '' });
  return (
    <Modal open title={initial.id ? 'Sửa loại' : 'Thêm loại'} onClose={onCancel}
      footer={<>
        <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
        <button className="btn" onClick={() => onSubmit(form)}>Lưu</button>
      </>}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label>Tên loại<input value={form.ten_loai}
          onChange={e => setForm({ ...form, ten_loai: e.target.value })} /></label>
        <label>Mô tả<textarea rows={3} value={form.mo_ta}
          onChange={e => setForm({ ...form, mo_ta: e.target.value })} /></label>
      </div>
    </Modal>
  );
}
