import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { registerServiceWorker, subscribeUserToPush } from './utils/pushNotifications';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeRegister from './pages/EmployeeRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeHistory from './pages/employee/History';
import EmployeeAdjustments from './pages/employee/Adjustments';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminReports from './pages/admin/Reports';
import AdminApprovals from './pages/admin/Approvals';
import AdminSettings from './pages/admin/Settings';
import AdminPayments from './pages/admin/Payments';
import AdminCheckout from './pages/admin/Checkout';
import Todos from './pages/Todos';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/app'} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated, user, token } = useAuthStore();

  useEffect(() => {
    const setupPush = async () => {
      if (isAuthenticated && token) {
        await registerServiceWorker();
        // Request notification permission if not granted
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await subscribeUserToPush(token);
          }
        } else if (Notification.permission === 'granted') {
          await subscribeUserToPush(token);
        }
      }
    };
    setupPush();
  }, [isAuthenticated, token]);

  return (
    <BrowserRouter>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-sky-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-black"
      >
        Pular para o conteúdo principal
      </a>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#18181b',
          color: '#fff',
          border: '1px solid #27272a'
        }
      }} />
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/app') : '/register'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-employee" element={<EmployeeRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Employee Routes */}
        <Route path="/app" element={
          <ProtectedRoute allowedRole="employee">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<EmployeeDashboard />} />
          <Route path="history" element={<EmployeeHistory />} />
          <Route path="adjustments" element={<EmployeeAdjustments />} />
          <Route path="todos" element={<Todos />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="checkout" element={<AdminCheckout />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="todos" element={<Todos />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/app') : '/register'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
