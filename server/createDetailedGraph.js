const fs = require('fs');
const path = require('path');

function createDetailedGraph() {
  const nodes = {};
  const edges = [];
  
  // More detailed locations with better coverage
  const keyLocations = {
    // Driver area with more points
    'driver_area1': { lat: 27.6683069, lon: 85.3164141 },
    'driver_area2': { lat: 27.6681, lon: 85.3162 },
    'driver_area3': { lat: 27.6685, lon: 85.3166 },
    
    // Your pickup points
    'pickup1': { lat: 27.6703017, lon: 85.322441 },
    'pickup2': { lat: 27.6902319, lon: 85.3194997 },
    'pickup3': { lat: 27.6976729, lon: 85.325825 },
    'pickup4': { lat: 27.6947084, lon: 85.3401176 },
    
    // More detailed connection points for better accuracy
    // Route from driver to pickup1
    'd2p1_1': { lat: 27.669, lon: 85.317 },
    'd2p1_2': { lat: 27.6695, lon: 85.318 },
    'd2p1_3': { lat: 27.670, lon: 85.320 },
    'd2p1_4': { lat: 27.6702, lon: 85.321 },
    
    // Route from pickup1 to pickup2
    'p1_2_1': { lat: 27.672, lon: 85.321 },
    'p1_2_2': { lat: 27.675, lon: 85.320 },
    'p1_2_3': { lat: 27.678, lon: 85.319 },
    'p1_2_4': { lat: 27.682, lon: 85.319 },
    'p1_2_5': { lat: 27.686, lon: 85.319 },
    'p1_2_6': { lat: 27.689, lon: 85.319 },
    
    // Route from pickup2 to pickup3
    'p2_3_1': { lat: 27.691, lon: 85.320 },
    'p2_3_2': { lat: 27.693, lon: 85.322 },
    'p2_3_3': { lat: 27.695, lon: 85.324 },
    
    // Route from pickup3 to pickup4
    'p3_4_1': { lat: 27.696, lon: 85.327 },
    'p3_4_2': { lat: 27.6955, lon: 85.330 },
    'p3_4_3': { lat: 27.695, lon: 85.333 },
    'p3_4_4': { lat: 27.6948, lon: 85.337 }
  };
  
  // Add all nodes
  Object.assign(nodes, keyLocations);
  
  // Create more realistic road segments
  const roadSegments = [
    // Driver to pickup1 (more detailed route)
    { from: 'driver_area1', to: 'driver_area2' },
    { from: 'driver_area2', to: 'd2p1_1' },
    { from: 'd2p1_1', to: 'd2p1_2' },
    { from: 'd2p1_2', to: 'd2p1_3' },
    { from: 'd2p1_3', to: 'd2p1_4' },
    { from: 'd2p1_4', to: 'pickup1' },
    
    // pickup1 to pickup2 (main road)
    { from: 'pickup1', to: 'p1_2_1' },
    { from: 'p1_2_1', to: 'p1_2_2' },
    { from: 'p1_2_2', to: 'p1_2_3' },
    { from: 'p1_2_3', to: 'p1_2_4' },
    { from: 'p1_2_4', to: 'p1_2_5' },
    { from: 'p1_2_5', to: 'p1_2_6' },
    { from: 'p1_2_6', to: 'pickup2' },
    
    // pickup2 to pickup3
    { from: 'pickup2', to: 'p2_3_1' },
    { from: 'p2_3_1', to: 'p2_3_2' },
    { from: 'p2_3_2', to: 'p2_3_3' },
    { from: 'p2_3_3', to: 'pickup3' },
    
    // pickup3 to pickup4
    { from: 'pickup3', to: 'p3_4_1' },
    { from: 'p3_4_1', to: 'p3_4_2' },
    { from: 'p3_4_2', to: 'p3_4_3' },
    { from: 'p3_4_3', to: 'p3_4_4' },
    { from: 'p3_4_4', to: 'pickup4' },
    
    // Some alternative routes and cross connections
    { from: 'driver_area1', to: 'd2p1_2' }, // Shortcut
    { from: 'p1_2_2', to: 'p1_2_4' }, // Bypass
    { from: 'p1_2_5', to: 'p2_3_1' }  // Cross connection
  ];
  
  // Convert to bidirectional edges
  roadSegments.forEach(segment => {
    edges.push({ from: segment.from, to: segment.to });
    edges.push({ from: segment.to, to: segment.from });
  });
  
  const graph = { nodes, edges };
  
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_detailed.json');
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  
  console.log('✅ Created detailed graph!');
  console.log(`   Nodes: ${Object.keys(nodes).length}`);
  console.log(`   Edges: ${edges.length}`);
  console.log(`   Saved to: ${outputPath}`);
  
  return graph;
}

createDetailedGraph();