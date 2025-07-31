import { Link } from "react-router-dom";
import './Dashboard.css'; // Put your CSS here
// console.log("Sidebar is rendering");


const Sidebar = () => {
  return (
    <aside className="sidebar">
  
      <h2>🚍 TrackMyBus</h2>
      <Link to="/dashboard">🏠 Dashboard</Link>
      <Link to="/busroutes">🚌 Bus Routes</Link>
      <Link to="/drivers">👨‍✈️ Drivers</Link>
      <Link to="/livemap">📍 Live Map</Link>
      <Link to="/settings">⚙️ Settings</Link>
      <Link
        to="/login"
        onClick={() => {
          localStorage.removeItem("user");
        }}
      >
        🚪 Logout
      </Link>
    </aside>
  );
};

export default Sidebar;
