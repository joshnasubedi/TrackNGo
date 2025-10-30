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