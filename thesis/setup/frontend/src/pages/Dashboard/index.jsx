import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { STATUS_LABEL, STATUS_COLOR } from '../../utils/format';
import SEO from '../../components/SEO';
import s from './Dashboard.module.scss';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/reports/summary').then(r => setSummary(r.data));
    api.get('/reports/recent').then(r => setRecent(r.data));
  }, []);

  return (
    <div>
      <SEO title="Tổng quan" description="Tổng quan tình hình công văn đến, công văn đi và trạng thái xử lý." />
      <h2>Tổng quan</h2>
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <Card label="Tổng số" value={summary.total} />
          <Card label="Mới" value={summary.moi} color="#f59e0b" />
          <Card label="Đang xử lý" value={summary.dang_xu_ly} color="#3b82f6" />
          <Card label="Đã xử lý" value={summary.da_xu_ly} color="#16a34a" />
        </div>
      )}
      <h3 style={{ marginTop: 24 }}>Công văn mới nhất</h3>
      <table className={s.table}>
        <thead><tr><th>Số công văn</th><th>Trích yếu</th><th>Loại</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {recent.map(r => (
            <tr key={r.id}>
              <td>{r.so_cong_van}</td>
              <td>{r.trich_yeu}</td>
              <td>{r.ten_loai}</td>
              <td style={{ color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status] ?? r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ label, value, color = '#1f2937' }) {
  return (
    <div style={{ background: 'white', padding: 20, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#6b7280', fontSize: 13 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
