import { Link } from "react-router-dom";
import './Dashboard.css'; // Put your CSS here
import { Bus, BusFront, Home, LocationEditIcon, MehIcon, RouteIcon } from "lucide-react";
// console.log("Sidebar is rendering");


const Sidebar = () => {
  return (
    <aside className="sidebar">
  
      <h2> <BusFront style={{color: '#c3601a', marginTop: '5px'}}/> TrackNGo</h2>
      <Link to="/dashboard"> <Home style={{color: '#c3601a'}}/>Dashboard</Link>
      <Link to="/dashboard/busroutes"><Bus style={{color: '#c3601a'}}/> Bus Routes</Link>
      <Link to="/dashboard/drivers"><MehIcon style={{color: '#c3601a'}}/> Drivers</Link>
      <Link to="/dashboard/livemap"><LocationEditIcon style={{color: '#c3601a'}}/> Live Map</Link>
    
    </aside>
  );
};

export default Sidebar;
