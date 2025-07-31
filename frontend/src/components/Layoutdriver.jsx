// Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Driversidebar from "./Driversidebar";
import './Driverdashboard.css';

function Layoutdriver() {
  return (
    <div className="driverlayout-container">
      <Driversidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );

}

export default Layoutdriver;
