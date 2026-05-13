import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { STATUS_LABEL, STATUS_COLOR, DO_KHAN, formatDate, formatDT } from '../../utils/format';
import SEO from '../../components/SEO';
import s from './DocumentDetail.module.scss';

const ROLE_LABEL = {
  admin: 'Quản trị',
  van_thu: 'Văn thư',
  truong_phong: 'Trưởng phòng',
  phong_ban: 'Nhân viên'
};

export default function DocumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);

  const load = () => api.get(`/documents/${id}`).then(r => setDoc(r.data));

  useEffect(() => { load(); }, [id]);

  if (!doc) return <div>Đang tải…</div>;

  const isDeptUser = user.role === 'phong_ban' || user.role === 'truong_phong';
  const isMyDept = doc.current_department_id === user.department_id;
  const myConfirmation = doc.confirmations?.find(c => c.confirmed_by === user.id);

  return (
    <div>
      <SEO
        title={`${doc.so_cong_van} — ${doc.trich_yeu}`}
        description={`Chi tiết công văn ${doc.so_cong_van}: ${doc.trich_yeu}`}
      />
      <Link to={`/cong-van-${doc.loai_cong_van}`}>← Quay lại</Link>

{/* sửa lại phần này nằm ngang*/}
      <div className={s.head}>
  <div className={s.headLeft}>
  
    <h2 className={s.soCV}> Số công văn: {doc.so_cong_van} - {doc.trich_yeu}</h2>

    <div className={s.summary}>
      <div><strong>Trích yếu:</strong> {doc.trich_yeu}</div>
      <div><strong>Loại công văn:</strong> {doc.ten_loai}</div>
      <div><strong>Phòng ban hiện tại:</strong> {doc.current_dept_name || '—'}</div>
      <div><strong>Nơi gửi:</strong> {doc.noi_gui || '—'}</div>
      <div><strong>Ngày ban hành:</strong> {formatDate(doc.ngay_ban_hanh)}</div>
      <div><strong>Độ khẩn:</strong> {DO_KHAN[doc.do_khan]}</div>
    </div>
  </div>

  <div className={s.headRight}>
    <span style={{color: STATUS_COLOR[doc.status], fontWeight: 200}}>{STATUS_LABEL[doc.status]}</span>
  </div>
</div>
   <div className={s.grid}>
        <div className={s.preview}>
          {doc.files?.length > 0 ? (
            <PdfPreview docId={doc.id} file={doc.files[0]} />
          ) : (
            <div className={s.noFile}>Không có file đính kèm</div>
          )}
        </div>
      </div>

      {/* Xác nhận thực hiện — chỉ hiện với nhân viên/trưởng phòng đang ở phòng ban giữ công văn */}
      {isDeptUser && isMyDept && (
        <ConfirmSection
          docId={doc.id}
          myConfirmation={myConfirmation}
          onConfirmed={load}
        />
      )}

      <h3>Lịch sử xác nhận thực hiện</h3>
      {!doc.confirmations?.length ? (
        <p className={s.emptyNote}>Chưa có nhân viên nào xác nhận thực hiện.</p>
      ) : (
        <ul className={s.timeline}>
          {doc.confirmations.map(c => (
            <li key={c.id} className={s.confirmItem}>
              <div className={s.confirmMeta}>
                <strong>{c.confirmed_by_name}</strong>
                <span className={s.roleTag}>{ROLE_LABEL[c.confirmed_by_role] || c.confirmed_by_role}</span>
                {c.confirmed_by_dept && <span className={s.deptTag}>{c.confirmed_by_dept}</span>}
                <span className={s.confirmTime}>{formatDT(c.confirmed_at)}</span>
              </div>
              {c.noi_dung && <div className={s.confirmContent}>"{c.noi_dung}"</div>}
            </li>
          ))}
        </ul>
      )}

      <h3>Lịch sử chuyển tiếp</h3>
      {doc.history.length === 0 ? <p className={s.emptyNote}>Chưa có chuyển tiếp.</p> : (
        <ul className={s.timeline}>
          {doc.history.map(h => (
            <li key={h.id}>
              <strong>{formatDT(h.forwarded_at)}</strong> —
              từ <em>{h.from_dept || 'Văn thư'}</em> → <em>{h.to_dept}</em>
              <br /><small>Người chuyển: {h.forwarded_by_name}</small>
              {h.ghi_chu && <div>Ghi chú: {h.ghi_chu}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConfirmSection({ docId, myConfirmation, onConfirmed }) {
  const [noi_dung, setNoiDung] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      await api.post(`/documents/${docId}/confirm`, { noi_dung });
      onConfirmed();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lỗi xác nhận');
    } finally { setSaving(false); }
  };

  if (myConfirmation) {
    return (
      <div className={s.confirmBox}>
        <div className={s.confirmDone}>
          ✓ Bạn đã xác nhận thực hiện lúc {formatDT(myConfirmation.confirmed_at)}
          {myConfirmation.noi_dung && <span> — "{myConfirmation.noi_dung}"</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={s.confirmBox}>
      <h3>Xác nhận thực hiện</h3>
      <textarea
        className={s.confirmTextarea}
        rows={3}
        placeholder="Nội dung thực hiện (không bắt buộc)…"
        value={noi_dung}
        onChange={e => setNoiDung(e.target.value)}
      />
      {err && <div className={s.confirmErr}>{err}</div>}
      <button className="btn" disabled={saving} onClick={submit}>
        {saving ? 'Đang lưu…' : 'Xác nhận thực hiện'}
      </button>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}>
      <div style={{ color: '#6b7280', fontSize: 12 }}>{label}</div>
      <div>{children || '—'}</div>
    </div>
  );
}

function PdfPreview({ docId, file }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let revoked = false;
    api.get(`/documents/${docId}/file/${file.id}`, { responseType: 'blob' })
      .then(r => {
        if (revoked) return;
        const blob = new Blob([r.data], { type: 'application/pdf' });
        setUrl(URL.createObjectURL(blob));
      });
    return () => { revoked = true; if (url) URL.revokeObjectURL(url); };
  }, [docId, file.id]);

  if (!url) return <div>Đang tải PDF…</div>;
  return <iframe 
  src={`${url}#zoom=125`}
  title={file.file_name} 
  style={{ width: '100%', height: 600, border: 0 }} />;
}
