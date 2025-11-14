const fs = require('fs');
const path = require('path');

function createConnectedGraph() {
  const nodes = {};
  const edges = [];
  
  // Key locations with simple IDs (NOT coordinate strings)
  const keyLocations = {
    // Driver area nodes
    'driver_node': { lat: 27.6683069, lon: 85.3164141 },
    
    // Your pickup points with simple IDs
    'pickup1': { lat: 27.6703017, lon: 85.322441 },    // Child 1
    'pickup2': { lat: 27.6902319, lon: 85.3194997 },   // Child 2  
    'pickup3': { lat: 27.6976729, lon: 85.325825 },    // Child 3
    'pickup4': { lat: 27.6947084, lon: 85.3401176 },   // Child 4
    
    // Connection nodes to create realistic routes
    'conn1': { lat: 27.672, lon: 85.321 },
    'conn2': { lat: 27.675, lon: 85.320 },
    'conn3': { lat: 27.680, lon: 85.319 },
    'conn4': { lat: 27.685, lon: 85.320 },
    'conn5': { lat: 27.688, lon: 85.322 },
    'conn6': { lat: 27.692, lon: 85.325 },
    'conn7': { lat: 27.695, lon: 85.328 },
    'conn8': { lat: 27.696, lon: 85.335 }
  };
  
  // Add all nodes
  Object.assign(nodes, keyLocations);
  
  // Create road segments (like real roads)
  const roadSegments = [
    // Route from driver to pickup1
    { from: 'driver_node', to: 'conn1' },
    { from: 'conn1', to: 'conn2' },
    { from: 'conn2', to: 'pickup1' },
    
    // Route from pickup1 to pickup2
    { from: 'pickup1', to: 'conn3' },
    { from: 'conn3', to: 'conn4' },
    { from: 'conn4', to: 'pickup2' },
    
    // Route from pickup2 to pickup3
    { from: 'pickup2', to: 'conn5' },
    { from: 'conn5', to: 'conn6' },
    { from: 'conn6', to: 'pickup3' },
    
    // Route from pickup3 to pickup4
    { from: 'pickup3', to: 'conn7' },
    { from: 'conn7', to: 'conn8' },
    { from: 'conn8', to: 'pickup4' },
    
    // Some cross connections for realism
    { from: 'conn2', to: 'conn3' },
    { from: 'conn4', to: 'conn5' },
    { from: 'conn6', to: 'conn7' }
  ];
  
  // Convert to bidirectional edges (cars can go both ways)
  roadSegments.forEach(segment => {
    edges.push({ from: segment.from, to: segment.to });
    edges.push({ from: segment.to, to: segment.from }); // Reverse direction
  });
  
  const graph = { nodes, edges };
  
  // Save to osm directory
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_connected.json');
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  
  console.log('✅ Created fully connected graph!');
  console.log(`   Nodes: ${Object.keys(nodes).length}`);
  console.log(`   Edges: ${edges.length}`);
  console.log(`   Saved to: ${outputPath}`);
  
  return graph;
}

// Run the function
const newGraph = createConnectedGraph();

// Verify it works
console.log('\n🧪 Verifying graph connectivity...');
let validEdges = 0;
newGraph.edges.forEach(edge => {
  if (newGraph.nodes[edge.from] && newGraph.nodes[edge.to]) {
    validEdges++;
  }
});

console.log(`📊 ${validEdges}/${newGraph.edges.length} edges are valid (${((validEdges/newGraph.edges.length)*100).toFixed(1)}%)`);

if (validEdges === newGraph.edges.length) {
  console.log('🎉 SUCCESS: All edges are valid! Routing should work now.');
} else {
  console.log('❌ Some edges are invalid. Check the graph data.');
}