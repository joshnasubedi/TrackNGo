// frontend/src/components/DriverMap.jsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("http://localhost:5001", {
  transports: ['websocket', 'polling']
});
console.log(" Driver Map - Socket instance created");

socket.on('connect', () => {
  console.log("DRIVER CONNECTED TO SERVER - Socket ID:", socket.id);
});

socket.on('connect_error', (error) => {
  console.log(" Driver connection error:", error);
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
//dijkstra
const [nearestPoint, setNearestPoint] = useState(null);
const [showNearestPopup, setShowNearestPopup] = useState(false);
  // Smooth animation refs
  const animationRef = useRef(null);
  const previousCoordsRef = useRef(null);
  const smoothMoveIntervalRef = useRef(null);

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
          transition: transform 0.1s ease-out;
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

  // Smooth marker movement function
  const smoothMoveMarker = (newCoords, duration = 1000) => {
    if (!driverMarkerRef.current || !previousCoordsRef.current) return;

    const startLatLng = previousCoordsRef.current;
    const endLatLng = L.latLng(newCoords.lat, newCoords.lng);
    
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth movement
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentLat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * easeProgress;
      const currentLng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * easeProgress;
      
      driverMarkerRef.current.setLatLng([currentLat, currentLng]);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Update previous coords for next movement
        previousCoordsRef.current = endLatLng;
      }
    };
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Smooth map panning function
  const smoothPanTo = (coords, duration = 1500) => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    const currentCenter = map.getCenter();
    const targetCenter = L.latLng(coords.lat, coords.lng);
    
    const startTime = performance.now();
    
    const panAnimate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      
      const currentLat = currentCenter.lat + (targetCenter.lat - currentCenter.lat) * easeProgress;
      const currentLng = currentCenter.lng + (targetCenter.lng - currentCenter.lng) * easeProgress;
      
      map.panTo([currentLat, currentLng], { animate: false });
      
      if (progress < 1) {
        requestAnimationFrame(panAnimate);
      }
    };
    
    requestAnimationFrame(panAnimate);
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
          <b>${routeData.roadDistance ? ' Road Route' : ' Straight Line'}</b><br>
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
      setStatus(` Route to ${targetPoint.name} calculated (${routeData.distance} km via ${routeType})`);
      
      console.log(` Route displayed to ${targetPoint.name}: ${routeData.distance} km`);
      
    } catch (error) {
      console.error(" Route calculation error:", error);
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
    setStatus(`Straight line route to ${targetPoint.name} (${distance.toFixed(2)} km)`);
  };

  // Function to clear route and reset for next pickup
  const completePickup = () => {
    console.log(" Pickup completed, clearing route...");
    
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
    setStatus("Pickup completed! Ready for next destination.");
    
    console.log(" Ready for next pickup");
  };

  // Function when driver needs more time
  const needMoreTime = () => {
    console.log(" Driver needs more time");
    if (autoClearTimer) {
      clearTimeout(autoClearTimer);
      setAutoClearTimer(null);
    }
    
    // Set new timer for 30 seconds
    const timer = setTimeout(() => {
      setShowNextPickup(true);
    }, 30000);
    
    setAutoClearTimer(timer);
    setStatus(` Waiting at ${routeInfo?.to}... (30s)`);
  };

  // Function to handle destination reached
  const handleDestinationReached = () => {
    setDestinationReached(true);
    setStatus(` Arrived at ${routeInfo?.to}!`);
    
    // Auto-show next pickup options after 10 seconds
    const timer = setTimeout(() => {
      setShowNextPickup(true);
    }, 10000);
    
    setAutoClearTimer(timer);
  };

  //dijkstra
  // Add this useEffect - runs when map is ready and driver location is available
