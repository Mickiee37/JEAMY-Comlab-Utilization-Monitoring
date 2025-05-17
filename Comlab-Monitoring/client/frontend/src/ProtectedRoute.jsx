import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin, isInstructor } from './authUtils';

// Protected Route component to wrap routes that require authentication
export const ProtectedRoute = ({ children, adminOnly = false, instructorOnly = false }) => {
  const location = useLocation();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login page, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If route requires admin access, check if user is admin
  if (adminOnly && !isAdmin()) {
    // Redirect to InstructorDashboard if not admin
    return <Navigate to="/InstructorDashboard" replace />;
  }
  
  // If route requires instructor access, check if user is instructor
  if (instructorOnly && !isInstructor()) {
    // Redirect to InstructorDashboard if not instructor
    return <Navigate to="/InstructorDashboard" replace />;
  }
  
  // User is authenticated and has required role, render the children
  return children;
}; 