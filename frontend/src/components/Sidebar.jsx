import { Link } from "react-router-dom";
import './Dashboard.css'; // Put your CSS here
// console.log("Sidebar is rendering");


const Sidebar = () => {
  return (
    <aside className="sidebar">
  
      <h2>🚍 TrackNGo</h2>
      <Link to="/dashboard">🏠 Dashboard</Link>
      <Link to="/dashboard/busroutes">🚌 Bus Routes</Link>
      <Link to="/dashboard/drivers">👨‍✈️ Drivers</Link>
      <Link to="/dashboard/livemap">📍 Live Map</Link>
    
    </aside>
  );
};

export default Sidebar;
