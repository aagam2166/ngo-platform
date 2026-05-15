import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import Dashboard from '../pages/Dashboard';
import PrivateRoute from './PrivateRoute';
import SubmitRequestPage from '../pages/citizen/SubmitRequestPage';
import MyRequestsPage from '../pages/citizen/MyRequestsPage';
import NGODashboard from '../pages/ngo/NGODashboard';
import AdminPanel from '../pages/admin/AdminPanel';

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route path="/requests/new" element={<PrivateRoute><SubmitRequestPage /></PrivateRoute>} />
        <Route path="/requests/mine" element={<PrivateRoute><MyRequestsPage /></PrivateRoute>} />

        <Route
          path="/ngo/requests"
          element={
            <PrivateRoute allowedRoles={['NGO_ADMIN']}>
              <NGODashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminPanel />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
