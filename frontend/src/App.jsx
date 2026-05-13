import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Departments from './pages/Departments';
import DocumentList from './pages/Documents/DocumentList';
import DocumentDetail from './pages/Documents/DocumentDetail';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute roles={['admin']}><Categories /></ProtectedRoute>} />
        <Route path="departments" element={<ProtectedRoute roles={['admin']}><Departments /></ProtectedRoute>} />
        <Route path="cong-van-den" element={<DocumentList loaiCongVan="den" />} />
        <Route path="cong-van-den-da-chuyen" element={<DocumentList loaiCongVan="den" daChuyen />} />
        <Route path="cong-van-di" element={<DocumentList loaiCongVan="di" />} />
        <Route path="cong-van-di-da-chuyen" element={<DocumentList loaiCongVan="di" daChuyen />} />
        <Route path="cong-van/:id" element={<DocumentDetail />} />
        <Route path="bao-cao" element={<Reports />} />
      </Route>
    </Routes>
  );
}
