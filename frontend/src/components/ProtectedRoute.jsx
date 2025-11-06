import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role?.name;
  
  console.log('🔐 ProtectedRoute Check:');
  console.log('Token exists:', !!token);
  console.log('User role:', userRole);
  
  if (!token) {
    console.log('❌ No token - redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Allow only 'Authenticated' role (parents), block 'Driver' role
  if (userRole === 'Driver') {
    console.log('❌ Driver detected in parent route - redirecting to driver login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/driver-login" replace />;
  }
  
  console.log('✅ Parent access granted');
  return children;
};

export default ProtectedRoute;