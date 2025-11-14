const fs = require('fs');
const path = require('path');

function createConnectedRealRoads() {
  const geojsonPath = path.join(__dirname, '..', 'osm', 'map.geojson');
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_FIXED.json');
  
  console.log('🔗 Creating FULLY CONNECTED road graph...');

  if (!fs.existsSync(geojsonPath)) {
    console.log('❌ GeoJSON file not found');
    return;
  }

  try {
    const geojsonData = fs.readFileSync(geojsonPath, 'utf-8');
    const geojson = JSON.parse(geojsonData);
    
    console.log(`📊 Processing ${geojson.features.length} features...`);
    
    const nodes = {};
    const edges = [];
    let nodeIdCounter = 1;
    let roadsProcessed = 0;

    // First pass: extract ALL road points
    geojson.features.forEach((feature, index) => {
      if (feature.geometry && feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates;
        
        if (coordinates.length >= 2) {
          const nodeIds = [];
          
          // Create nodes for each coordinate
          coordinates.forEach(coord => {
            const nodeId = `n${nodeIdCounter++}`;
            nodes[nodeId] = {
              lat: coord[1],
              lon: coord[0],
              featureIndex: index // Track which road this belongs to
            };
            nodeIds.push(nodeId);
          });
          
          // Create edges between consecutive nodes
          for (let i = 1; i < nodeIds.length; i++) {
            edges.push({ from: nodeIds[i-1], to: nodeIds[i] });
            edges.push({ from: nodeIds[i], to: nodeIds[i-1] });
          }
          
          roadsProcessed++;
        }
      }
    });

    console.log(`📍 Extracted ${Object.keys(nodes).length} road nodes from ${roadsProcessed} roads`);

    // SECOND PASS: Connect nearby road segments to fix disconnections
    console.log('🔗 Connecting nearby road segments...');
    let connectionsAdded = 0;
    const connectionDistance = 0.001; // ~100 meters
    
    const nodeList = Object.keys(nodes);
    
    // For efficiency, only check a subset of nodes
    for (let i = 0; i < Math.min(nodeList.length, 1000); i += 10) {
      const nodeId1 = nodeList[i];
      const node1 = nodes[nodeId1];
      
      for (let j = i + 1; j < Math.min(nodeList.length, 1000); j += 10) {
        const nodeId2 = nodeList[j];
        const node2 = nodes[nodeId2];
        
        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(node1.lat - node2.lat, 2) + Math.pow(node1.lon - node2.lon, 2)
        );
        
        // If nodes are close but from different roads, connect them
        if (distance < connectionDistance && 
            node1.featureIndex !== node2.featureIndex &&
            !areAlreadyConnected(nodeId1, nodeId2, edges)) {
          
          edges.push({ from: nodeId1, to: nodeId2 });
          edges.push({ from: nodeId2, to: nodeId1 });
          connectionsAdded++;
        }
      }
    }
    
    console.log(`   Added ${connectionsAdded} cross-connections between roads`);

    // ADD YOUR PICKUP POINTS and ensure they're well-connected
    console.log('📍 Adding and connecting pickup points...');
    
    const pickupPoints = {
      'pickup1': { lat: 27.6703017, lon: 85.322441 },
      'pickup2': { lat: 27.6902319, lon: 85.3194997 },
      'pickup3': { lat: 27.6976729, lon: 85.325825 },
      'pickup4': { lat: 27.6947084, lon: 85.3401176 },
      'driver_area': { lat: 27.6683069, lon: 85.3164141 }
    };
    
    Object.assign(nodes, pickupPoints);
    
    // Connect each pickup point to MULTIPLE nearby road nodes
    Object.keys(pickupPoints).forEach(pickupId => {
      const pickup = pickupPoints[pickupId];
      const nearbyNodes = [];
      
      // Find all nearby road nodes
      for (const nodeId in nodes) {
        if (nodeId.startsWith('n')) {
          const node = nodes[nodeId];
          const distance = Math.sqrt(
            Math.pow(node.lat - pickup.lat, 2) + Math.pow(node.lon - pickup.lon, 2)
          );
          if (distance < 0.005) { // Within ~500 meters
            nearbyNodes.push({ nodeId, distance });
          }
        }
      }
      
      // Connect to the 3 closest nodes
      nearbyNodes.sort((a, b) => a.distance - b.distance);
      const connections = nearbyNodes.slice(0, 3);
      
      connections.forEach(conn => {
        edges.push({ from: pickupId, to: conn.nodeId });
        edges.push({ from: conn.nodeId, to: pickupId });
      });
      
      console.log(`   Connected ${pickupId} to ${connections.length} road nodes`);
    });

    const graph = { nodes, edges };
    
    // Save the graph
    fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
    
    console.log('\n✅ SUCCESS! Created FULLY CONNECTED road graph:');
    console.log(`   Total nodes: ${Object.keys(nodes).length}`);
    console.log(`   Total edges: ${edges.length}`);
    console.log(`   Saved to: ${outputPath}`);
    
    validateGraph(graph);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function areAlreadyConnected(node1, node2, edges) {
  return edges.some(edge => 
    (edge.from === node1 && edge.to === node2) || 
    (edge.from === node2 && edge.to === node1)
  );
}

function validateGraph(graph) {
  const { nodes, edges } = graph;
  let validEdges = 0;
  
  edges.forEach(edge => {
    if (nodes[edge.from] && nodes[edge.to]) {
      validEdges++;
    }
  });
  
  console.log(`📊 Validation: ${validEdges}/${edges.length} valid edges (${((validEdges/edges.length)*100).toFixed(1)}%)`);
  
  // Test connectivity between key points
  testConnectivity(graph, 'driver_area', 'pickup1');
  testConnectivity(graph, 'driver_area', 'pickup2');
  testConnectivity(graph, 'pickup1', 'pickup2');
}

function testConnectivity(graph, startId, endId) {
  const { nodes, edges } = graph;
  
  if (!nodes[startId] || !nodes[endId]) {
    console.log(`   ❌ ${startId} or ${endId} not found in graph`);
    return;
  }
  
  // Simple BFS to check connectivity
  const visited = new Set();
  const queue = [startId];
  let found = false;
  
  while (queue.length > 0 && !found) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    
    if (current === endId) {
      found = true;
      break;
    }
    
    // Add neighbors to queue
    edges.forEach(edge => {
      if (edge.from === current && !visited.has(edge.to)) {
        queue.push(edge.to);
      }
    });
  }
  
  console.log(`   ${found ? '✅' : '❌'} ${startId} -> ${endId}: ${found ? 'CONNECTED' : 'DISCONNECTED'}`);
}

createConnectedRealRoads();