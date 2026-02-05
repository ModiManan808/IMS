import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ApplicationForm from './pages/ApplicationForm';
import EnrollmentForm from './pages/EnrollmentForm';
import Unauthorized from './pages/Unauthorized';
import AdminDashboard from './pages/admin/AdminDashboard';
import FreshApplications from './pages/admin/FreshApplications';
import PendingApplications from './pages/admin/PendingApplications';
import OngoingInterns from './pages/admin/OngoingInterns';
import RejectedApplications from './pages/admin/RejectedApplications';
import CompletedInterns from './pages/admin/CompletedInterns';
import InternDashboard from './pages/intern/InternDashboard';
import Profile from './pages/intern/Profile';
import { authService } from './services/authService';
import './App.css';

const AppContent: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [authState, setAuthState] = useState({
    isAuthenticated: authService.isAuthenticated(),
    user: authService.getCurrentUser()
  });

  // Update auth state when location changes OR when auth event fires
  const updateAuthState = () => {
    setAuthState({
      isAuthenticated: authService.isAuthenticated(),
      user: authService.getCurrentUser()
    });
  };

  useEffect(() => {
    // Update on location change
    updateAuthState();
  }, [location]);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authService.onAuthChange(updateAuthState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const showLayout = authState.isAuthenticated && authState.user;

  return (
    <div className="app">
      {showLayout && (
        <>
          <Header />
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </>
      )}
      <main className={`main-content ${showLayout ? 'with-layout' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={authState.isAuthenticated ? <Navigate to={authState.user?.role === 'Admin' ? '/admin/fresh' : '/intern/dashboard'} /> : <Login />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/enroll/:id" element={<EnrollmentForm />} />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/fresh" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <FreshApplications />
            </ProtectedRoute>
          } />
          <Route path="/admin/pending" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <PendingApplications />
            </ProtectedRoute>
          } />
          <Route path="/admin/ongoing" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <OngoingInterns />
            </ProtectedRoute>
          } />
          <Route path="/admin/rejected" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <RejectedApplications />
            </ProtectedRoute>
          } />
          <Route path="/admin/completed" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <CompletedInterns />
            </ProtectedRoute>
          } />

          <Route path="/intern/dashboard" element={
            <ProtectedRoute allowedRoles={['Intern']}>
              <InternDashboard />
            </ProtectedRoute>
          } />
          <Route path="/intern/profile" element={
            <ProtectedRoute allowedRoles={['Intern']}>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Navigate to="/admin/fresh" replace />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
