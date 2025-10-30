import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import ParentMap from "./components/ParentMap";
import DriverMap from "./components/DriverMap";
import Dashboard from "./components/Dashboard";
import DriverLogin from "./components/DriverLogin"; 
import Driverhomepage from "./components/Driverhomepage";
// import LiveMap from "./components/LiveMap";
import Attendance from './components/Attendance';
import Layout from "./components/Layout";
import Layoutdriver from "./components/Layoutdriver";
import Driversidebar from "./components/Driversidebar";
import ImageTest from "./components/ImageTest";
import SimpleMap from "./components/SimpleMap";


function App() {
  return (
    <Router>
      <Routes>
        {/* Routes wrapped inside parentlayout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} /> {/* now works as / */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="livemap" element={<ParentMap />} />

        </Route>
  {/* Routes inside driverlayout  */}
  <Route path="/driver-homepage" element={<Layoutdriver />}>
  <Route index element={<Driverhomepage />} />  {/* renders at /driver-homepage */}
  <Route path="livemap" element={<DriverMap />} /> {/* renders at /driver-homepage/livemap */}
  <Route path="attendance" element={<Attendance />} /> {/* renders at /driver-homepage/attendance */}

</Route>

        {/* Routes outside layout (no sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/driver-login" element={<DriverLogin />} />
          <Route path="/test-images" element={<ImageTest />} />
          <Route path="/test-simple" element={<SimpleMap />} />




      </Routes>
    </Router>
  );
}

export default App;
