/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './views/DashboardView';
import { EquipmentViews } from './views/EquipmentViews';
import { UserViews } from './views/UserViews';
import { LoanViews } from './views/LoanViews';
import { ReportViews } from './views/ReportViews';
import { ProfileView } from './views/ProfileView';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginView } from './views/LoginView';
import { Toaster } from 'sonner';

function ProtectedRoute({ children, reqAdmin }: { children: React.ReactNode, reqAdmin?: boolean }) {
  const { session, loading, profile } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p>Carregando...</p></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (reqAdmin && profile?.role !== 'admin') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function AppRoutes() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans"><p className="text-slate-500 font-medium">Carregando...</p></div>;
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardView />} />
          <Route path="notebooks" element={<ProtectedRoute reqAdmin><EquipmentViews /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute reqAdmin><UserViews /></ProtectedRoute>} />
          <Route path="loans" element={<LoanViews />} />
          <Route path="profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute reqAdmin><ReportViews /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <AppRoutes />
    </AuthProvider>
  );
}
