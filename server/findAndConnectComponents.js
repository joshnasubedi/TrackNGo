const fs = require('fs');
const path = require('path');

function findAndConnectComponents() {
  const graphPath = path.join(__dirname, '..', 'osm', 'road_graph_FIXED.json');
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_FINAL.json');
  
  console.log('🔍 Analyzing graph connectivity...');

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
  const { nodes, edges } = graph;

  // Build adjacency list
  const adj = {};
  edges.forEach(edge => {
    if (!adj[edge.from]) adj[edge.from] = [];
    if (!adj[edge.to]) adj[edge.to] = [];
    adj[edge.from].push(edge.to);
    adj[edge.to].push(edge.from);
  });

  // Find connected components using BFS
  console.log('🔗 Finding connected components...');
  const visited = new Set();
  const components = [];
  
  for (const nodeId in nodes) {
    if (!visited.has(nodeId)) {
      const component = new Set();
      const queue = [nodeId];
      
      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        
        visited.add(current);
        component.add(current);
        
        if (adj[current]) {
          adj[current].forEach(neighbor => {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          });
        }
      }
      
      if (component.size > 0) {
        components.push(Array.from(component));
      }
    }
  }

  console.log(`📊 Found ${components.length} connected components`);
  
  // Show component sizes
  components.sort((a, b) => b.length - a.length);
  components.slice(0, 10).forEach((comp, index) => {
    console.log(`   Component ${index + 1}: ${comp.length} nodes`);
  });

  // Find which components contain your pickup points
  const pickupPoints = {
    'pickup1': { lat: 27.6703017, lon: 85.322441 },
    'pickup2': { lat: 27.6902319, lon: 85.3194997 },
    'pickup3': { lat: 27.6976729, lon: 85.325825 },
    'pickup4': { lat: 27.6947084, lon: 85.3401176 },
    'driver_area': { lat: 27.6683069, lon: 85.3164141 }
  };

  console.log('\n📍 Finding pickup points in components...');
  const pointComponents = new Map();
  
  Object.keys(pickupPoints).forEach(pointId => {
    let found = false;
    components.forEach((comp, compIndex) => {
      if (comp.includes(pointId)) {
        pointComponents.set(pointId, compIndex);
        console.log(`   ✅ ${pointId} found in component ${compIndex + 1}`);
        found = true;
      }
    });
    if (!found) {
      console.log(`   ❌ ${pointId} NOT FOUND in any component`);
    }
  });

  // Connect components that contain pickup points
  console.log('\n🔗 Connecting components with pickup points...');
  const newEdges = [...edges];
  let connectionsAdded = 0;

  const pickupComponentIndexes = Array.from(new Set(Array.from(pointComponents.values())));
  
  if (pickupComponentIndexes.length > 1) {
    console.log(`   Need to connect ${pickupComponentIndexes.length} components`);
    
    // Connect the main component (largest one) to others containing pickups
    const mainComponent = components[0]; // Largest component
    const otherComponents = pickupComponentIndexes.filter(idx => idx !== 0);
    
    otherComponents.forEach(compIndex => {
      const otherComponent = components[compIndex];
      
      // Find closest nodes between main component and this component
      let closestPair = null;
      let minDistance = Infinity;
      
      mainComponent.slice(0, 100).forEach(nodeId1 => { // Sample first 100 nodes
        otherComponent.slice(0, 100).forEach(nodeId2 => {
          const node1 = nodes[nodeId1];
          const node2 = nodes[nodeId2];
          const distance = Math.sqrt(
            Math.pow(node1.lat - node2.lat, 2) + Math.pow(node1.lon - node2.lon, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPair = [nodeId1, nodeId2];
          }
        });
      });
      
      if (closestPair && minDistance < 0.1) { // Within ~10km
        newEdges.push({ from: closestPair[0], to: closestPair[1] });
        newEdges.push({ from: closestPair[1], to: closestPair[0] });
        connectionsAdded++;
        console.log(`   Connected component ${compIndex + 1} to main component (${minDistance.toFixed(4)}°)`);
      }
    });
  }

  // Ensure all pickup points are in the graph and connected
  console.log('\n📍 Ensuring pickup points are connected...');
  Object.keys(pickupPoints).forEach(pointId => {
    if (!nodes[pointId]) {
      nodes[pointId] = pickupPoints[pointId];
      console.log(`   Added missing node: ${pointId}`);
    }
    
    // Connect pickup point to nearest road node if not connected
    if (!adj[pointId] || adj[pointId].length === 0) {
      let nearestNode = null;
      let minDistance = Infinity;
      
      for (const nodeId in nodes) {
        if (nodeId.startsWith('n')) { // Road node
          const node = nodes[nodeId];
          const pickup = pickupPoints[pointId];
          const distance = Math.sqrt(
            Math.pow(node.lat - pickup.lat, 2) + Math.pow(node.lon - pickup.lon, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestNode = nodeId;
          }
        }
      }
      
      if (nearestNode && minDistance < 0.01) { // Within ~1km
        newEdges.push({ from: pointId, to: nearestNode });
        newEdges.push({ from: nearestNode, to: pointId });
        console.log(`   Connected ${pointId} to road network (${minDistance.toFixed(4)}°)`);
      }
    }
  });

  const finalGraph = { nodes, edges: newEdges };
  
  // Save the final graph
  fs.writeFileSync(outputPath, JSON.stringify(finalGraph, null, 2));
  
  console.log('\n✅ FINAL GRAPH CREATED:');
  console.log(`   Total nodes: ${Object.keys(nodes).length}`);
  console.log(`   Total edges: ${newEdges.length}`);
  console.log(`   Connections added: ${connectionsAdded}`);
  console.log(`   Saved to: ${outputPath}`);
  
  // Final validation
  validateFinalGraph(finalGraph);
}

function validateFinalGraph(graph) {
  const { nodes, edges } = graph;
  
  // Build adjacency list
  const adj = {};
  edges.forEach(edge => {
    if (!adj[edge.from]) adj[edge.from] = [];
    if (!adj[edge.to]) adj[edge.to] = [];
    adj[edge.from].push(edge.to);
    adj[edge.to].push(edge.from);
  });

  console.log('\n🔗 FINAL CONNECTIVITY TEST:');
  
  const testRoutes = [
    { from: 'driver_area', to: 'pickup1', name: 'Driver → Child 1' },
    { from: 'driver_area', to: 'pickup2', name: 'Driver → Child 2' },
    { from: 'driver_area', to: 'pickup3', name: 'Driver → Child 3' },
    { from: 'driver_area', to: 'pickup4', name: 'Driver → Child 4' }
  ];

  testRoutes.forEach(route => {
    const connected = isConnected(route.from, route.to, adj);
    console.log(`   ${connected ? '✅' : '❌'} ${route.name}: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
  });
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

findAndConnectComponents();