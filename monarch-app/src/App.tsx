import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import CustomerPage from './pages/CustomerPage';
import SalesPage from './pages/SalesPage';
import ContactPage from './pages/ContactPage';
import UserPage from './pages/UserPage';

// MainPage는 이제 DashboardPage가 그 역할을 대신하므로 제거될 수 있습니다.
// 만약 MainPage를 계속 사용하고 싶다면 DashboardPage 대신 MainPage를 사용하세요.

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* ProtectedRoute는 로그인 페이지를 제외한 모든 페이지를 보호합니다. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout/>}>
          <Route path="/" element={<DashboardPage />} /> {/* 대시보드 */}
          <Route path="/customer" element={<CustomerPage />} /> {/* 고객관리 */}
          <Route path="/sales" element={<SalesPage />} /> {/* 영업관리 */}
          <Route path="/sales/contact" element={<ContactPage />} /> {/* 접촉관리 */}
          <Route path="/admin/users" element={<UserPage />} /> {/* 사용자관리 */}
          <Route path="/admin/dev" element={<>개발정보</>} /> {/* 개발정보 */}
        </Route>
      </Route>

      {/* 정의되지 않은 경로로 접근 시 기본 페이지로 리디렉션 (ProtectedRoute 내부에서 처리되므로 제거하거나 주석 처리) */}
      {/* 이 부분은 ProtectedRoute 내부에서 처리되므로 제거하거나 주석 처리할 수 있습니다. */}
      {/* <Route path="*" element={<Navigate to="/" />} /> */}
    </Routes>
  );
};

export default App;
