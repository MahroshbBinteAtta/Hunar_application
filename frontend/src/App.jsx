import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CustomerHome from './pages/customer/CustomerHome';
import MyJobs from './pages/customer/MyJobs';
import PostJob from './pages/customer/PostJob';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerProfile from './pages/worker/WorkerProfile';
import JobRequests from './pages/worker/JobRequests';
import AdminPanel from './pages/admin/AdminPanel';
import AdminLogin from './pages/admin/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their default workspace dashboard
    if (user.role === 'customer') return <Navigate to="/customer" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Guard (prevents logged in users from visiting login/register)
const PublicRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (token && user) {
    if (user.role === 'customer') return <Navigate to="/customer" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/auth/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Customer Protected Pages */}
      <Route 
        path="/customer" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerHome />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/my-jobs" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyJobs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/post-job" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <PostJob />
          </ProtectedRoute>
        } 
      />

      {/* Worker Protected Pages */}
      <Route 
        path="/worker" 
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/profile" 
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/jobs" 
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <JobRequests />
          </ProtectedRoute>
        } 
      />

      {/* Admin Protected Pages */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/login" 
        element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        } 
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
