// Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Dashboard.css"; 

function Layout() {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
