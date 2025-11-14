// frontend/src/components/DriverMap.jsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("http://localhost:5001", {
  transports: ['websocket', 'polling']
});

const PICKUP_POINTS = [
  { lat: 27.6703017, lng: 85.322441, name: "Child 1 - School Gate" },
  { lat: 27.6902319, lng: 85.3194997, name: "Child 2 - Park Area" },
  { lat: 27.6976729, lng: 85.325825, name: "Child 3 - Main Road" },
  { lat: 27.6947084, lng: 85.3401176, name: "Child 4 - Community Center" },
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

  // NEW STATES FOR NEAREST PICKUP DETECTION
  const [nearestPickup, setNearestPickup] = useState(null);
  const [allPickups, setAllPickups] = useState([]);
  const [showNearestNotification, setShowNearestNotification] = useState(true);
  const [lastCalculationTime, setLastCalculationTime] = useState(0);

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

  // NEW: Function to calculate nearest pickup point
 const calculateNearestPickup = async (driverCoords) => {
  try {
    console.log("📍 Calculating nearest pickup point...");
    
    // Test backend connection first
    const testResponse = await fetch('http://localhost:5001/api/pickup-points');
    if (!testResponse.ok) {
      throw new Error('Backend server not responding');
    }
    
    const response = await fetch(
      `http://localhost:5001/api/nearest-pickup?driverLat=${driverCoords.lat}&driverLng=${driverCoords.lng}`
    );
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    setNearestPickup(data.nearestPickup);
    setAllPickups(data.allPickups);
    setShowNearestNotification(true);
    
    console.log(`🎯 Nearest pickup: ${data.nearestPickup.point.name} - ${data.nearestPickup.distance.toFixed(2)}km`);
    
  } catch (error) {
    console.error("❌ Error calculating nearest pickup:", error);
    
    // Fallback: calculate straight-line distances locally
    const distances = PICKUP_POINTS.map((point, index) => {
      const distance = calculateDistance(
        driverCoords.lat, driverCoords.lng,
        point.lat, point.lng
      );
      return {
        index,
        point,
        distance,
        algorithm: "Straight Line (Local)"
      };
    });
    
    const nearest = distances.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
    
    setNearestPickup(nearest);
    setAllPickups(distances.sort((a, b) => a.distance - b.distance));
    setShowNearestNotification(true);
    
    // Show warning about backend
    setStatus("⚠️ Using local calculations - Backend server not available");
  }
};

  // Function to check if driver reached destination
  const checkDestinationReached = (driverCoords, targetCoords) => {
    const distance = calculateDistance(
      driverCoords.lat, driverCoords.lng,
      targetCoords.lat, targetCoords.lng
    );
    return distance < 0.1; // 0.1 km = 100 meters
  };

  // Helper function to calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Function to calculate route using OSRM
  const calculateRouteToPoint = async (pointIndex) => {
  if (!driverMarkerRef.current) {
    alert("Please wait for your location to load");
    return;
  }

  try {
    const driverLatLng = driverMarkerRef.current.getLatLng();
    const targetPoint = PICKUP_POINTS[pointIndex];

    console.log("📍 Calculating OSRM route from:", driverLatLng, "to:", targetPoint.name);

    // Test backend connection first
    const testResponse = await fetch('http://localhost:5001/api/pickup-points', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      throw new Error(`Backend server is not responding. Please make sure the server is running on port 5001.`);
    }

    // Now make the actual route request
    const response = await fetch(
      `http://localhost:5001/api/road-route?driverLat=${driverLatLng.lat}&driverLng=${driverLatLng.lng}&targetLat=${targetPoint.lat}&targetLng=${targetPoint.lng}&useOSRM=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const routeData = await response.json();
    console.log("🛣️ OSRM Route data:", routeData);

    if (!routeData.latlngs || routeData.latlngs.length === 0) {
      throw new Error("No route returned from server");
    }

    // Remove previous route
    if (routeLineRef.current) {
      if (routeLineRef.current.main) mapInstanceRef.current.removeLayer(routeLineRef.current.main);
      if (routeLineRef.current.shadow) mapInstanceRef.current.removeLayer(routeLineRef.current.shadow);
      routeLineRef.current = null;
    }

    // Draw the route with enhanced styling
    const routeStyle = { 
      color: "#2563eb", 
      weight: 8, 
      opacity: 0.9, 
      lineJoin: "round"
    };
    
    const newRouteLine = L.polyline(routeData.latlngs, routeStyle).addTo(mapInstanceRef.current);

    // Add shadow for better visibility
    const routeShadow = L.polyline(routeData.latlngs, {
      color: "#1e40af",
      weight: 12,
      opacity: 0.3,
      lineJoin: "round"
    }).addTo(mapInstanceRef.current);

    // Add popup
    newRouteLine.bindPopup(`
      <div style="text-align:center; min-width:220px; padding: 10px;">
        <div style="font-size: 16px; margin-bottom: 8px;">
        </div>
        <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; margin: 8px 0;">
          <div><strong>To:</strong> ${targetPoint.name}</div>
          <div><strong>Distance:</strong> ${routeData.distance} km</div>
        </div>
      </div>
    `).openPopup();

    routeLineRef.current = {
      main: newRouteLine,
      shadow: routeShadow
    };

    // Update route info
    setRouteInfo({
      distance: routeData.distance,
      to: targetPoint.name,
      targetCoords: { lat: targetPoint.lat, lng: targetPoint.lng },
      pointIndex,
      isRoadRoute: routeData.roadRoute || false,
      algorithm: routeData.algorithm
    });

    // Hide nearest notification when route is active
    setShowNearestNotification(false);

    // Fit map to show the route including driver's current position
    const bounds = newRouteLine.getBounds().extend(driverLatLng);
    mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });

    setStatus(`🚗 ${routeData.algorithm} route to ${targetPoint.name} (${routeData.distance} km)`);

  } catch (error) {
    console.error("❌ Route calculation error:", error);
    
    // Show more helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('Backend server')) {
      alert(`🚨 Backend Connection Error:\n\nPlease make sure:\n1. The server is running on port 5001\n2. Run: cd /Users/j/Desktop/TrackNGo/server && npx nodemon app.js\n3. Check http://localhost:5001 in your browser`);
    } else {
      alert("Error calculating route: " + error.message);
    }
  }
};

  // Function to clear route and reset for next pickup
  const completePickup = () => {
    console.log("✅ Pickup completed, clearing route...");
    
    // Remove all route layers from map
    if (routeLineRef.current && mapInstanceRef.current) {
      if (routeLineRef.current.main) {
        mapInstanceRef.current.removeLayer(routeLineRef.current.main);
      }
      if (routeLineRef.current.shadow) {
        mapInstanceRef.current.removeLayer(routeLineRef.current.shadow);
      }
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
    
    // Recalculate nearest pickup
    if (driverMarkerRef.current) {
      const driverCoords = driverMarkerRef.current.getLatLng();
      calculateNearestPickup(driverCoords);
    }
    
    setStatus("✅ Pickup completed! Ready for next destination.");
  };

  // Function when driver needs more time
  const needMoreTime = () => {
    console.log("⏰ Driver needs more time");
    if (autoClearTimer) {
      clearTimeout(autoClearTimer);
      setAutoClearTimer(null);
    }
    
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
    
    const timer = setTimeout(() => {
      setShowNextPickup(true);
    }, 10000);
    
    setAutoClearTimer(timer);
  };

  // Check destination in real-time
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
    }, 3000);

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

      // Socket event listeners
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

      // Add pickup points
      console.log("📍 Adding pickup points...");
      PICKUP_POINTS.forEach((point, index) => {
        const popupContent = `
          <div style="text-align: center; min-width: 180px;">
            <b>${point.name}</b><br>
            <small>Pickup Location ${index + 1}</small><br>
            <button id="route-btn-${index}" 
                    style="background: #3B82F6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%; font-size: 12px;">
              🚗 Get OSRM Route
            </button>
          </div>
        `;

        const marker = L.marker([point.lat, point.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent);
        
        marker.on('popupopen', () => {
          const button = document.getElementById(`route-btn-${index}`);
          if (button) {
            button.onclick = () => {
              if (routeLineRef.current) {
                alert("⚠️ Please complete the current pickup first!");
                mapInstanceRef.current.closePopup();
                return;
              }
              calculateRouteToPoint(index);
              mapInstanceRef.current.closePopup();
            };
          }
        });
        
        marker.on('click', () => {
          if (routeLineRef.current) {
            alert("⚠️ Please complete the current pickup first!");
            return;
          }
          calculateRouteToPoint(index);
        });
      });

      setStatus("Map ready! Getting your location...");

      // Geolocation tracking
      if (navigator.geolocation) {
        console.log("📍 Starting REAL-TIME GPS tracking...");
        
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            console.log("📍 Real-time location update:", coords);
            setStatus(`🚌 Live tracking active!`);
            
            // Update driver marker
            const busIcon = createBusIcon();
            if (driverMarkerRef.current) {
              driverMarkerRef.current.setLatLng([coords.lat, coords.lng]);
            } else {
              driverMarkerRef.current = L.marker([coords.lat, coords.lng], { 
                icon: busIcon,
                zIndexOffset: 1000
              })
                .addTo(mapInstanceRef.current)
                .bindPopup("<b>🚍 YOUR BUS</b><br>Real-time location!")
                .openPopup();
              
              // Calculate nearest pickup when driver location is first set
              calculateNearestPickup(coords);
            }
            
            // Recalculate nearest pickup every 30 seconds or when driver moves significantly
            const now = Date.now();
            if (now - lastCalculationTime > 30000) {
              calculateNearestPickup(coords);
              setLastCalculationTime(now);
            }
            
            // Smooth pan to new location
            mapInstanceRef.current.panTo([coords.lat, coords.lng], {
              animate: true,
              duration: 1
            });
            
            // Emit to server
            socket.emit("driverLocation", coords);
          },
          (error) => {
            console.error("❌ GPS Error:", error);
            setStatus("❌ Location access needed for real-time tracking");
          },
          { 
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000
          }
        );

        // Force map resize
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 100);

        // Cleanup function
        return () => {
          console.log("🧹 Cleaning up driver map...");
          
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('error', handleError);
          socket.off('locationReceived', handleLocationReceived);
          
          navigator.geolocation.clearWatch(watchId);
          
          if (routeLineRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(routeLineRef.current);
          }
          
          if (autoClearTimer) {
            clearTimeout(autoClearTimer);
          }
          
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.remove();
            } catch (e) {
              console.log("⚠️ Map removal error:", e.message);
            }
            mapInstanceRef.current = null;
          }
          
          initializedRef.current = false;
        };
      }

    } catch (error) {
      console.error("❌ Error in DriverMap:", error);
      setStatus(`Error: ${error.message}`);
      initializedRef.current = false;
    }
  }, []);

  return (
    <div className="w-full h-full">
      <div className="p-4 bg-blue-600 text-white lg shadow-lg mb-0"> 
        <h2 className="text-xl font-bold">🚍 Driver Dashboard</h2>
        <p className="mt-2">{status}</p>
        <p className="text-sm opacity-90 mt-1">
          Your location is being shared in real time with parents.
        </p>
        
        {/* NEAREST PICKUP NOTIFICATION */}
        {showNearestNotification && nearestPickup && !routeInfo && (
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-lg mt-3 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 flex items-center">
                   CLOSEST PICKUP POINT
    
                </h3>
                <p className="text-sm mb-2">
                  <strong>{nearestPickup.point.name}</strong><br/>
                  Distance: <strong>{nearestPickup.distance.toFixed(2)} km</strong><br/>
                </p>
                <div className="flex space-x-2 mt-2">
                  <button 
                    onClick={() => calculateRouteToPoint(nearestPickup.index)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600 transition font-bold flex items-center"
                  >
                    GET Shortest ROUTE
                  </button>
                  <button 
                    onClick={() => setShowNearestNotification(false)}
                    className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition"
                  >
                    ✕ Hide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ALL PICKUP POINTS LIST */}
       
        
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
            <h3 className="text-lg font-bold mb-1 flex items-center">
              {routeInfo.isRoadRoute ? '🛣️' : '📏'} 
              {routeInfo.algorithm} Route to {routeInfo.to}
            </h3>
            <p className="text-sm">
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