// components/Home.jsx
import React from "react";
import HomeLayout from "../layouts/HomeLayout";
import MapComponent from "./MapComponent";

const Home = () => {
  return (
    <HomeLayout>
      <div>
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        <p>This is the home page content.</p>
        <MapComponent />
      </div>
    </HomeLayout>
  );
};

export default Home;
