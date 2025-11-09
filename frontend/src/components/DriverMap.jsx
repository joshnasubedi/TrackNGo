// frontend/src/components/DriverMap.jsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("http://localhost:5001", {
  transports: ['websocket', 'polling']
});
console.log("🔌 Driver Map - Socket instance created");

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
  { lat: 27.688485, lng: 85.348518, name: "Child 4 - Community Center" }
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
  const initializedRef = useRef(false);
  const [status, setStatus] = useState("Initializing...");
  
  // STATE FOR ROUTE FUNCTIONALITY
  const [routeInfo, setRouteInfo] = useState(null);
  const routeLineRef = useRef(null);
  const [destinationReached, setDestinationReached] = useState(false);
  const [autoClearTimer, setAutoClearTimer] = useState(null);
  const [showNextPickup, setShowNextPickup] = useState(false);

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

  // Function to check if driver reached destination
  const checkDestinationReached = (driverCoords, targetCoords) => {
    const distance = calculateDistance(
      driverCoords.lat, driverCoords.lng,
      targetCoords.lat, targetCoords.lng
    );
    // Consider reached if within 100 meters
    return distance < 0.1; // 0.1 km = 100 meters
  };

  // Helper function to calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Function to calculate route using ACTUAL ROADS
  const calculateRouteToPoint = async (pointIndex) => {
    // Check if map is ready
    if (!mapInstanceRef.current) {
      alert("Map is not ready yet. Please wait...");
      return;
    }

    // Check if there's already an active route
    if (routeLineRef.current) {
      alert("⚠️ Please complete the current pickup first before selecting a new one!");
      return;
    }

    if (!driverMarkerRef.current) {
      alert("Please wait for your location to load");
      return;
    }

    try {
      const driverLatLng = driverMarkerRef.current.getLatLng();
      console.log("📍 Calculating ROAD route from:", driverLatLng, "to point:", pointIndex);
      
      const targetPoint = PICKUP_POINTS[pointIndex];
      
      // Use the road routing endpoint
      const response = await fetch(
        `http://localhost:5001/api/road-route?driverLat=${driverLatLng.lat}&driverLng=${driverLatLng.lng}&targetLat=${targetPoint.lat}&targetLng=${targetPoint.lng}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const routeData = await response.json();
      console.log("🛣️ Road route data received:", routeData);
      
      if (routeData.error) {
        throw new Error(routeData.error);
      }
      
      // Remove existing route line safely (if any)
      if (routeLineRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Create new route line with different style
      const routeStyle = {
        color: '#2563eb',
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round'
      };
      
      const newRouteLine = L.polyline(routeData.path, routeStyle).addTo(mapInstanceRef.current);
      
      // Add route info popup
      newRouteLine.bindPopup(`
        <div style="text-align: center; min-width: 200px;">
          <b>${routeData.roadDistance ? '🛣️ Road Route' : '📏 Straight Line'}</b><br>
          To: <strong>${targetPoint.name}</strong><br>
          Distance: <strong>${routeData.distance} km</strong><br>
          <small style="color: #6b7280;">
            ${routeData.roadDistance ? 'Actual road path' : 'Direct line (no roads)'}
          </small>
        </div>
      `).openPopup();
      
      // Store the route line in ref
      routeLineRef.current = newRouteLine;
      
      // Update route info state
      setRouteInfo({
        distance: routeData.distance,
        duration: routeData.duration,
        to: targetPoint.name,
        targetCoords: { lat: targetPoint.lat, lng: targetPoint.lng },
        pointIndex: pointIndex,
        isRoadRoute: routeData.roadDistance || false
      });
      
      // Reset destination reached state
      setDestinationReached(false);
      setShowNextPickup(false);
      
      // Clear any existing auto-clear timer
      if (autoClearTimer) {
        clearTimeout(autoClearTimer);
        setAutoClearTimer(null);
      }
      
      // Fit map to show both driver and route (don't zoom too close)
      const routeBounds = newRouteLine.getBounds();
      const driverBounds = L.latLngBounds([driverLatLng, targetPoint]);
      const combinedBounds = routeBounds.extend(driverBounds);
      
      mapInstanceRef.current.fitBounds(combinedBounds, { 
        padding: [20, 20],
        maxZoom: 16 
      });
      
      const routeType = routeData.roadDistance ? "road route" : "straight line";
      setStatus(`🚗 Route to ${targetPoint.name} calculated (${routeData.distance} km via ${routeType})`);
      
      console.log(`🛣️ Route displayed to ${targetPoint.name}: ${routeData.distance} km`);
      
    } catch (error) {
      console.error("❌ Route calculation error:", error);
      alert("Error calculating route: " + error.message);
      
      // Fallback: Create a straight line if API fails
      createFallbackRoute(pointIndex);
    }
  };

  // Fallback function if the API fails
  const createFallbackRoute = (pointIndex) => {
    if (!driverMarkerRef.current || !mapInstanceRef.current) return;
    
    const driverLatLng = driverMarkerRef.current.getLatLng();
    const targetPoint = PICKUP_POINTS[pointIndex];
    
    const distance = calculateDistance(
      driverLatLng.lat, driverLatLng.lng,
      targetPoint.lat, targetPoint.lng
    );
    
    // Create straight line route
    const fallbackRoute = L.polyline([
      [driverLatLng.lat, driverLatLng.lng],
      [targetPoint.lat, targetPoint.lng]
    ], {
      color: '#ef4444',
      weight: 4,
      opacity: 0.6,
      dashArray: '5, 10'
    }).addTo(mapInstanceRef.current);
    
    fallbackRoute.bindPopup(`
      <div style="text-align: center;">
        <b>📏 Straight Line Route</b><br>
        To: <strong>${targetPoint.name}</strong><br>
        Distance: <strong>${distance.toFixed(2)} km</strong><br>
        <small style="color: #6b7280;">Direct path (road route unavailable)</small>
      </div>
    `).openPopup();
    
    routeLineRef.current = fallbackRoute;
    
    setRouteInfo({
      distance: distance.toFixed(2),
      duration: (distance * 2).toFixed(1),
      to: targetPoint.name,
      targetCoords: { lat: targetPoint.lat, lng: targetPoint.lng },
      pointIndex: pointIndex,
      isRoadRoute: false
    });
    
    setDestinationReached(false);
    setStatus(`🚗 Straight line route to ${targetPoint.name} (${distance.toFixed(2)} km)`);
  };

  // Test function for simple routes (without API calls)
  const testSimpleRoute = (pointIndex) => {
    if (!driverMarkerRef.current || !mapInstanceRef.current) {
      alert("Map or driver location not ready");
      return;
    }

    const driverLatLng = driverMarkerRef.current.getLatLng();
    const targetPoint = PICKUP_POINTS[pointIndex];
    
    console.log("🧪 Testing simple route to:", targetPoint.name);
    
    // Remove existing route
    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Create simple straight line
    const testRoute = L.polyline([
      [driverLatLng.lat, driverLatLng.lng],
      [targetPoint.lat, targetPoint.lng]
    ], {
      color: '#10b981',
      weight: 5,
      opacity: 0.7
    }).addTo(mapInstanceRef.current);
    
    testRoute.bindPopup(`<b>TEST ROUTE</b><br>To: ${targetPoint.name}`).openPopup();
    routeLineRef.current = testRoute;
    
    const distance = calculateDistance(
      driverLatLng.lat, driverLatLng.lng,
      targetPoint.lat, targetPoint.lng
    );
    
    setRouteInfo({
      distance: distance.toFixed(2),
      to: targetPoint.name,
      targetCoords: { lat: targetPoint.lat, lng: targetPoint.lng },
      pointIndex: pointIndex,
      isRoadRoute: false
    });
    
    setDestinationReached(false);
    setStatus(`🧪 Test route to ${targetPoint.name} (${distance.toFixed(2)} km)`);
    
    // Fit map to show route
    mapInstanceRef.current.fitBounds(testRoute.getBounds());
  };

  // Function to clear route and reset for next pickup
  const completePickup = () => {
    console.log("✅ Pickup completed, clearing route...");
    
    // Remove route line from map
    if (routeLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Clear timer
    if (autoClearTimer) {
      clearTimeout(autoClearTimer);
      setAutoClearTimer(null);
    }
    
    // Reset states
    setRouteInfo(null);
    setDestinationReached(false);
    setShowNextPickup(false);
    setStatus("✅ Pickup completed! Ready for next destination.");
    
    console.log("🔄 Ready for next pickup");
  };

  // Function when driver needs more time
  const needMoreTime = () => {
    console.log("⏰ Driver needs more time");
    if (autoClearTimer) {
      clearTimeout(autoClearTimer);
      setAutoClearTimer(null);
    }
    
    // Set new timer for 30 seconds
    const timer = setTimeout(() => {
      setShowNextPickup(true);
    }, 30000);
    
    setAutoClearTimer(timer);
    setStatus(`⏰ Waiting at ${routeInfo?.to}... (30s)`);
  };

  // Function to handle destination reached
  const handleDestinationReached = () => {
    setDestinationReached(true);
    setStatus(`🎉 Arrived at ${routeInfo?.to}!`);
    
    // Auto-show next pickup options after 10 seconds
    const timer = setTimeout(() => {
      setShowNextPickup(true);
    }, 10000);
    
    setAutoClearTimer(timer);
  };

  // Check destination in real-time (separate from map initialization)
  useEffect(() => {
    if (!driverMarkerRef.current || !routeInfo || destinationReached) return;

    const checkLocationInterval = setInterval(() => {
      if (driverMarkerRef.current && routeInfo && !destinationReached) {
        const driverCoords = driverMarkerRef.current.getLatLng();
        const reached = checkDestinationReached(driverCoords, routeInfo.targetCoords);
        
        if (reached) {
          console.log("🎉 Destination reached!");
          handleDestinationReached();
          clearInterval(checkLocationInterval);
        } else {
          const distance = calculateDistance(
            driverCoords.lat, driverCoords.lng,
            routeInfo.targetCoords.lat, routeInfo.targetCoords.lng
          );
          setStatus(`🚗 ${distance.toFixed(2)} km to ${routeInfo.to}`);
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(checkLocationInterval);
  }, [routeInfo, destinationReached]);

  // Main map initialization effect
  useEffect(() => {
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
      initializedRef.current = true;
      setStatus("Creating map...");
      
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([27.7172, 85.3240], 14);
      console.log("✅ Map instance created");
      
      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
      console.log("✅ Tile layer added");

      // ========== SOCKET EVENT LISTENERS ==========
      console.log("🔌 Setting up socket event listeners...");
      
      const handleConnect = () => {
        console.log("✅✅✅ DRIVER CONNECTED TO SERVER - Socket ID:", socket.id);
        setStatus("✅ Connected to server! Getting location...");
      };

      const handleDisconnect = () => {
        console.log("❌ Driver disconnected from server");
        setStatus("❌ Disconnected from server - Reconnecting...");
      };

      const handleError = (error) => {
        console.log("❌ Socket error:", error);
        setStatus("❌ Connection error - Check console");
      };

      const handleLocationReceived = (data) => {
        console.log("✅ Server confirmed location receipt:", data);
        setStatus(`🚌 Location shared with parents at ${new Date().toLocaleTimeString()}`);
      };

      // Add event listeners
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('error', handleError);
      socket.on('locationReceived', handleLocationReceived);

      // ========== PICKUP POINTS ==========
      console.log("📍 Adding pickup points with route functionality...");
      PICKUP_POINTS.forEach((point, index) => {
        const popupContent = `
          <div style="text-align: center; min-width: 150px;">
            <b>${point.name}</b><br>
            <small>Pickup Location</small><br>
            <button id="route-btn-${index}" 
                    style="background: #3B82F6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%;">
              🚗 Get Route
            </button>
          </div>
        `;

        const marker = L.marker([point.lat, point.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent);
        
        // When popup opens, add event listener to the button
        marker.on('popupopen', () => {
          const button = document.getElementById(`route-btn-${index}`);
          if (button) {
            button.onclick = () => {
              if (routeLineRef.current) {
                alert("⚠️ Please complete the current pickup first!");
                mapInstanceRef.current.closePopup();
                return;
              }
              
              console.log(`🎯 Route button clicked for: ${point.name}`);
              
              // Use test function for debugging, or real function for production
              // testSimpleRoute(index); // Uncomment for testing
              calculateRouteToPoint(index); // Use this for real routes
              
              mapInstanceRef.current.closePopup();
            };
          }
        });
        
        // Also add click event to marker itself
        marker.on('click', () => {
          console.log(`🎯 Marker clicked: ${point.name}`);
          
          if (routeLineRef.current) {
            alert("⚠️ Please complete the current pickup first!");
            return;
          }
          
          // Use test function for debugging, or real function for production
          // testSimpleRoute(index); // Uncomment for testing
          calculateRouteToPoint(index); // Use this for real routes
        });
        
        console.log(`✅ Added pickup point ${index + 1}`);
      });

      setStatus("Map ready! Getting your location...");

      // ========== GEOLOCATION TRACKING ==========
      if (navigator.geolocation) {
        console.log("📍 Starting REAL-TIME GPS tracking...");
        
        // More frequent updates for real-time tracking
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            console.log("📍 Real-time location update:", coords);
            setStatus(`🚌 Live tracking active! Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
            
            // Update driver marker
            const busIcon = createBusIcon();
            if (driverMarkerRef.current) {
              driverMarkerRef.current.setLatLng([coords.lat, coords.lng]);
            } else {
              driverMarkerRef.current = L.marker([coords.lat, coords.lng], { 
                icon: busIcon,
                zIndexOffset: 1000 // Ensure bus is on top
              })
                .addTo(mapInstanceRef.current)
                .bindPopup("<b>🚍 YOUR BUS</b><br>Real-time location!")
                .openPopup();
            }
            
            // Smooth pan to new location instead of setView
            mapInstanceRef.current.panTo([coords.lat, coords.lng], {
              animate: true,
              duration: 1
            });
            
            // Emit to server
            socket.emit("driverLocation", coords);
            console.log("📡 Emitted location to server:", coords);
          },
          (error) => {
            console.error("❌ GPS Error:", error);
            setStatus("❌ Location access needed for real-time tracking");
          },
          { 
            enableHighAccuracy: true,
            maximumAge: 1000, // More frequent updates
            timeout: 5000
          }
        );

        // Force map resize
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            console.log("✅ Map resized");
          }
        }, 100);

        // ========== CLEANUP FUNCTION ==========
        return () => {
          console.log("🧹 Cleaning up driver map...");
          
          // Cleanup socket listeners FIRST
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('error', handleError);
          socket.off('locationReceived', handleLocationReceived);
          
          // Cleanup GPS
          navigator.geolocation.clearWatch(watchId);
          console.log("🧹 Cleared GPS watch");
          
          // Cleanup map elements carefully
          if (routeLineRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(routeLineRef.current);
            routeLineRef.current = null;
          }
          
          if (autoClearTimer) {
            clearTimeout(autoClearTimer);
          }
          
          // Remove map instance LAST
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.remove();
            } catch (e) {
              console.log("⚠️ Map removal error (can be ignored):", e.message);
            }
            mapInstanceRef.current = null;
          }
          
          initializedRef.current = false;
          console.log("🧹 Cleanup completed");
        };
      }

    } catch (error) {
      console.error("❌ Error in DriverMap:", error);
      setStatus(`Error: ${error.message}`);
      initializedRef.current = false;
    }
  }, []); // Empty dependency array - runs only once on mount

  return (
    <div className="w-full h-full">
      <div className="p-4 bg-blue-600 text-white lg shadow-lg mb-0"> 
        <h2 className="text-xl font-bold">🚍 Driver Dashboard</h2>
        <p className="mt-2">{status}</p>
        <p className="text-sm opacity-90 mt-1">
          Your location is being shared in real time with parents.
        </p>
        
        {/* Destination Reached - Pickup Complete */}
        {destinationReached && (
          <div className="bg-green-600 text-white p-3 rounded-lg mt-3">
            <h3 className="text-lg font-bold mb-1">✅ Pickup Location Reached</h3>
            <p className="text-sm mb-2">
              You're at <strong>{routeInfo?.to}</strong>
            </p>
            
            {showNextPickup ? (
              <div className="space-y-2">
                <p className="text-yellow-300 text-sm">Ready for next pickup?</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={completePickup}
                    className="bg-green-500 text-white px-3 py-2 rounded flex-1 text-sm hover:bg-green-600 transition"
                  >
                    ✅ Complete & Next
                  </button>
                  <button 
                    onClick={needMoreTime}
                    className="bg-yellow-500 text-white px-3 py-2 rounded flex-1 text-sm hover:bg-yellow-600 transition"
                  >
                    ⏰ Need More Time
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-yellow-300 text-sm">
                Next options will appear in a moment...
              </p>
            )}
          </div>
        )}
        
        {/* Active Route Display */}
        {routeInfo && !destinationReached && (
          <div className={`${routeInfo.isRoadRoute ? 'bg-blue-500' : 'bg-orange-500'} text-white p-3 rounded-lg mt-3`}>
            <h3 className="text-lg font-bold mb-1">
              {routeInfo.isRoadRoute ? '🛣️ Road Route' : '📏 Direct Route'}
            </h3>
            <p className="text-sm">
              To: <strong>{routeInfo.to}</strong><br/>
              Distance: <strong>{routeInfo.distance} km</strong><br/>
             
            </p>
            <button 
              onClick={completePickup}
              className="bg-red-500 text-white px-3 py-1 rounded mt-2 text-sm hover:bg-red-600 transition"
            >
              Cancel Route
            </button>
          </div>
        )}

        
      </div>
      
      {/* Map Container */}
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

export default DriverMap;