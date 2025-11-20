import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import StructureAdminPage from './pages/StructureAdminPage';
import ServiceAdminPage from './pages/ServiceAdminPage'; // 'QueryAdminPage'를 'ServiceAdminPage'로 변경
import DynamicGridPage from './pages/DynamicGridPage'; // 새로 만든 템플릿 페이지 import

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
          <Route path="/admin/dev" element={<StructureAdminPage />} /> {/* 기존 "개발정보" 경로 유지 */}
          {/* 동적 라우트: :structureName 부분이 변수로 처리됩니다. */}
          <Route path="/grid/:structureName" element={<DynamicGridPage />} />
          <Route path="/admin/structure" element={<StructureAdminPage />} /> {/* "Structure정보" 페이지 경로 새로 추가 */}
          <Route path="/admin/service" element={<ServiceAdminPage />} /> {/* "Service정보" 페이지 경로로 변경 */}
        </Route>
      </Route>

      {/* 정의되지 않은 경로로 접근 시 기본 페이지로 리디렉션 (ProtectedRoute 내부에서 처리되므로 제거하거나 주석 처리) */}
      {/* 이 부분은 ProtectedRoute 내부에서 처리되므로 제거하거나 주석 처리할 수 있습니다. */}
      {/* <Route path="*" element={<Navigate to="/" />} /> */}
    </Routes>
  );
};

export default App;
