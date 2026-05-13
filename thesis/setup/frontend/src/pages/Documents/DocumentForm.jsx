import { useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';

export default function DocumentForm({ loaiCongVan, categories, onCancel, onSaved }) {
  const [form, setForm] = useState({
    so_cong_van: '',
    trich_yeu: '',
    loai_id: categories[0]?.id || '',
    loai_cong_van: loaiCongVan,
    ngay_ban_hanh: '',
    ngay_tiep_nhan: '',
    noi_gui: '',
    noi_nhan: '',
    do_khan: 'thuong'
  });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr('');
    if (!form.so_cong_van || !form.trich_yeu || !form.loai_id) {
      setErr('Vui lòng nhập đầy đủ số CV, trích yếu và loại'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (file) fd.append('file', file);
      await api.post('/documents', fd);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={loaiCongVan === 'den' ? 'Tiếp nhận công văn đến' : 'Tạo công văn đi'}
      onClose={onCancel}
      footer={<>
        <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
        <button className="btn" disabled={saving} onClick={submit}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </>}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <label>Số công văn *
          <input value={form.so_cong_van} onChange={e => set('so_cong_van', e.target.value)} />
        </label>
        <label>Loại công văn *
          <select value={form.loai_id} onChange={e => set('loai_id', e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.ten_loai}</option>)}
          </select>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>Trích yếu *
          <textarea rows={3} value={form.trich_yeu} onChange={e => set('trich_yeu', e.target.value)} />
        </label>
        <label>Ngày ban hành
          <input type="date" value={form.ngay_ban_hanh} onChange={e => set('ngay_ban_hanh', e.target.value)} />
        </label>
        {loaiCongVan === 'den' && (
          <label>Ngày tiếp nhận
            <input type="date" value={form.ngay_tiep_nhan} onChange={e => set('ngay_tiep_nhan', e.target.value)} />
          </label>
        )}
        <label style={{ gridColumn: '1 / -1' }}>
          {loaiCongVan === 'den' ? 'Nơi gửi' : 'Nơi nhận'}
          <input value={loaiCongVan === 'den' ? form.noi_gui : form.noi_nhan}
            onChange={e => set(loaiCongVan === 'den' ? 'noi_gui' : 'noi_nhan', e.target.value)} />
        </label>
        <label>Độ khẩn
          <select value={form.do_khan} onChange={e => set('do_khan', e.target.value)}>
            <option value="thuong">Thường</option>
            <option value="khan">Khẩn</option>
            <option value="hoa_toc">Hoả tốc</option>
          </select>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>File PDF (tối đa 10MB)
          <input type="file" accept="application/pdf"
            onChange={e => setFile(e.target.files[0] || null)} />
        </label>
      </div>
      {err && <div style={{ color: '#dc2626', marginTop: 12 }}>{err}</div>}
    </Modal>
  );
}
