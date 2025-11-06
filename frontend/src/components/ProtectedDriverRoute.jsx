import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedDriverRoute = ({ children }) => {
  const token = localStorage.getItem('driver_token');
  const user = JSON.parse(localStorage.getItem('driver_user') || '{}');
  
  // Temporary: Check by email instead of role
  const driverEmails = ['krishna@gmail.com', 'driver2@example.com']; // Same list as above
  const isDriver = driverEmails.includes(user.email);
  
  console.log('🔐 ProtectedDriverRoute Check:');
  console.log('Driver Token exists:', !!token);
  console.log('User email:', user.email);
  console.log('Is driver?', isDriver);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isDriver) {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_user');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedDriverRoute;