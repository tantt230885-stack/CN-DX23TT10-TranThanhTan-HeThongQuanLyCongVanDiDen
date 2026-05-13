import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';
import { STATUS_LABEL, STATUS_COLOR, formatDate } from '../../utils/format';
import DocumentForm from './DocumentForm';
import ForwardDialog from './ForwardDialog';
import SEO from '../../components/SEO';
import s from './DocumentList.module.scss';

// loaiCongVan = 'den' | 'di', daChuyen = true → danh sách đã chuyển tiếp
export default function DocumentList({ loaiCongVan, daChuyen = false }) {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState({ status: '', q: '', from: '', to: '' });
  const [creating, setCreating] = useState(false);
  const [forwarding, setForwarding] = useState(null);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  const canCreate = user.role === 'admin' || user.role === 'van_thu';
  const canForward = user.role === 'admin' || user.role === 'van_thu' || user.role === 'truong_phong';

  const load = () => {
    const params = { loai_cong_van: loaiCongVan, da_chuyen: daChuyen ? '1' : '0', ...filter };
    Object.keys(params).forEach(k => !params[k] && params[k] !== '0' && delete params[k]);
    api.get('/documents', { params }).then(r => setList(r.data));
  };
  useEffect(() => {
    load();
    api.get('/categories').then(r => setCategories(r.data));
    api.get('/departments').then(r => setDepartments(r.data));
  }, [loaiCongVan, daChuyen]);

  const updateStatus = async (id, status) => {
    await api.patch(`/documents/${id}/status`, { status });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Xoá công văn này?')) return;
    await api.delete(`/documents/${id}`);
    load();
  };

  const isDen = loaiCongVan === 'den';
  const pageTitle = isDen
    ? (daChuyen ? 'Công văn đến đã chuyển' : 'Công văn đến')
    : (daChuyen ? 'Công văn đi đã chuyển' : 'Công văn đi');

  return (
    <div>
      <SEO
        title={pageTitle}
        description={daChuyen
          ? `Danh sách ${isDen ? 'công văn đến' : 'công văn đi'} đã chuyển tiếp đến phòng ban.`
          : isDen ? 'Danh sách công văn đến — tìm kiếm, lọc và xử lý.' : 'Danh sách công văn đi — tạo mới và theo dõi tiến độ.'}
      />
      <div className={s.toolbar}>
        <h2>{pageTitle}</h2>
        {canCreate && !daChuyen && (
          <button className="btn" onClick={() => setCreating(true)}>
            + {loaiCongVan === 'den' ? 'Tiếp nhận công văn' : 'Tạo công văn đi'}
          </button>
        )}
      </div>

      <div className={s.filters}>
        <input placeholder="Tìm số CV / trích yếu" value={filter.q}
          onChange={e => setFilter({ ...filter, q: e.target.value })} />
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">— Tất cả trạng thái —</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={filter.from} onChange={e => setFilter({ ...filter, from: e.target.value })} />
        <input type="date" value={filter.to} onChange={e => setFilter({ ...filter, to: e.target.value })} />
        <button className="btn" onClick={load}>Lọc</button>
      </div>

      <DataTable
        columns={[
          { key: 'so_cong_van', label: 'Số CV', render: r => <Link to={`/cong-van/${r.id}`}>{r.so_cong_van}</Link> },
          { key: 'trich_yeu', label: 'Trích yếu' },
          { key: 'ten_loai', label: 'Loại' },
          {
            key: loaiCongVan === 'den' ? 'noi_gui' : 'noi_nhan',
            label: loaiCongVan === 'den' ? 'Nơi gửi' : 'Nơi nhận'
          },
          daChuyen
            ? {
              key: 'da_chuyen_den_name', label: 'Đã chuyển đến', render: r => (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{r.da_chuyen_den_name || '—'}</span>
              )
            }
            : { key: 'current_dept_name', label: 'Phòng ban' },
          ...(!daChuyen ? [{
            key: 'chuyen_tu_name', label: 'Khoa phòng đã chuyển',
            render: r => r.chuyen_tu_name
              ? <span style={{ color: '#6366f1', fontWeight: 600 }}>{r.chuyen_tu_name}</span>
              : <span style={{ color: '#9ca3af' }}>—</span>
          }] : []),
          { key: 'created_at', label: 'Ngày', render: r => formatDate(r.created_at) },
          {
            key: 'status', label: 'Trạng thái', render: r => (
              <span style={{ color: STATUS_COLOR[r.status], fontWeight: 600 }}>
                {STATUS_LABEL[r.status]}
              </span>
            )
          }
        ]}
        data={list}
        actions={(row) => (
          <>
            <Link to={`/cong-van/${row.id}`} className="btn">Xem</Link>
            {!daChuyen && canForward && (
              <button className="btn" onClick={() => setForwarding(row)}>Chuyển</button>
            )}
            {!daChuyen && (
              ((user.role === 'phong_ban' || user.role === 'truong_phong') && row.current_department_id === user.department_id) ||
                user.role === 'admin' || user.role === 'van_thu' ? (
                <select value={row.status} onChange={e => updateStatus(row.id, e.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              ) : null
            )}

            {row.status !== 'da' && ( // Xử lý hoàn thành 
              <button
                className="btn btn-success"
                onClick={async () => {
                  await updateStatus(row.id, 'da_xu_ly');
                }}
              >
                Đã xử lý
              </button>
            )}
            {user.role === 'admin' && (
              <button className="btn btn-danger" onClick={() => remove(row.id)}>Xoá</button>
            )}
          </>
        )}
      />

      {creating && (
        <DocumentForm
          loaiCongVan={loaiCongVan}
          categories={categories}
          onCancel={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}

      {forwarding && (
        <ForwardDialog
          doc={forwarding}
          departments={departments}
          onCancel={() => setForwarding(null)}
          onDone={() => { setForwarding(null); load(); }}
        />
      )}
    </div>
  );
}
