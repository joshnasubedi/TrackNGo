const path = require("path");
const fs = require("fs");
const axios = require("axios");

// Load graph data
const graphPath = path.join(__dirname, "..", "osm", "road_graph_DENSE.json");
console.log(`Looking for graph at: ${graphPath}`);

let graph;
try {
  if (!fs.existsSync(graphPath)) {
    throw new Error(`File not found at: ${graphPath}`);
  }
  
  const graphData = fs.readFileSync(graphPath, "utf-8");
  graph = JSON.parse(graphData);
  console.log(`✅ Loaded graph: ${Object.keys(graph.nodes).length} nodes, ${graph.edges.length} edges`);
} catch (error) {
  console.error("❌ Failed to load road graph:", error.message);
  process.exit(1);
}

const nodes = graph.nodes;
const edges = graph.edges;

// Build adjacency list with validation
console.log("🔍 Building road network...");
const adjacencyList = {};
let validEdges = 0;

edges.forEach(edge => {
  const fromNode = nodes[edge.from];
  const toNode = nodes[edge.to];
  
  if (fromNode && toNode && 
      typeof fromNode.lat === 'number' && typeof fromNode.lon === 'number' &&
      typeof toNode.lat === 'number' && typeof toNode.lon === 'number') {
    
    const distance = haversine(fromNode.lat, fromNode.lon, toNode.lat, toNode.lon);
    
    if (!adjacencyList[edge.from]) adjacencyList[edge.from] = [];
    adjacencyList[edge.from].push({ node: edge.to, distance });
    
    // Make bidirectional
    if (!adjacencyList[edge.to]) adjacencyList[edge.to] = [];
    adjacencyList[edge.to].push({ node: edge.from, distance });
    
    validEdges++;
  }
});

console.log(`🛣️ Road network: ${Object.keys(adjacencyList).length} connected nodes, ${validEdges} valid edges`);

// Haversine distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// DIJKSTRA ALGORITHM - MAIN ROUTING ENGINE
function dijkstra(startId, endId) {
  console.log(`\n🔄 ========== DIJKSTRA ROUTING ==========`);
  console.log(`Start: ${startId} -> End: ${endId}`);
  
  if (startId === endId) {
    console.log("📍 Start and end are the same location");
    return { path: [startId], distance: 0, roadRoute: true };
  }
  
  // Log the actual coordinates
  if (nodes[startId] && nodes[endId]) {
    console.log(`Start coordinates: (${nodes[startId].lat}, ${nodes[startId].lon})`);
    console.log(`End coordinates: (${nodes[endId].lat}, ${nodes[endId].lon})`);
  }
  
  // Check if nodes have connections
  console.log(`Start node connections: ${adjacencyList[startId] ? adjacencyList[startId].length : 0}`);
  console.log(`End node connections: ${adjacencyList[endId] ? adjacencyList[endId].length : 0}`);
  
  if (!adjacencyList[startId] || adjacencyList[startId].length === 0) {
    console.log(`❌ Start node ${startId} has NO road connections`);
    return { path: [], distance: Infinity, error: "Start node not connected to roads", roadRoute: false };
  }
  
  if (!adjacencyList[endId] || adjacencyList[endId].length === 0) {
    console.log(`❌ End node ${endId} has NO road connections`);
    return { path: [], distance: Infinity, error: "End node not connected to roads", roadRoute: false };
  }

  const distances = {};
  const previous = {};
  const visited = {};
  const queue = [];
  
  // Initialize distances
  for (const id in nodes) {
    distances[id] = Infinity;
    previous[id] = null;
  }
  distances[startId] = 0;
  queue.push({ id: startId, distance: 0 });
  
  let iterations = 0;
  const maxIterations = 20000;
  let foundDestination = false;
  
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift();
    
    if (visited[current.id]) continue;
    visited[current.id] = true;
    
    if (current.id === endId) {
      foundDestination = true;
      console.log(`🎯 Dijkstra found destination after ${iterations} iterations`);
      break;
    }
    
    const neighbors = adjacencyList[current.id] || [];
    for (const neighbor of neighbors) {
      if (visited[neighbor.node]) continue;
      
      const newDistance = distances[current.id] + neighbor.distance;
      if (newDistance < distances[neighbor.node]) {
        distances[neighbor.node] = newDistance;
        previous[neighbor.node] = current.id;
        queue.push({ id: neighbor.node, distance: newDistance });
      }
    }
  }
  
  console.log(`🔍 Dijkstra completed: ${iterations} iterations, visited ${Object.keys(visited).length} nodes`);
  
  // Reconstruct path
  const path = [];
  let current = endId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }
  
  // Check if we found a valid path
  if (path.length === 0 || path[0] !== startId) {
    console.log(`❌ DIJKSTRA: NO ROAD PATH FOUND from ${startId} to ${endId}`);
    
    // Fallback to straight line using node coordinates
    const startNode = nodes[startId];
    const endNode = nodes[endId];
    const straightDistance = haversine(startNode.lat, startNode.lon, endNode.lat, endNode.lon);
    
    console.log(`   Using straight-line fallback: ${straightDistance.toFixed(2)}km`);
    return { 
      path: [startId, endId], 
      distance: straightDistance,
      roadRoute: false,
      straightLine: true,
      reason: "No road path found between nodes"
    };
  }
  
  console.log(`✅ DIJKSTRA SUCCESS: ${path.length} nodes, ${distances[endId].toFixed(2)}km`);
  console.log(`   Path: ${path.slice(0, 5).join(' -> ')}${path.length > 5 ? ' -> ...' : ''}`);
  
  return { 
    path, 
    distance: distances[endId],
    roadRoute: true 
  };
}

// OSRM Route Calculation - FOR ACTUAL ROAD PATHS ONLY
async function getOSRMRoute(startLat, startLng, endLat, endLng) {
  try {
    console.log(`🌐 Calling OSRM API: ${startLat},${startLng} → ${endLat},${endLng}`);
    
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    const response = await axios.get(osrmUrl, { timeout: 10000 });
    
    if (response.data.code !== 'Ok' || !response.data.routes || response.data.routes.length === 0) {
      throw new Error('OSRM returned no route');
    }
    
    const route = response.data.routes[0];
    const distance = route.distance / 1000; // Convert meters to km
    const geometry = route.geometry;
    
    console.log(`✅ OSRM route found: ${distance.toFixed(2)}km, ${geometry.coordinates.length} points`);
    
    return {
      distance: distance,
      latlngs: geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng,lat] to [lat,lng]
      roadRoute: true,
      source: 'osrm'
    };
    
  } catch (error) {
    console.log(`❌ OSRM API failed: ${error.message}`);
    return null;
  }
}

// Find nearest node
function findNearestNode(lat, lon, maxDistanceKm = 1.0) {
  let nearestId = null;
  let minDist = Infinity;
  
  for (const id in nodes) {
    const node = nodes[id];
    if (typeof node.lat !== 'number' || typeof node.lon !== 'number') continue;
    
    const dist = haversine(lat, lon, node.lat, node.lon);
    if (dist < minDist) {
      minDist = dist;
      nearestId = id;
    }
  }
  
  return nearestId && minDist <= maxDistanceKm ? nearestId : null;
}

module.exports = { 
  nodes, 
  edges, 
  findNearestNode, 
  dijkstra,  // MAIN ALGORITHM
  haversine,
  getOSRMRoute  // FOR ACTUAL ROAD PATHS
};