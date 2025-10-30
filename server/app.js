const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");

// Import Dijkstra helpers (converted to CommonJS)
const { buildGraph, dijkstra, findOptimalRoute } = require("./dijkstra");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*", // ✅ Allow all origins during development
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Store driver location for new connections
let currentDriverLocation = null;

// ========== SOCKET.IO ==========

// When user connects (either driver or parent)
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // When driver sends live location
  socket.on("driverLocation", (coords) => {
    console.log("Received driver location:", coords);
    currentDriverLocation = coords; // Store the latest location

    // Send it to all connected clients (parents)
    io.emit("locationUpdate", coords);
  });

  // Send current driver location to newly connected parent
  if (currentDriverLocation) {
    socket.emit("locationUpdate", currentDriverLocation);
    console.log("Sent stored driver location to new client:", currentDriverLocation);
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ========== ROUTES ==========

// Route for live map (EJS)
app.get("/live", (req, res) => {
  const role = req.query.role || "parent"; // parent by default
  res.render("index", { role });
});

// Fixed pickup points (children locations)
const school = { name: "School", lat: 27.7172, lng: 85.3240 };
const pickupPoints = [
  { name: "Child 1 - School Gate", lat: 27.7172, lng: 85.3240 },
  { name: "Child 2 - Park Area", lat: 27.7200, lng: 85.3200 },
  { name: "Child 3 - Main Road", lat: 27.7150, lng: 85.3280 },
  { name: "Child 4 - Community Center", lat: 27.7220, lng: 85.3220 }
];

// API to get all pickup points (for frontend)
app.get("/api/pickup-points", (req, res) => {
  res.json({
    school,
    pickupPoints
  });
});

// API to get current driver location
app.get("/api/driver-location", (req, res) => {
  res.json({
    driverLocation: currentDriverLocation
  });
});

// Add this NEW route - Driver to specific pickup point shortest route
app.get("/api/shortest-route", (req, res) => {
  try {
    const { driverLat, driverLng, targetIndex } = req.query;
    
    if (!driverLat || !driverLng || targetIndex === undefined) {
      return res.status(400).json({ error: "Missing required parameters: driverLat, driverLng, targetIndex" });
    }
    
    const driverLocation = {
      lat: parseFloat(driverLat),
      lng: parseFloat(driverLng)
    };
    
    const targetIdx = parseInt(targetIndex);
    
    if (targetIdx < 0 || targetIdx >= pickupPoints.length) {
      return res.status(400).json({ error: "Invalid target index" });
    }
    
    // Calculate direct distance (simplified for now)
    const distance = calculateDistance(
      driverLocation.lat, driverLocation.lng,
      pickupPoints[targetIdx].lat, pickupPoints[targetIdx].lng
    );
    
    // Return direct path (you can enhance this with your Dijkstra later)
    const result = {
      distance: distance.toFixed(2),
      path: [
        [driverLocation.lat, driverLocation.lng],
        [pickupPoints[targetIdx].lat, pickupPoints[targetIdx].lng]
      ],
      waypoints: ['driver', `point${targetIdx}`],
      targetPoint: pickupPoints[targetIdx]
    };
    
    console.log(`📍 Calculated route: ${result.distance} km to ${pickupPoints[targetIdx].name}`);
    res.json(result);
    
  } catch (err) {
    console.error("Route calculation error:", err);
    res.status(500).json({ error: "Error calculating shortest route" });
  }
});

// Add this helper function at the top with your other imports
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
// API to get shortest path using Dijkstra
app.get("/shortest-path", (req, res) => {
  try {
    const { graph, nodes } = buildGraph(school, pickupPoints);
    const start = 0; // school
    const end = pickupPoints.length; // last stop
    const result = dijkstra(graph, start, end);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error calculating shortest path" });
  }
});

// Add this new route for actual road routing
app.get("/api/road-route", async (req, res) => {
  try {
    const { driverLat, driverLng, targetLat, targetLng } = req.query;
    
    if (!driverLat || !driverLng || !targetLat || !targetLng) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Use OSRM (Open Source Routing Machine) for real road routing
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${targetLng},${targetLat}?overview=full&geometries=geojson`;
    
    console.log("🛣️ Fetching road route from OSRM:", osrmUrl);
    
    const response = await fetch(osrmUrl);
    const routeData = await response.json();

    if (routeData.code !== 'Ok') {
      throw new Error('OSRM routing failed: ' + routeData.message);
    }

    // Extract the actual road path
    const roadPath = routeData.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng,lat] to [lat,lng]
    const distance = (routeData.routes[0].distance / 1000).toFixed(2); // Convert meters to km

    const result = {
      distance: distance,
      path: roadPath,
      duration: (routeData.routes[0].duration / 60).toFixed(1), // minutes
      roadDistance: true // Flag to indicate this is actual road distance
    };

    console.log(`🛣️ Road route calculated: ${distance} km, ${result.duration} min`);
    res.json(result);

  } catch (err) {
    console.error("❌ OSRM routing error:", err);
    
    // Fallback to straight line if OSRM fails
    const driverLat = parseFloat(req.query.driverLat);
    const driverLng = parseFloat(req.query.driverLng);
    const targetLat = parseFloat(req.query.targetLat);
    const targetLng = parseFloat(req.query.targetLng);
    
    const distance = calculateDistance(driverLat, driverLng, targetLat, targetLng);
    
    const result = {
      distance: distance.toFixed(2),
      path: [[driverLat, driverLng], [targetLat, targetLng]],
      duration: (distance * 2).toFixed(1), // Rough estimate: 2 min per km
      roadDistance: false // Flag to indicate this is straight line
    };
    
    console.log("🔄 Using fallback straight line route");
    res.json(result);
  }
});
// API to get optimal route (greedy + Dijkstra combo)
app.get("/optimal-route", (req, res) => {
  try {
    const result = findOptimalRoute(school, pickupPoints);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error calculating optimal route" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "Server is running", 
    connectedClients: io.engine.clientsCount,
    driverLocation: currentDriverLocation 
  });
});

// ========== SERVER START ==========
const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should connect to: http://localhost:${PORT}`);
});