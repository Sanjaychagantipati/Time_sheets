import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import PWAInstallBanner from '../components/common/PWAInstallBanner';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const EmployeeDashboard = lazy(() => import('../pages/EmployeeDashboard'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminClients = lazy(() => import('../pages/AdminClients'));
const AdminCandidates = lazy(() => import('../pages/AdminCandidates'));
const AdminAttendance = lazy(() => import('../pages/AdminAttendance'));
const AdminManualEntry = lazy(() => import('../pages/AdminManualEntry'));
const LeaveManagement = lazy(() => import('../pages/LeaveManagement'));
const AdminReports = lazy(() => import('../pages/AdminReports'));
const CompanySettings = lazy(() => import('../pages/CompanySettings'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading...</span>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Base Route: Login Page */}
          <Route path="/" element={<MainLayout><LoginPage /></MainLayout>} />

          {/* Protected Employee Dashboard Route */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute role="employee">
                <MainLayout><EmployeeDashboard /></MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Dashboard Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Clients Route */}
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><AdminClients /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Candidates Route */}
          <Route
            path="/admin/candidates"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><AdminCandidates /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Attendance Logs & Live Status Route */}
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><AdminAttendance /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Manual Timesheet Entry Route */}
          <Route
            path="/admin/manual-entry"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><AdminManualEntry /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Leave Management Routes */}
          <Route
            path="/admin/leave"
            element={
              <ProtectedRoute role="admin">
                <Navigate to="/admin/leaves" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><LeaveManagement /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Reports Route */}
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><AdminReports /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Settings Route */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout><CompanySettings /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes back to Login (Base Path) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <PWAInstallBanner />
    </>
  );
}
