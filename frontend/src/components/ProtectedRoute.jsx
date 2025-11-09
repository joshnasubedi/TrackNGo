// ProtectedRoute.jsx (with message passing)
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const userRole = user.role?.name || user.role;
  const isDriver = userRole === 'Driver';
  const isAuthenticated = userRole === 'Authenticated';

  console.log('🔐 ProtectedRoute Check:');
  console.log('Token exists:', !!token);
  console.log('User role:', userRole);

  if (!token) {
    console.log('❌ No token - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (isDriver || !isAuthenticated) {
    console.log('❌ Driver or invalid role detected - redirecting to login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Pass error message via state
    return <Navigate 
      to="/login" 
      replace 
      state={{ 
        error: 'Access denied. Please use the appropriate login page.' 
      }}
    />;
  }

  console.log('✅ Parent access granted');
  return children;
};

export default ProtectedRoute;