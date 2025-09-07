import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import './App.css';
import i18n from './services/i18n';
import { useEffect, useState } from 'react';

type ChildrenProps = { children: React.ReactNode };

const ProtectedRoute: React.FC<ChildrenProps> = ({ children }: ChildrenProps) => {
  const { state } = useAuth();
  // Allow access if context is authenticated
  if (state.isAuthenticated) return <>{children}</>;
  // Fallback: hydrate from localStorage to avoid redirect flicker on refresh
  try {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      return <>{children}</>;
    }
  } catch {}
  return <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<ChildrenProps> = ({ children }: ChildrenProps) => {
  const { state } = useAuth();
  if (!state.isAuthenticated) {
    return <>{children}</>;
  }
  // Redirect based on user role
  const redirectTo = state.user?.role === 'admin' ? '/admin' : '/dashboard';
  return <Navigate to={redirectTo} replace />;
};

const AdminRoute: React.FC<ChildrenProps> = ({ children }: ChildrenProps) => {
  const { state } = useAuth();
  // Allow immediately if context shows authenticated admin
  if (state.isAuthenticated && state.user?.role === 'admin') return <>{children}</>;
  // Fallback: check persisted session to avoid redirect on refresh
  try {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      if (user?.role === 'admin') return <>{children}</>;
    }
  } catch {}
  // Not admin → send to dashboard (will get kicked to login there if unauthenticated)
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [langVersion, setLangVersion] = useState(0);
  useEffect(() => {
    const handler = () => setLangVersion(v => v + 1);
    i18n.addLanguageChangeListener(handler);
    return () => i18n.removeLanguageChangeListener(handler);
  }, []);
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 