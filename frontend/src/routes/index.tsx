import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import RoleRoute from './RoleRoute';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import Dashboard from '../pages/Dashboard';
import PrivateRoute from './PrivateRoute';
import SubmitRequestPage from '../pages/citizen/SubmitRequestPage';
import MyRequestsPage from '../pages/citizen/MyRequestsPage';
import MyDonationsPage from '../pages/citizen/MyDonationsPage';
import NGODashboard from '../pages/ngo/NGODashboard';
import NGOAccountsPage from '../pages/ngo/NGOAccountsPage';
import NGODonationsPage from '../pages/ngo/NGODonationsPage';
import VolunteerDashboardPage from '../pages/volunteer/VolunteerDashboardPage';
import ResourcesPage from '../pages/ngo/ResourcesPage';
import AdminDashboardPage from '../pages/admin/adminDashboardPage';
import RequestDetailPage from '../pages/citizen/RequestDetailPage';
import DonatePage from '../pages/donate/DonatePage';
import DonateResourcesPage from '../pages/donate/DonateResourcesPage';
import DonateMoneyPage from '../pages/donate/DonateMoneyPage';

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
        <Route path="/requests/:id" element={<PrivateRoute><RequestDetailPage /></PrivateRoute>} />

        {/* Donation routes — any authenticated user */}
        <Route path="/donate" element={<PrivateRoute><DonatePage /></PrivateRoute>} />
        <Route path="/donate/resources" element={<PrivateRoute><DonateResourcesPage /></PrivateRoute>} />
        <Route path="/donate/money" element={<PrivateRoute><DonateMoneyPage /></PrivateRoute>} />
        <Route path="/my-donations" element={<PrivateRoute><MyDonationsPage /></PrivateRoute>} />

        <Route
          path="/ngo/dashboard"
          element={
            <RoleRoute allowedRoles={['NGO_ADMIN', 'SUPER_ADMIN']}>
              <NGODashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/ngo/requests"
          element={
            <RoleRoute allowedRoles={['NGO_ADMIN', 'SUPER_ADMIN']}>
              <NGODashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/ngo/resources"
          element={
            <RoleRoute allowedRoles={['NGO_ADMIN', 'SUPER_ADMIN']}>
              <ResourcesPage />
            </RoleRoute>
          }
        />

        <Route
          path="/ngo/accounts"
          element={
            <RoleRoute allowedRoles={['NGO_ADMIN', 'SUPER_ADMIN']}>
              <NGOAccountsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/ngo/donations"
          element={
            <RoleRoute allowedRoles={['NGO_ADMIN', 'SUPER_ADMIN']}>
              <NGODonationsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminDashboardPage />
            </RoleRoute>
          }
        />

        <Route
          path="/volunteer/dashboard"
          element={
            <RoleRoute allowedRoles={['VOLUNTEER']}>
              <VolunteerDashboardPage />
            </RoleRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
