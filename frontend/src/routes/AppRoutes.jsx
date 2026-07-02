import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import PWAInstallBanner from '../components/common/PWAInstallBanner';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const EmployeeDashboard = lazy(() => import('../pages/EmployeeDashboard'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));

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
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Base Route: Login Page */}
            <Route path="/" element={<LoginPage />} />

            {/* Protected Employee Dashboard Route */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Dashboard Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirect unknown routes back to Login (Base Path) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </MainLayout>
      <PWAInstallBanner />
    </>
  );
}
