import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

export default function AppRoutes() {
  return (
    <MainLayout>
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
    </MainLayout>
  );
}
