
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import EmployeeDashboard from '@/pages/EmployeeDashboard.jsx';
import AttendanceRecords from '@/pages/AttendanceRecords.jsx';
import PayrollSummary from '@/pages/PayrollSummary.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-dashboard"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-records"
            element={
              <ProtectedRoute requiredRole="employee">
                <AttendanceRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll-summary"
            element={
              <ProtectedRoute requiredRole="employee">
                <PayrollSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-foreground mb-4">404 - Page not found</h1>
                  <p className="text-muted-foreground mb-6">The page you are looking for does not exist</p>
                  <a href="/" className="text-primary hover:underline">
                    Back to home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
