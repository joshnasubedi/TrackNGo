const { nodes, adjacencyList, findNearestNode, dijkstra } = require('./roadRouter');

console.log('🔍 TESTING ROAD NETWORK CONNECTIVITY\n');

// Test specific points that should be connected
const testRoutes = [
  {
    name: "Short route in dense area",
    start: { lat: 27.7172, lng: 85.3240 },
    end: { lat: 27.6703017, lng: 85.322441 }
  },
  {
    name: "Medium route", 
    start: { lat: 27.7172, lng: 85.3240 },
    end: { lat: 27.6902319, lng: 85.3194997 }
  },
  {
    name: "Long route",
    start: { lat: 27.7172, lng: 85.3240 },
    end: { lat: 27.6976729, lng: 85.325825 }
  }
];

testRoutes.forEach((route, index) => {
  console.log(`\n${index + 1}. ${route.name}`);
  console.log(`   From: (${route.start.lat}, ${route.start.lng})`);
  console.log(`   To: (${route.end.lat}, ${route.end.lng})`);
  
  const startNode = findNearestNode(route.start.lat, route.start.lng);
  const endNode = findNearestNode(route.end.lat, route.end.lng);
  
  if (startNode && endNode) {
    console.log(`   Start node: ${startNode}`);
    console.log(`   End node: ${endNode}`);
    
    const result = dijkstra(startNode, endNode);
    
    if (result.roadRoute) {
      console.log(`   ✅ SUCCESS: Road route found (${result.distance.toFixed(2)}km)`);
    } else {
      console.log(`   ❌ FAILED: No road route (using straight line: ${result.distance.toFixed(2)}km)`);
      console.log(`   Reason: ${result.reason}`);
    }
  } else {
    console.log(`   ❌ FAILED: Could not find road nodes`);
  }
});

// Test graph connectivity
console.log('\n📊 GRAPH CONNECTIVITY ANALYSIS');
console.log(`Total nodes in graph: ${Object.keys(nodes).length}`);
console.log(`Connected nodes (with edges): ${Object.keys(adjacencyList).length}`);
console.log(`Disconnected nodes: ${Object.keys(nodes).length - Object.keys(adjacencyList).length}`);

// Check if we have a reasonable road network
if (Object.keys(adjacencyList).length < 100) {
  console.log('\n🚨 WARNING: Very few connected nodes - road network may be incomplete');
  console.log('This could be because:');
  console.log('1. Your OSM data export was incomplete');
  console.log('2. The area has limited road data in OpenStreetMap');
  console.log('3. There was an error processing the OSM data');
}