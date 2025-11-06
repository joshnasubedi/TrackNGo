import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import './Driverdashboard.css';
import DriverNotificationSender from './DriverNotificationSender';


const Driverhomepage = () => {
  const location = useLocation();
  const navigate = useNavigate(); // ADD THIS
  const passedCount = location.state?.count;

  const [greeting, setGreeting] = useState("Hello!");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [routeName, setRouteName] = useState("Route A");
  const [driverName, setDriverName] = useState(""); // ADD THIS

  useEffect(() => {
  // CHECK DRIVER-SPECIFIC KEYS
  const userData = JSON.parse(localStorage.getItem('driver_user'));
  if (!userData) {
    navigate('/driver-login');
    return;
  }
    
    // Set driver name
    setDriverName(userData.username || 'Driver');

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning 🌅");
    else if (hour < 17) setGreeting("Good afternoon☀️");
    else setGreeting("Good evening🌙");

    if (passedCount !== undefined) {
      setAttendanceCount(passedCount);
    }

    const socket = io("http://localhost:3000"); // Adjust for your backend

    function sendLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          socket.emit("driverLocationUpdate", coords);
        });
      } else {
        console.warn("Geolocation not supported");
      }
    }

    const locationInterval = setInterval(sendLocation, 5000);
    sendLocation();

    return () => {
      clearInterval(locationInterval);
      socket.disconnect();
    };
  }, [passedCount, navigate]); // ADD navigate to dependencies

  // ADD LOGOUT FUNCTION
const handleLogout = () => {
  // REMOVE DRIVER-SPECIFIC KEYS
  localStorage.removeItem('driver_token');
  localStorage.removeItem('driver_user');
  navigate('/driver-login');
};

  return (
    <div className="page-container" style={{ display: "flex", minHeight: "100vh", background: "var(--background, #f5f5f5)", color: "var(--text, #222)" }}>
     
      <main className="main">
        <nav className="navbar">
          <div className="logo">Driver Panel</div>
          <div className="nav-right">
            <span className="greeting">{greeting}, {driverName}</span>
            {/* ADD LOGOUT BUTTON */}
            <button 
              onClick={handleLogout}
              className="logout-btn"
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                marginLeft: '1rem'
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <section className="dashboard">
          <div className="card">
            <div className="card-icon">🗺️</div>
            <h3>Assigned Route</h3>
            <p>{routeName}</p>
          </div>

          <div className="card">
            <div className="card-icon">🧒✅</div>
            <h3>Attendance Taken</h3>
            <p>{attendanceCount}</p>
          </div>

          <div className="card">
            <div className="card-icon">📍</div>
            <h3>Live Tracking</h3>
            <p>Enabled</p>
          </div>
        </section>
        <section style={{ padding: '2rem' }}>
          <DriverNotificationSender />
        </section>
      </main>
    </div>
  );
};

export default Driverhomepage;