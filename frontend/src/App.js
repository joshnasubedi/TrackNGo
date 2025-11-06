import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import ParentMap from "./components/ParentMap";
import DriverMap from "./components/DriverMap";
import Dashboard from "./components/Dashboard";
import DriverLogin from "./components/DriverLogin"; 
import Driverhomepage from "./components/Driverhomepage";
import Attendance from './components/Attendance';
import Layout from "./components/Layout";
import Layoutdriver from "./components/Layoutdriver";
import Driversidebar from "./components/Driversidebar";
import InfoDriver from "./components/InfoDriver";
import ImageTest from "./components/ImageTest";
import SimpleMap from "./components/SimpleMap";
import RoutesInfo from "./components/RoutesInfo";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedDriverRoute from './components/ProtectedDriverRoute';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          {/* Default redirect — first page → login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/driver-login" element={<DriverLogin />} />

          {/* Protected parent routes with layout - CHANGED PATH */}
          <Route 
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/dashboard/livemap" element={<ParentMap />} />
            <Route path="/dashboard/drivers" element={<InfoDriver />} />
            <Route path="/dashboard/busroutes" element={<RoutesInfo />} />
          </Route>

          {/* Protected driver routes */}
          <Route path="/driver-homepage" element={
            <ProtectedDriverRoute>
              <Layoutdriver />
            </ProtectedDriverRoute>
          }>
            <Route index element={<Driverhomepage />} />
            <Route path="livemap" element={<DriverMap />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>

          {/* Test routes */}
          <Route path="/test-images" element={<ImageTest />} />
          <Route path="/test-simple" element={<SimpleMap />} />

          {/* Catch all route */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;