import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 

import "bootstrap/dist/css/bootstrap.min.css";
import UserType from './usertype'; // Import UserType component
import Login from './Login.jsx';
import Register from './Register';
import Dashboard from './Dashboard.jsx';
import App from './App.jsx';
import QRCodeGenerator from './QRCodeGenerator';
import VerifyEmail from './VerifyEmail';
import ReCAPTCHA from 'react-google-recaptcha';
import QRScanner from './QRScanner.jsx';
import ResetPassword from "./ResetPassword";
import InstructorDashboard from "./instructorDashboard.jsx";
import History from './History.jsx';
import { ProtectedRoute } from './ProtectedRoute';
import { initAuth, isAuthenticated, isAdmin } from './authUtils';

// Initialize authentication on app load
initAuth();

// Helper function to determine if user should be redirected
const AdminRouteWrapper = ({ children }) => {
  return isAdmin() ? children : <Navigate to="/InstructorDashboard" replace />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<UserType />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Dashboard - accessible for admins, redirects others to InstructorDashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {isAdmin() ? <Dashboard /> : <Navigate to="/InstructorDashboard" replace />}
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/app" element={
          <ProtectedRoute adminOnly={true}>
            <App />
          </ProtectedRoute>
        } />
        
        <Route path="/qr-code" element={
          <ProtectedRoute adminOnly={true}>
            <QRCodeGenerator />
          </ProtectedRoute>
        } />
        
        <Route path="/generate-qr" element={
          <ProtectedRoute adminOnly={true}>
            <QRCodeGenerator />
          </ProtectedRoute>
        } />
        
        {/* Instructor routes */}
        <Route path="/scan-qr" element={
          <ProtectedRoute instructorOnly={true}>
            <QRScanner />
          </ProtectedRoute>
        } />
        
        <Route path="/history" element={
          <ProtectedRoute instructorOnly={true}>
            <History />
          </ProtectedRoute>
        } />
        
        <Route path="/InstructorDashboard" element={
          <ProtectedRoute>
            <InstructorDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route - redirect to appropriate dashboard based on role */}
        <Route path="*" element={
          isAuthenticated() ? 
            (isAdmin() ? <Navigate to="/app" replace /> : <Navigate to="/InstructorDashboard" replace />) : 
            <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  </StrictMode>
);
