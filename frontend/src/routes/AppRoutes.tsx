/**
 * Application routing configuration
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { Layout } from '../components/Layout';
import { EmployeeDashboard } from '../pages/EmployeeDashboard';
import { ReviewerDashboard } from '../pages/ReviewerDashboard';
import { ImplementerDashboard } from '../pages/ImplementerDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';
import { IdeaDetailPage } from '../pages/IdeaDetailPage';
import { IdeaEditForm } from '../components/IdeaEditForm';

const UnauthorizedPage = () => (
  <Layout>
    <div style={{ padding: '2rem' }}>
      <h1>Unauthorized</h1>
      <p>You don't have access to this page.</p>
    </div>
  </Layout>
);

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  // Redirect authenticated users from login to their dashboard
  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    
    switch (role) {
      case 'Employee':
        return '/employee';
      case 'Reviewer':
        return '/reviewer';
      case 'Implementer':
        return '/implementer';
      case 'Admin':
        return '/admin';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Shared idea detail route - accessible by all authenticated users */}
      <Route
        path="/ideas/:ideaId"
        element={
          <ProtectedRoute allowedRoles={['Employee', 'Reviewer', 'Implementer', 'Admin']}>
            <Layout>
              <IdeaDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Idea edit route - accessible by Employee and Admin */}
      <Route
        path="/ideas/:ideaId/edit"
        element={
          <ProtectedRoute allowedRoles={['Employee', 'Admin']}>
            <Layout>
              <IdeaEditForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute allowedRoles={['Employee']}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Reviewer Routes */}
      <Route
        path="/reviewer/*"
        element={
          <ProtectedRoute allowedRoles={['Reviewer']}>
            <Layout>
              <ReviewerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Implementer Routes */}
      <Route
        path="/implementer/*"
        element={
          <ProtectedRoute allowedRoles={['Implementer']}>
            <Layout>
              <ImplementerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};
