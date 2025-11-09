// frontend/src/components/ParentMap.jsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("http://localhost:5001"); // Make sure this matches your backend port

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

const ParentMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const initializedRef = useRef(false);
  const [status, setStatus] = useState("Connecting to server...");

  // Create bus icon (BLUE for parent view)
  const createBusIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background: #2563eb;
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
    if (initializedRef.current) return;

    if (!mapRef.current || !L) return;

    try {
      console.log("👨‍👩‍👧‍👦 Initializing parent map...");
      initializedRef.current = true;
      setStatus("Creating map...");
      
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([27.7172, 85.3240], 14);
      console.log("✅ Parent map created");
      
      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add pickup points with DEFAULT markers
      PICKUP_POINTS.forEach((point) => {
        L.marker([point.lat, point.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>${point.name}</b><br>Pickup Location`);
      });

      console.log("✅ Pickup points added");
      setStatus("Map ready! Connecting to driver...");

      // Socket connection events
      socket.on('connect', () => {
        console.log("✅ Parent connected to server");
        setStatus("Connected to server! Waiting for driver...");
      });

      socket.on('disconnect', () => {
        console.log("❌ Parent disconnected from server");
        setStatus("Disconnected from server");
      });

      // Listen for driver location
      socket.on("locationUpdate", (coords) => {
        console.log("📍 Parent received driver location:", coords);
        setStatus(`🚌 Driver connected! Tracking live location.`);
        
        if (!mapInstanceRef.current) return;
        
        const busIcon = createBusIcon();

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([coords.lat, coords.lng]);
          console.log("🔄 Updated driver position");
        } else {
          console.log("🚌 Creating driver bus marker");
          driverMarkerRef.current = L.marker([coords.lat, coords.lng], { 
            icon: busIcon 
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="text-align: center;">
                <h3>🚍 DRIVER LOCATION</h3>
                <p><strong>Live Tracking</strong></p>
                <p>Updated: ${new Date().toLocaleTimeString()}</p>
              </div>
            `)
            .openPopup();
          
          console.log("✅ Driver bus marker created");
        }
        
        mapInstanceRef.current.setView([coords.lat, coords.lng], 14);
      });

      // Force map resize
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          console.log("✅ Parent map resized");
        }
      }, 100);

    } catch (error) {
      console.error("❌ Error in ParentMap:", error);
      setStatus(`Error: ${error.message}`);
      initializedRef.current = false;
    }

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up parent map...");
      socket.off("locationUpdate");
      socket.off("connect");
      socket.off("disconnect");
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);

 return (
    <div className="w-full h-full"> {/* CHANGED: Use className instead of inline styles */}
      <div className="p-4 bg-green-600 text-white shadow-lg mb-0"> {/* CHANGED: Use className */}
        <h2 className="text-xl font-bold">👨‍👩‍👧‍👦 Parent Tracking</h2> {/* CHANGED: Use className */}
        <p className="mt-2">{status}</p> {/* CHANGED: Use className */}
        <p className="text-sm opacity-90 mt-1"> {/* CHANGED: Use className */}
          Live tracking of your child's school bus
        </p>
      </div>
      
      {/* Map Container - CHANGED: Use className for consistent styling */}
      <div 
        ref={mapRef} 
        className="rounded-lg shadow-lg border-2 border-gray-200"
        style={{ 
          height: "calc(100vh - 80px)",
          width: "100%",
        }} 
      />
    </div>
  );
};

export default ParentMap;