import React, { useEffect, useState } from "react";
import './Dashboard.css'; // Put your CSS here

const Dashboard = () => {
  const [greeting, setGreeting] = useState("Hello!");
  const [buses, setBuses] = useState(0);
  const [drivers, setDrivers] = useState(0);
  const [parents, setParents] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning 🌅");
    else if (hour < 17) setGreeting("Good afternoon☀️");
    else setGreeting("Good evening🌙");

    const animateValue = (start, end, duration, setter) => {
      let range = end - start;
      let current = start;
      let increment = end > start ? 1 : -1;
      let stepTime = Math.abs(Math.floor(duration / range));
      const timer = setInterval(() => {
        current += increment;
        setter(current);
        if (current === end) clearInterval(timer);
      }, stepTime);
    };

    animateValue(0, 1, 1000, setBuses);
    animateValue(0, 1, 1000, setDrivers);
    animateValue(0, 1, 1000, setParents);
  }, []);

  return (
    <div className="page-container" style={{ display: "flex", minHeight: "100vh", background: "var(--background)", color: "var(--text)" }}>

      <main className="main">
        <nav className="navbar">
          <div className="logo">School Bus Tracker</div>
          <div className="nav-right">
            <span className="greeting">{greeting}</span>
          </div>
        </nav>

        <section className="dashboard">
          <div className="card">
            <div className="card-icon">🚌</div>
            <h3>Total Buses</h3>
            <p>{buses}</p>
          </div>

          <div className="card">
            <div className="card-icon">🧑‍✈️</div>
            <h3>Registered Drivers</h3>
            <p>{drivers}</p>
          </div>

          <div className="card">
            <div className="card-icon">👨‍👩‍👧‍👦</div>
            <h3>Parents Tracking</h3>
            <p>{parents}</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;