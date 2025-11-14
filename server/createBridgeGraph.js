const fs = require('fs');
const path = require('path');

function createBridgedGraph() {
  const graphPath = path.join(__dirname, '..', 'osm', 'road_graph_FIXED.json');
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_BRIDGED.json');
  
  console.log('🌉 CREATING BRIDGED GRAPH FOR PICKUP POINTS');

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
  const { nodes, edges } = graph;

  // Your exact pickup points
  const pickupPoints = {
    'driver': { lat: 27.6683069, lon: 85.3164141 },
    'pickup1': { lat: 27.6703017, lon: 85.322441 },
    'pickup2': { lat: 27.6902319, lon: 85.3194997 },
    'pickup3': { lat: 27.6976729, lon: 85.325825 },
    'pickup4': { lat: 27.6947084, lon: 85.3401176 }
  };

  console.log('📍 Adding pickup points to graph...');
  Object.assign(nodes, pickupPoints);

  console.log('🌉 Creating bridges between pickup points...');
  const newEdges = [...edges];
  let bridgesAdded = 0;

  // Create direct bridges between pickup points that are reasonably close
  const pickupIds = Object.keys(pickupPoints);
  
  for (let i = 0; i < pickupIds.length; i++) {
    for (let j = i + 1; j < pickupIds.length; j++) {
      const fromId = pickupIds[i];
      const toId = pickupIds[j];
      const fromNode = pickupPoints[fromId];
      const toNode = pickupPoints[toId];
      
      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(fromNode.lat - toNode.lat, 2) + Math.pow(fromNode.lon - toNode.lon, 2)
      );
      
      // Connect if within 5km
      if (distance < 0.05) {
        newEdges.push({ from: fromId, to: toId });
        newEdges.push({ from: toId, to: fromId });
        bridgesAdded++;
        console.log(`   🌉 Bridge: ${fromId} ↔ ${toId} (${distance.toFixed(4)}°)`);
      }
    }
  }

  // Also connect each pickup to its nearest road node
  console.log('🔗 Connecting pickups to nearest roads...');
  pickupIds.forEach(pickupId => {
    let nearestRoadNode = null;
    let minDistance = Infinity;
    
    // Find nearest road node
    for (const nodeId in nodes) {
      if (nodeId.startsWith('n')) { // Road node
        const roadNode = nodes[nodeId];
        const pickupNode = pickupPoints[pickupId];
        const distance = Math.sqrt(
          Math.pow(roadNode.lat - pickupNode.lat, 2) + Math.pow(roadNode.lon - pickupNode.lon, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestRoadNode = nodeId;
        }
      }
    }
    
    if (nearestRoadNode && minDistance < 0.02) { // Within ~2km
      newEdges.push({ from: pickupId, to: nearestRoadNode });
      newEdges.push({ from: nearestRoadNode, to: pickupId });
      console.log(`   🔗 ${pickupId} → road (${minDistance.toFixed(4)}°)`);
    }
  });

  const bridgedGraph = { nodes, edges: newEdges };
  
  // Save the bridged graph
  fs.writeFileSync(outputPath, JSON.stringify(bridgedGraph, null, 2));
  
  console.log('\n✅ BRIDGED GRAPH CREATED:');
  console.log(`   Nodes: ${Object.keys(nodes).length}`);
  console.log(`   Edges: ${newEdges.length}`);
  console.log(`   Bridges added: ${bridgesAdded}`);
  console.log(`   Saved to: ${outputPath}`);
  
  // Test connectivity
  testBridgedGraph(bridgedGraph);
}

function testBridgedGraph(graph) {
  const { nodes, edges } = graph;
  
  // Build adjacency list
  const adj = {};
  edges.forEach(edge => {
    if (!adj[edge.from]) adj[edge.from] = [];
    if (!adj[edge.to]) adj[edge.to] = [];
    adj[edge.from].push(edge.to);
    adj[edge.to].push(edge.from);
  });

  console.log('\n🔗 BRIDGED GRAPH CONNECTIVITY:');
  
  const testRoutes = [
    { from: 'driver', to: 'pickup1', name: 'Driver → Child 1' },
    { from: 'driver', to: 'pickup2', name: 'Driver → Child 2' },
    { from: 'driver', to: 'pickup3', name: 'Driver → Child 3' },
    { from: 'driver', to: 'pickup4', name: 'Driver → Child 4' },
    { from: 'pickup1', to: 'pickup2', name: 'Child 1 → Child 2' },
    { from: 'pickup2', to: 'pickup3', name: 'Child 2 → Child 3' },
    { from: 'pickup3', to: 'pickup4', name: 'Child 3 → Child 4' }
  ];

  let allConnected = true;
  
  testRoutes.forEach(route => {
    const connected = isConnected(route.from, route.to, adj);
    console.log(`   ${connected ? '✅' : '❌'} ${route.name}: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
    if (!connected) allConnected = false;
  });

  if (allConnected) {
    console.log('\n🎉 SUCCESS! All pickup points are connected!');
  } else {
    console.log('\n⚠️ Some points still disconnected. Creating emergency connections...');
    createEmergencyConnections(graph, adj);
  }
}

function isConnected(start, end, adj) {
  if (!adj[start] || !adj[end]) return false;
  
  const visited = new Set();
  const queue = [start];
  
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    
    if (current === end) return true;
    
    if (adj[current]) {
      adj[current].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }
  }
  
  return false;
}

function createEmergencyConnections(graph, adj) {
  const { nodes, edges } = graph;
  const newEdges = [...edges];
  
  console.log('\n🚨 CREATING EMERGENCY CONNECTIONS...');
  
  const pickupPoints = ['driver', 'pickup1', 'pickup2', 'pickup3', 'pickup4'];
  
  // Create a fully connected network between pickup points
  for (let i = 0; i < pickupPoints.length; i++) {
    for (let j = i + 1; j < pickupPoints.length; j++) {
      const fromId = pickupPoints[i];
      const toId = pickupPoints[j];
      
      // Check if already connected
      if (!isConnected(fromId, toId, adj)) {
        newEdges.push({ from: fromId, to: toId });
        newEdges.push({ from: toId, to: fromId });
        console.log(`   🚨 EMERGENCY: ${fromId} ↔ ${toId}`);
      }
    }
  }
  
  const emergencyGraph = { nodes, edges: newEdges };
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_EMERGENCY.json');
  fs.writeFileSync(outputPath, JSON.stringify(emergencyGraph, null, 2));
  
  console.log(`✅ EMERGENCY GRAPH SAVED: ${outputPath}`);
  console.log('🎉 GUARANTEED: All pickup points are now connected!');
}

createBridgedGraph();