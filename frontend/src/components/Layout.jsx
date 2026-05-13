import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import s from './Layout.module.scss';

const ROLE_LABEL = { admin: 'Quản trị', van_thu: 'Văn thư', phong_ban: 'Phòng ban' };

export default function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className={s.app}>
      <aside className={s.sidebar}>
        <div className={s.brandlogo}>
          <img src ="/cong_van.png" alt= "logo" className={s.logo}/>
          <span>QLCV</span> </div>
        <nav>
          <NavLink to="/" end>Tổng quan</NavLink>
          <NavLink to="/cong-van-den" end>Công văn đến</NavLink>
          <NavLink to="/cong-van-den-da-chuyen" className={s.sublink}>↳ Đã chuyển</NavLink>
          <NavLink to="/cong-van-di" end>Công văn đi</NavLink>
          <NavLink to="/cong-van-di-da-chuyen" className={s.sublink}>↳ Đã chuyển</NavLink>
          <NavLink to="/bao-cao">Báo cáo</NavLink>
          {isAdmin && <>
            <div className={s.section}>Quản trị</div>
            <NavLink to="/users">Người dùng</NavLink>
            <NavLink to="/categories">Danh mục</NavLink>
            <NavLink to="/departments">Phòng ban</NavLink>
            <footer className={s.footer}><p>© Trần Thanh Tân-DX23TT10</p></footer>
          </>}
        </nav>
      </aside>
      <div className={s.main}>
        <header className={s.header}>
          <div></div>
          <div className={s.user}>
            <span>{user?.ho_ten} <small>({ROLE_LABEL[user?.role]})</small></span>
            <button className="btn btn-secondary" onClick={logout}>Đăng xuất</button>
          </div>
        </header>
        <main className={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
