import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import s from './Login.module.scss';

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(username, password);
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className={s.wrap}>
      <SEO title="Đăng nhập" description="Đăng nhập vào hệ thống quản lý công văn nội bộ." />
      <form className={s.card} onSubmit={submit}>
        <h2>Hệ thống Quản lý Công văn</h2>
        <label>Tên đăng nhập
          <input value={username} onChange={e => setUsername(e.target.value)} required />
        </label>
        <label>Mật khẩu
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {err && <div className={s.err}>{err}</div>}
        <button className="btn" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
}
