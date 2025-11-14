const fs = require('fs');
const path = require('path');

function createRealRoads() {
  const geojsonPath = path.join(__dirname, '..', 'osm', 'map.geojson');
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_REAL.json');
  
  console.log('🛣️ Creating REAL road graph from your OSM GeoJSON...');

  if (!fs.existsSync(geojsonPath)) {
    console.log('❌ GeoJSON file not found at:', geojsonPath);
    return;
  }

  try {
    const geojsonData = fs.readFileSync(geojsonPath, 'utf-8');
    const geojson = JSON.parse(geojsonData);
    
    console.log(`📊 Found ${geojson.features.length} features in GeoJSON`);
    
    const nodes = {};
    const edges = [];
    let nodeIdCounter = 1;
    let roadsProcessed = 0;

    console.log('🔍 Processing roads...');
    
    geojson.features.forEach((feature, index) => {
      if (feature.geometry && feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates;
        
        // Only process if it has enough points and looks like a road
        if (coordinates.length >= 2) {
          const nodeIds = [];
          
          // Create nodes for each coordinate
          coordinates.forEach(coord => {
            const nodeId = `n${nodeIdCounter++}`;
            nodes[nodeId] = {
              lat: coord[1], // GeoJSON: [lon, lat]
              lon: coord[0]
            };
            nodeIds.push(nodeId);
          });
          
          // Create edges between consecutive nodes
          for (let i = 1; i < nodeIds.length; i++) {
            edges.push({ from: nodeIds[i-1], to: nodeIds[i] });
            edges.push({ from: nodeIds[i], to: nodeIds[i-1] }); // Bidirectional
          }
          
          roadsProcessed++;
        }
      }
    });

    // ADD YOUR PICKUP POINTS TO THE GRAPH
    console.log('📍 Adding your pickup points to the road network...');
    
    const pickupPoints = {
      'pickup1': { lat: 27.6703017, lon: 85.322441 },
      'pickup2': { lat: 27.6902319, lon: 85.3194997 },
      'pickup3': { lat: 27.6976729, lon: 85.325825 },
      'pickup4': { lat: 27.6947084, lon: 85.3401176 }
    };
    
    Object.assign(nodes, pickupPoints);
    
    // Connect pickup points to nearest road nodes
    Object.keys(pickupPoints).forEach(pickupId => {
      const pickup = pickupPoints[pickupId];
      let nearestNodeId = null;
      let minDistance = Infinity;
      
      // Find nearest existing road node
      for (const nodeId in nodes) {
        if (nodeId.startsWith('n')) { // Only check road nodes, not other pickups
          const node = nodes[nodeId];
          const distance = Math.sqrt(
            Math.pow(node.lat - pickup.lat, 2) + Math.pow(node.lon - pickup.lon, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestNodeId = nodeId;
          }
        }
      }
      
      // Connect pickup to nearest road
      if (nearestNodeId && minDistance < 0.01) { // Within ~1km
        edges.push({ from: pickupId, to: nearestNodeId });
        edges.push({ from: nearestNodeId, to: pickupId });
        console.log(`   Connected ${pickupId} to road network (${minDistance.toFixed(4)}° away)`);
      }
    });

    const graph = { nodes, edges };
    
    // Save the graph
    fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
    
    console.log('\n✅ SUCCESS! Created real road graph:');
    console.log(`   Roads processed: ${roadsProcessed}`);
    console.log(`   Total nodes: ${Object.keys(nodes).length}`);
    console.log(`   Total edges: ${edges.length}`);
    console.log(`   Saved to: ${outputPath}`);
    
    // Validate
    validateGraph(graph);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
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
  
  if (validEdges === edges.length) {
    console.log('🎉 Perfect! All edges are valid.');
  } else if (validEdges > 0) {
    console.log('✅ Good enough for routing!');
  } else {
    console.log('❌ No valid edges - routing will not work.');
  }
}

createRealRoads();