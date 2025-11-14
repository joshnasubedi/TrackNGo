// app.js
const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");

// Import roadRouter functions
const { 
  nodes, 
  edges, 
  findNearestNode, 
  dijkstra,
  haversine,
  getOSRMRoute
} = require('./roadRouter');

// Create Express app FIRST
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Store current driver location
let currentDriverLocation = null;

// ========== SOCKET.IO ==========

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id, "Role:", socket.handshake.query.role || "unknown");

  // Driver location update
  socket.on("driverLocation", (coords) => {
    currentDriverLocation = coords;
    socket.emit("locationReceived", { status: "success", time: new Date().toISOString() });
    io.emit("locationUpdate", coords); // broadcast to parents
  });

  // Send current driver location to new clients
  if (currentDriverLocation) {
    socket.emit("locationUpdate", currentDriverLocation);
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ========== ROUTES ==========

// Render live map page
app.get("/live", (req, res) => {
  const role = req.query.role || "parent";
  res.render("index", { role });
});

// Fixed pickup points
const pickupPoints = [
  { name: "Child 1 - School Gate", lat: 27.6703017, lng: 85.322441 },
  { name: "Child 2 - Park Area", lat: 27.6902319, lng: 85.3194997 },
  { name: "Child 3 - Main Road", lat: 27.6976729, lng: 85.325825 },
  { name: "Child 4 - Community Center", lat: 27.6947084, lng: 85.3401176 }
];

// API: get all pickup points
app.get("/api/pickup-points", (req, res) => {
  res.json({ pickupPoints });
});

// API: current driver location
app.get("/api/driver-location", (req, res) => {
  res.json({ driverLocation: currentDriverLocation });
});

// API: get nearest pickup point USING DIJKSTRA
app.get("/api/nearest-pickup", async (req, res) => {
  try {
    const { driverLat, driverLng } = req.query;
    
    if (!driverLat || !driverLng) {
      return res.status(400).json({ error: "Driver location required" });
    }
    
    const driverLatNum = parseFloat(driverLat);
    const driverLngNum = parseFloat(driverLng);
    
    console.log(`\n📍 FINDING NEAREST PICKUP POINT USING DIJKSTRA`);
    console.log(`   Driver at: (${driverLatNum}, ${driverLngNum})`);
    
    const pickupDistances = [];
    
    // Calculate distance to each pickup point USING DIJKSTRA
    for (let i = 0; i < pickupPoints.length; i++) {
      const point = pickupPoints[i];
      
      const startNode = findNearestNode(driverLatNum, driverLngNum);
      const endNode = findNearestNode(point.lat, point.lng);
      
      let distance = Infinity;
      let algorithm = "Unknown";
      
      if (startNode && endNode) {
        // ALWAYS USE DIJKSTRA FOR DISTANCE CALCULATION
        const dijkstraResult = dijkstra(startNode, endNode);
        if (dijkstraResult.roadRoute) {
          distance = dijkstraResult.distance;
          algorithm = "Dijkstra";
        } else if (dijkstraResult.straightLine) {
          distance = dijkstraResult.distance;
          algorithm = "Straight Line (Dijkstra Fallback)";
        }
      }
      
      // If Dijkstra fails completely, use straight line
      if (distance === Infinity) {
        distance = haversine(driverLatNum, driverLngNum, point.lat, point.lng);
        algorithm = "Straight Line (Emergency)";
      }
      
      pickupDistances.push({
        index: i,
        point: point,
        distance: distance,
        algorithm: algorithm
      });
      
      console.log(`   ${point.name}: ${distance.toFixed(2)}km (${algorithm})`);
    }
    
    // Find nearest pickup point
    const nearest = pickupDistances.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
    
    console.log(`🎯 NEAREST: ${nearest.point.name} - ${nearest.distance.toFixed(2)}km`);
    
    res.json({
      nearestPickup: nearest,
      allPickups: pickupDistances.sort((a, b) => a.distance - b.distance),
      driverLocation: { lat: driverLatNum, lng: driverLngNum }
    });
    
  } catch (err) {
    console.error("💥 Nearest pickup error:", err);
    res.status(500).json({ error: "Failed to find nearest pickup: " + err.message });
  }
});

app.get("/api/road-route", async (req, res) => {
  try {
    const { driverLat, driverLng, targetLat, targetLng } = req.query;

    console.log(`\n🎯 OSRM ROAD ROUTE REQUEST`);
    console.log(`   From: (${driverLat}, ${driverLng})`);
    console.log(`   To: (${targetLat}, ${targetLng})`);

    // Validate parameters
    const driverLatNum = parseFloat(driverLat);
    const driverLngNum = parseFloat(driverLng);
    const targetLatNum = parseFloat(targetLat);
    const targetLngNum = parseFloat(targetLng);

    if (isNaN(driverLatNum) || isNaN(driverLngNum) || isNaN(targetLatNum) || isNaN(targetLngNum)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    let routeResult;

    routeResult = await getOSRMRoute(driverLatNum, driverLngNum, targetLatNum, targetLngNum);
    
    if (!routeResult) {
      console.log(" OSRM failed, falling back to Dijkstra...");
      const startNode = findNearestNode(driverLatNum, driverLngNum);
      const endNode = findNearestNode(targetLatNum, targetLngNum);
      
      if (startNode && endNode) {
        const dijkstraResult = dijkstra(startNode, endNode);
        if (dijkstraResult.roadRoute) {
          const latlngs = dijkstraResult.path.map(nodeId => [nodes[nodeId].lat, nodes[nodeId].lon]);
          routeResult = {
            distance: dijkstraResult.distance,
            latlngs: latlngs,
            roadRoute: true,
            algorithm: 'Dijkstra',
            source: 'dijkstra_fallback'
          };
        }
      }
    }

    // Final fallback to straight line
    if (!routeResult) {
      console.log("📏 Using straight-line fallback");
      const straightDistance = haversine(driverLatNum, driverLngNum, targetLatNum, targetLngNum);
      routeResult = {
        distance: straightDistance,
        latlngs: [[driverLatNum, driverLngNum], [targetLatNum, targetLngNum]],
        roadRoute: false,
        algorithm: 'Straight Line',
        source: 'emergency_fallback'
      };
    }

    console.log(`✅ Route computed via ${routeResult.algorithm}: ${routeResult.distance.toFixed(2)}km`);

    res.json({
      distance: routeResult.distance.toFixed(2),
      latlngs: routeResult.latlngs,
      roadRoute: routeResult.roadRoute,
      algorithm: routeResult.algorithm,
      source: routeResult.source,
      message: routeResult.roadRoute ? 
        `Road route found using ${routeResult.algorithm}` : 
        "Direct route (road path not available)"
    });

  } catch (err) {
    console.error("💥 ROUTE CALCULATION ERROR:", err);
    res.status(500).json({ 
      error: "Internal server error in route calculation",
      details: err.message
    });
  }
});

// API: get nearest pickup point (simple version - for backward compatibility)
app.get("/api/nearest-point", (req, res) => {
  if (!currentDriverLocation) return res.status(400).json({ error: "Driver location not available" });

  const distances = pickupPoints.map((point, index) => {
    const startNode = findNearestNode(currentDriverLocation.lat, currentDriverLocation.lng);
    const endNode = findNearestNode(point.lat, point.lng);
    if (!startNode || !endNode) return { index, distance: Infinity, point };
    const { distance } = dijkstra(startNode, endNode);
    return { index, distance, point };
  });

  const nearest = distances.reduce((closest, curr) => curr.distance < closest.distance ? curr : closest);
  res.json({ nearestIndex: nearest.index, distance: nearest.distance.toFixed(2), point: nearest.point });
});

// Test endpoint to check if routing system is working
app.get("/api/test-routing", (req, res) => {
  try {
    console.log('🧪 Testing routing system...');
    
    // Test with known coordinates that should work
    const testStart = { lat: 27.6703017, lng: 85.322441 }; // Child 1
    const testEnd = { lat: 27.6902319, lng: 85.3194997 };   // Child 2
    
    const startNode = findNearestNode(testStart.lat, testStart.lng);
    const endNode = findNearestNode(testEnd.lat, testEnd.lng);
    
    console.log('Test nodes:', { startNode, endNode });
    
    if (!startNode || !endNode) {
      return res.json({ 
        success: false,
        error: "Could not find test nodes",
        startNode,
        endNode
      });
    }
    
    const result = dijkstra(startNode, endNode);
    
    res.json({
      success: true,
      startNode,
      endNode,
      pathLength: result.path ? result.path.length : 0,
      distance: result.distance,
      roadRoute: result.roadRoute,
      straightLine: result.straightLine,
      error: result.error
    });
    
  } catch (err) {
    console.error('Test error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message
    });
  }
});

// ✅ REMOVED: The loose functions that were causing syntax errors
// async getUserNotifications() { ... }
// async debugParentChildren() { ... }
// a  // This random 'a' was causing the error

// Start server
const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should connect to: http://localhost:${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`  http://localhost:${PORT}/api/pickup-points`);
  console.log(`  http://localhost:${PORT}/api/nearest-pickup?driverLat=27.7126&driverLng=85.2804`);
  console.log(`  http://localhost:${PORT}/api/test-routing`);
});