import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import './App.css';

type ChildrenProps = { children: React.ReactNode };

const ProtectedRoute: React.FC<ChildrenProps> = ({ children }: ChildrenProps) => {
  const { state } = useAuth();
  return state.isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<ChildrenProps> = ({ children }: ChildrenProps) => {
  const { state } = useAuth();
  return !state.isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AdminRoute: React.FC<ChildrenProps> = ({ children }: ChildrenProps) => {
  const { state } = useAuth();
  return state.isAuthenticated && (state.user?.role === 'admin') ? <>{children}</> : <Navigate to="/dashboard" replace />;
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
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