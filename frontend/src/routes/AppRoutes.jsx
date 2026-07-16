import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import PWAInstallBanner from '../components/common/PWAInstallBanner';

import LoginPage from '../pages/LoginPage';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import AdminClients from '../pages/AdminClients';
import AdminCandidates from '../pages/AdminCandidates';
import AdminAttendance from '../pages/AdminAttendance';
import AdminManualEntry from '../pages/AdminManualEntry';
import LeaveManagement from '../pages/LeaveManagement';
import AdminReports from '../pages/AdminReports';
import CompanySettings from '../pages/CompanySettings';

export default function AppRoutes() {
  return (
    <>
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
      <PWAInstallBanner />
    </>
  );
}
