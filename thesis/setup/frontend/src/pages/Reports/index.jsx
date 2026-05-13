import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import SEO from '../../components/SEO';
import s from './Reports.module.scss';

const COLORS = ['#1976d2', '#16a34a', '#f59e0b', '#dc2626', '#9333ea', '#0891b2'];

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [byMonth, setByMonth] = useState([]);

  const load = async () => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const [s1, s2, s3, s4] = await Promise.all([
      api.get('/reports/summary', { params }),
      api.get('/reports/by-category', { params }),
      api.get('/reports/by-department', { params }),
      api.get('/reports/by-month', { params: { year } })
    ]);
    setSummary(s1.data);
    setByCategory(s2.data);
    setByDept(s3.data);
    setByMonth(s4.data.data.map(d => ({ name: `T${d.thang}`, total: d.total })));
  };

  useEffect(() => { load(); }, [year]);

  return (
    <div>
      <SEO title="Báo cáo thống kê" description="Báo cáo thống kê công văn theo trạng thái, loại và phòng ban." />
      <div className={s.head}>
        <h2>Báo cáo - Thống kê</h2>
        <button className="btn" onClick={() => window.print()}>In / Xuất PDF</button>
      </div>

      <div className={s.filters}>
        <label>Từ ngày <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>Đến ngày <input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <label>Năm
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
        </label>
        <button className="btn" onClick={load}>Áp dụng</button>
      </div>

      {summary && (
        <div className={s.cards}>
          <Card label="Tổng số" value={summary.total} color="#1f2937" />
          <Card label="Mới" value={summary.moi} color="#f59e0b" />
          <Card label="Đang xử lý" value={summary.dang_xu_ly} color="#3b82f6" />
          <Card label="Đã xử lý" value={summary.da_xu_ly} color="#16a34a" />
          <Card label="Lưu trữ" value={summary.luu_tru} color="#6b7280" />
        </div>
      )}

      <div className={s.row}>
        <div className={s.chart}>
          <h3>Theo tháng (năm {year})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={s.chart}>
          <h3>Theo loại công văn</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={byCategory} dataKey="total" nameKey="ten_loai"
                cx="50%" cy="50%" outerRadius={100} label>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={s.chart}>
        <h3>Số công văn đang giữ theo phòng ban</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byDept} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="ten_phong_ban" width={140} />
            <Tooltip />
            <Bar dataKey="total" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div className="report-card" style={{ background: 'white', padding: 18, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#6b7280', fontSize: 13 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