// Replace the useEffect with this more robust version
useEffect(() => {
  const findNearestPickupPoint = async () => {
    try {
      console.log(" Finding nearest pickup point...");
      setStatus(" Finding nearest pickup point...");
      
      // Wait longer to ensure driver location is available
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await fetch('http://localhost:5001/api/nearest-point');
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const nearestData = await response.json();
      console.log(" Nearest point data:", nearestData);
      
      setNearestPoint(nearestData);
      setShowNearestPopup(true);
      
      // Auto-hide after 15 seconds
      setTimeout(() => {
        setShowNearestPopup(false);
      }, 10000);
      
      if (nearestData.note) {
        setStatus(`${nearestData.note}`);
      } else if (nearestData.emergency) {
        setStatus(` ${nearestData.error}`);
      } else {
        setStatus(` Nearest: ${nearestData.point.name} (${nearestData.distance} km)`);
      }
      
    } catch (error) {
      console.error("Error finding nearest point:", error);
      setStatus(" Ready - use manual 'Find Nearest' button if needed");
    }
  };
  
  // Wait 5 seconds after component mounts, then try to find nearest point
  const timer = setTimeout(findNearestPickupPoint, 2000);
  
  return () => clearTimeout(timer);
}, []); // Empty dependency array - run once on mount
  //end
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
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkLocationInterval);
  }, [routeInfo, destinationReached]);

  // Main map initialization effect
  useEffect(() => {
    if (initializedRef.current) {
      console.log(" Map already initialized, skipping...");
      return;
    }

    if (!mapRef.current || !L) {
      console.log(" Map container or Leaflet not ready");
      return;
    }

    try {
      console.log(" Initializing driver map...");
      initializedRef.current = true;
      setStatus("Creating map...");
      
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([27.7172, 85.3240], 14);
      console.log(" Map instance created");
      
      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
      console.log(" Tile layer added");

      // ========== SOCKET EVENT LISTENERS ==========
      console.log(" Setting up socket event listeners...");
      
      const handleConnect = () => {
        console.log(" DRIVER CONNECTED TO SERVER - Socket ID:", socket.id);
        setStatus(" Connected to server! Getting location...");
      };

      const handleDisconnect = () => {
        console.log("Driver disconnected from server");
        setStatus(" Disconnected from server - Reconnecting...");
      };

      const handleError = (error) => {
        console.log(" Socket error:", error);
        setStatus(" Connection error - Check console");
      };

      const handleLocationReceived = (data) => {
        console.log(" Server confirmed location receipt:", data);
        setStatus(` Location shared with parents at ${new Date().toLocaleTimeString()}`);
      };

      // Add event listeners
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('error', handleError);
      socket.on('locationReceived', handleLocationReceived);

      // ========== PICKUP POINTS ==========
      console.log(" Adding pickup points with route functionality...");
      PICKUP_POINTS.forEach((point, index) => {
        const popupContent = `
          <div style="text-align: center; min-width: 150px;">
            <b>${point.name}</b><br>
            <small>Pickup Location</small><br>
            <button id="route-btn-${index}" 
                    style="background: #3B82F6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%;">
              Get Route
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
                alert(" Please complete the current pickup first!");
                mapInstanceRef.current.closePopup();
                return;
              }
              
              console.log(` Route button clicked for: ${point.name}`);
              calculateRouteToPoint(index);
              mapInstanceRef.current.closePopup();
            };
          }
        });
        
        // Also add click event to marker itself
        marker.on('click', () => {
          console.log(` Marker clicked: ${point.name}`);
          
          if (routeLineRef.current) {
            alert(" Please complete the current pickup first!");
            return;
          }
          
          calculateRouteToPoint(index);
        });
        
        console.log(` Added pickup point ${index + 1}`);
      });

      setStatus("Map ready! Getting your location...");

      // ========== SMOOTH GEOLOCATION TRACKING ==========
      if (navigator.geolocation) {
        console.log(" Starting SMOOTH REAL-TIME GPS tracking...");
        
        // Store initial position for smooth animation
        let firstPosition = true;
        
        // More frequent updates for ultra-smooth tracking
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            console.log(" Real-time location update:", coords);
            setStatus(` Live tracking active! Speed: ${position.coords.speed || 0} m/s`);
            
            // Update driver marker with smooth animation
            const busIcon = createBusIcon();
            
            if (firstPosition) {
              // First position - instant placement
              driverMarkerRef.current = L.marker([coords.lat, coords.lng], { 
                icon: busIcon,
                zIndexOffset: 1000
              })
                .addTo(mapInstanceRef.current)
                .bindPopup("<b> YOUR BUS</b><br>Real-time location!")
                .openPopup();
              
              previousCoordsRef.current = L.latLng(coords.lat, coords.lng);
              firstPosition = false;
              
              // Smooth pan to initial position
              smoothPanTo(coords, 2000);
            } else {
              // Subsequent positions - smooth animation
              smoothMoveMarker(coords, 1500);
              
              // Smooth map following (less frequent to avoid jarring)
              if (position.coords.speed && position.coords.speed > 2) { // Only follow if moving > 2 m/s
                smoothPanTo(coords, 3000);
              }
            }
            
            // Emit to server (always do this regardless of animation)
            socket.emit("driverLocation", coords);
            console.log(" Emitted location to server:", coords);
          },
          (error) => {
            console.error(" GPS Error:", error);
            setStatus(" Location access needed for real-time tracking");
          },
          { 
            enableHighAccuracy: true,
            maximumAge: 500, // Very frequent updates (0.5 seconds)
            timeout: 10000
          }
        );

        // Force map resize
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            console.log("Map resized");
          }
        }, 100);

        // ========== CLEANUP FUNCTION ==========
        return () => {
          console.log("🧹 Cleaning up driver map...");
          
          // Cleanup animations
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          
          if (smoothMoveIntervalRef.current) {
            clearInterval(smoothMoveIntervalRef.current);
          }
          
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
              console.log("Map removal error (can be ignored):", e.message);
            }
            mapInstanceRef.current = null;
          }
          
          initializedRef.current = false;
          console.log("🧹 Cleanup completed");
        };
      }

    } catch (error) {
      console.error("Error in DriverMap:", error);
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
      {/* added */}
  {nearestPoint && showNearestPopup && (
      <div className="bg-green-700 text-white p-3 rounded-lg mt-3 animate-pulse">
        <h3 className="text-lg font-bold mb-1"> Nearest Pickup Point</h3>
        <p className="text-sm mb-2">
          <strong>{nearestPoint.point.name}</strong><br/>
          <span className="text-yellow-300">
            Only {nearestPoint.distance} km away!
          </span>
        </p>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              calculateRouteToPoint(nearestPoint.nearestIndex);
              setShowNearestPopup(false);
            }}
            className="bg-green-500 text-white px-3 py-2 rounded flex-1 text-sm hover:bg-green-600 transition"
          >
             Get Route
          </button>
          <button 
            onClick={() => setShowNearestPopup(false)}
            className="bg-gray-500 text-white px-3 py-2 rounded flex-1 text-sm hover:bg-gray-600 transition"
          >
            ✕ Dismiss
          </button>
        </div>
      </div>
    )}
      {/* end */}
        {/* Destination Reached - Pickup Complete */}
        {destinationReached && (
          <div className="bg-green-600 text-white p-3 rounded-lg mt-3">
            <h3 className="text-lg font-bold mb-1">Pickup Location Reached</h3>
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
                    Complete & Next
                  </button>
                  <button 
                    onClick={needMoreTime}
                    className="bg-yellow-500 text-white px-3 py-2 rounded flex-1 text-sm hover:bg-yellow-600 transition"
                  >
                    Need More Time
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
              {routeInfo.isRoadRoute ? ' Road Route' : ' Direct Route'}
            </h3>
            <p className="text-sm">
              To: <strong>{routeInfo.to}</strong><br/>
              Distance: <strong>{routeInfo.distance} km</strong><br/>
             
            </p>
            <button 
              onClick={completePickup}
              className="bg-green-500 text-white px-3 py-1 rounded mt-2 text-sm hover:bg-red-600 transition"
            >
              Complete Route
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