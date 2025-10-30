// frontend/src/components/DriverMap.jsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// const socket = io("http://localhost:5001");
const socket = io("http://localhost:5001", {
  transports: ['websocket', 'polling']
});

console.log("🔌 Driver Map - Socket instance created");

// Add socket connection listeners RIGHT AFTER socket creation
socket.on('connect', () => {
  console.log("✅✅✅ DRIVER CONNECTED TO SERVER - Socket ID:", socket.id);
});

socket.on('connect_error', (error) => {
  console.log("❌ Driver connection error:", error);
});



const PICKUP_POINTS = [
  { lat: 27.7172, lng: 85.3240, name: "Child 1 - School Gate" },
  { lat: 27.7200, lng: 85.3200, name: "Child 2 - Park Area" },
  { lat: 27.7150, lng: 85.3280, name: "Child 3 - Main Road" },
  { lat: 27.7220, lng: 85.3220, name: "Child 4 - Community Center" }
];

// FIX FOR LEAFLET DEFAULT MARKERS
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DriverMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const initializedRef = useRef(false); // Track initialization
  const [status, setStatus] = useState("Initializing...");

  // Create bus icon
  const createBusIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background: #dc2626;
          border: 3px solid white;
          border-radius: 8px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        ">🚌</div>
      `,
      className: 'bus-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
  };

  useEffect(() => {
    // PREVENT DOUBLE INITIALIZATION
    if (initializedRef.current) {
      console.log("🚫 Map already initialized, skipping...");
      return;
    }

    if (!mapRef.current || !L) {
      console.log("❌ Map container or Leaflet not ready");
      return;
    }

    try {
      console.log("🚀 Initializing driver map...");
      initializedRef.current = true; // Mark as initialized immediately
      setStatus("Creating map...");
      
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([27.7172, 85.3240], 14);
      console.log("✅ Map instance created");
      
      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
      console.log("✅ Tile layer added");

      // Add pickup points with DEFAULT markers (should work now)
      console.log("📍 Adding pickup points...");
      PICKUP_POINTS.forEach((point, index) => {
        L.marker([point.lat, point.lng]) // Using default marker
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>${point.name}</b><br>Pickup Location`);
        console.log(`✅ Added pickup point ${index + 1}`);
      });

      setStatus("Map ready! Getting your location...");

      // Watch driver's location
      if (navigator.geolocation) {
        console.log("📍 Starting GPS tracking...");
        //added
         navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      console.log("📍 Immediate location found:", coords);
      setStatus(`🚌 Live tracking active!`);
      
      const busIcon = createBusIcon();
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([coords.lat, coords.lng]);
      } else {
        driverMarkerRef.current = L.marker([coords.lat, coords.lng], { 
          icon: busIcon 
        })
          .addTo(mapInstanceRef.current)
          .bindPopup("<b>🚍 YOUR BUS</b><br>You are here!")
          .openPopup();
      }
      mapInstanceRef.current.setView([coords.lat, coords.lng], 14);
      socket.emit("driverLocation", coords);
    },
    (error) => {
      console.error("❌ Immediate GPS error:", error);
    },
    { 
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
  //close
        
      const watchId = navigator.geolocation.watchPosition(
  (position) => {
    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    console.log("📍 Driver location found:", coords);
    setStatus(`🚌 Live tracking active!`);

    const busIcon = createBusIcon();

    // Update or create driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([coords.lat, coords.lng]);
    } else {
      driverMarkerRef.current = L.marker([coords.lat, coords.lng], { 
        icon: busIcon 
      })
        .addTo(mapInstanceRef.current)
        .bindPopup("<b>🚍 YOUR BUS</b><br>You are here!")
        .openPopup();
    }

    mapInstanceRef.current.setView([coords.lat, coords.lng], 14);
    
    // ⚠️ ADD THIS LINE HERE ⚠️ - Send to parents
    socket.emit("driverLocation", coords);
    console.log("📡 Sent location to parents");

  },
  (error) => {
    console.error("❌ GPS Error:", error);
    setStatus("Please allow location access");
  },
  { 
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 15000
  }
);

        return () => navigator.geolocation.clearWatch(watchId);
      }

      // Force map resize
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          console.log("✅ Map resized");
        }
      }, 100);

    } catch (error) {
      console.error("❌ Error in DriverMap:", error);
      setStatus(`Error: ${error.message}`);
      initializedRef.current = false; // Reset on error
    }

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up driver map...");
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);

return (
  <div className="w-full h-full"> {/* Use your existing layout classes */}
    <div className="p-4 bg-blue-600 text-white lg shadow-lg mb-0"> 
      <h2 className="text-xl font-bold">🚍 Driver Tracking Active</h2>
      <p className="mt-2">{status}</p>
      <p className="text-sm opacity-90 mt-1">
        Your location is being shared in real time with parents.
      </p>
    
    </div>
    
    {/* Map Container - Fixed height that won't break layout */}
    <div 
      ref={mapRef} 
      className="rounded-lg shadow-lg border-2 border-gray-200"
      style={{ 
        height: "calc(100vh - 80px)", // Fixed height instead of 100vh
        width: "100%",
      }} 
    />
  </div>
);
};

export default DriverMap;