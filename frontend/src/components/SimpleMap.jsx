// frontend/src/components/SimpleMap.jsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SimpleMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    console.log("🔄 SimpleMap useEffect running");
    console.log("Map ref current:", mapRef.current);
    console.log("Leaflet available:", !!L);

    if (mapRef.current && L) {
      try {
        console.log("🚀 Initializing simple map...");
        
        // Very basic map initialization
        const map = L.map(mapRef.current).setView([27.7172, 85.3240], 13);
        
        console.log("✅ Map created:", map);
        
        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add a simple marker with default icon
        L.marker([27.7172, 85.3240])
          .addTo(map)
          .bindPopup("Hello! This is a test marker.")
          .openPopup();

        console.log("✅ Marker added");

        // Force resize
        setTimeout(() => {
          map.invalidateSize();
          console.log("✅ Map resized");
        }, 100);

      } catch (error) {
        console.error("❌ Error in SimpleMap:", error);
      }
    }
  }, []);

  return (
    <div>
      <h2>Simple Map Test</h2>
      <div 
        ref={mapRef} 
        style={{ 
          height: "400px", 
          width: "100%",
          border: "3px solid red",
          backgroundColor: "lightgray"
        }} 
      />
      <p>If you see a map above, Leaflet is working!</p>
    </div>
  );
};

export default SimpleMap;