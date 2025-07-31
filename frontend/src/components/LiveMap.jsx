import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
 

const LiveMap = () => {
  const [map, setMap] = useState(null);
  const [driverMarker, setDriverMarker] = useState(null);

  useEffect(() => {
    // Initialize map centered on Kathmandu or any default location
    const initialLatLng = [27.7172, 85.3240];
    const mapInstance = L.map("map").setView(initialLatLng, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapInstance);

    // Add marker for driver location, start at initial location
    const marker = L.marker(initialLatLng).addTo(mapInstance);

    setMap(mapInstance);
    setDriverMarker(marker);

    // Setup socket connection
    const socket = io("http://localhost:3000"); // adjust to your backend URL

    socket.on("liveDriverLocation", (coords) => {
      // Update marker position
      if (marker) {
        marker.setLatLng([coords.lat, coords.lng]);
        mapInstance.setView([coords.lat, coords.lng], 15);
      }
    });

    return () => {
      socket.disconnect();
      mapInstance.remove();
    };
  }, []);

  return (
    <div>
      <h2>Live Driver Location</h2>
      <div id="map" style={{ height: "500px", width: "100%" }}></div>
    </div>
  );
};

export default LiveMap;
