 import { Link } from "react-router-dom";
import './Driverdashboard.css';
// console.log("Sidebar is rendering");


const Driversidebar = () => {
  return (
 <aside className="sidebar">
        <h2>🚍 TrackNGo</h2>
        <Link to="/driver-homepage">🏠 Driver Dashboard</Link>
      <Link to="/driver-homepage/livemap">📍 Live Map</Link>
        <Link to="/driver-homepage/attendance">✅ Take Attendance</Link>
        
    </aside>
  );
};

export default Driversidebar;