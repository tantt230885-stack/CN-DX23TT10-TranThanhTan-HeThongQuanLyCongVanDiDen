import { useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';

export default function ForwardDialog({ doc, departments, onCancel, onDone }) {
  const [toDept, setToDept] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!toDept) { setErr('Chọn phòng ban đích'); return; }
    setSaving(true); setErr('');
    try {
      await api.post(`/documents/${doc.id}/forward`, {
        to_department_id: Number(toDept), ghi_chu: note
      });
      onDone();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lỗi');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={`Chuyển tiếp: ${doc.so_cong_van}`} onClose={onCancel}
      footer={<>
        <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
        <button className="btn" disabled={saving} onClick={submit}>Chuyển</button>
      </>}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div><strong>Trích yếu:</strong> {doc.trich_yeu}</div>
        <label>Phòng ban nhận
          <select value={toDept} onChange={e => setToDept(e.target.value)}>
            <option value="">— Chọn —</option>
            {departments
              .filter(d => d.id !== doc.current_department_id)
              .map(d => <option key={d.id} value={d.id}>{d.ten_phong_ban}</option>)}
          </select>
        </label>
        <label>Ghi chú
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} />
        </label>
        {err && <div style={{ color: '#dc2626' }}>{err}</div>}
      </div>
    </Modal>
  );
}
