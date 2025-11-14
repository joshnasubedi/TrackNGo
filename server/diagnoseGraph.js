const fs = require('fs');
const path = require('path');

const graphPath = path.join(__dirname, '..', 'osm', 'road_graph.json');
console.log(`Loading graph from: ${graphPath}`);

const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
const { nodes, edges } = graph;

console.log('=== GRAPH STRUCTURE ANALYSIS ===');
console.log(`Total nodes: ${Object.keys(nodes).length}`);
console.log(`Total edges: ${edges.length}`);

// Check node ID format
console.log('\n=== NODE ID FORMAT ANALYSIS ===');
const nodeIds = Object.keys(nodes);
const sampleNodeIds = nodeIds.slice(0, 10);

console.log('Sample Node IDs:');
sampleNodeIds.forEach((id, index) => {
  const node = nodes[id];
  console.log(`  ${index + 1}. ID: "${id}"`);
  console.log(`     Coordinates in ID: ${id}`);
  console.log(`     Coordinates in data: (${node.lat}, ${node.lon})`);
  console.log(`     Match: ${id === `${node.lat},${node.lon}` ? '✅' : '❌'}`);
});

// Check edge structure
console.log('\n=== EDGE STRUCTURE ANALYSIS ===');
console.log('Sample Edges (first 10):');
edges.slice(0, 10).forEach((edge, index) => {
  const fromNode = nodes[edge.from];
  const toNode = nodes[edge.to];
  
  console.log(`  ${index + 1}. "${edge.from}" -> "${edge.to}"`);
  console.log(`     FROM exists: ${!!fromNode} ${fromNode ? `(${fromNode.lat}, ${fromNode.lon})` : 'MISSING'}`);
  console.log(`     TO exists: ${!!toNode} ${toNode ? `(${toNode.lat}, ${toNode.lon})` : 'MISSING'}`);
});

// Count valid/invalid edges
console.log('\n=== EDGE VALIDATION ===');
let validEdges = 0;
let invalidEdges = 0;
let missingFrom = 0;
let missingTo = 0;
let missingBoth = 0;

edges.forEach(edge => {
  const fromExists = nodes[edge.from];
  const toExists = nodes[edge.to];
  
  if (fromExists && toExists) {
    validEdges++;
  } else {
    invalidEdges++;
    if (!fromExists && !toExists) missingBoth++;
    else if (!fromExists) missingFrom++;
    else if (!toExists) missingTo++;
  }
});

console.log(`Valid edges: ${validEdges} (${((validEdges/edges.length)*100).toFixed(1)}%)`);
console.log(`Invalid edges: ${invalidEdges} (${((invalidEdges/edges.length)*100).toFixed(1)}%)`);
console.log(`  - Missing FROM only: ${missingFrom}`);
console.log(`  - Missing TO only: ${missingTo}`);
console.log(`  - Missing BOTH: ${missingBoth}`);

// Check if this is a coordinate-based graph
console.log('\n=== COORDINATE-BASED ID ANALYSIS ===');
let coordinateStyleNodes = 0;
let coordinateStyleEdges = 0;

nodeIds.slice(0, 100).forEach(id => {
  if (id.includes(',') && !isNaN(parseFloat(id.split(',')[0]))) {
    coordinateStyleNodes++;
  }
});

edges.slice(0, 100).forEach(edge => {
  if (edge.from.includes(',') && edge.to.includes(',') && 
      !isNaN(parseFloat(edge.from.split(',')[0])) && 
      !isNaN(parseFloat(edge.to.split(',')[0]))) {
    coordinateStyleEdges++;
  }
});

console.log(`Nodes using coordinate strings as IDs: ${coordinateStyleNodes}/100`);
console.log(`Edges using coordinate strings as IDs: ${coordinateStyleEdges}/100`);

// Test specific known nodes
console.log('\n=== KNOWN NODE TEST ===');
const knownNodes = [
  '27.6703017,85.322441',    // Child 1
  '27.6902319,85.3194997',   // Child 2
  '27.6976729,85.325825',    // Child 3
  '27.6947084,85.3401176'    // Child 4
];

knownNodes.forEach(nodeId => {
  const node = nodes[nodeId];
  console.log(`Node "${nodeId}": ${node ? '✅ EXISTS' : '❌ MISSING'}`);
  if (node) {
    console.log(`  Coordinates: (${node.lat}, ${node.lon})`);
    console.log(`  ID matches coordinates: ${nodeId === `${node.lat},${node.lon}` ? '✅' : '❌'}`);
  }
});

// Check adjacency list potential
console.log('\n=== ADJACENCY LIST POTENTIAL ===');
if (validEdges > 0) {
  console.log(`✅ Graph has ${validEdges} valid edges that can be used for routing`);
  console.log(`✅ ${Object.keys(nodes).length} nodes available`);
  
  // Show connectivity of known nodes
  console.log('\nKnown node connectivity:');
  knownNodes.forEach(nodeId => {
    if (nodes[nodeId]) {
      const connections = edges.filter(edge => 
        edge.from === nodeId || edge.to === nodeId
      ).length;
      console.log(`  ${nodeId}: ${connections} connections`);
    }
  });
} else {
  console.log('❌ No valid edges found - routing will not work');
  console.log('This is likely because:');
  console.log('1. Node IDs are coordinate strings but edges use different IDs');
  console.log('2. The graph data was exported incorrectly');
  console.log('3. There is a mismatch between node and edge IDs');
}

console.log('\n=== RECOMMENDATION ===');
if (validEdges === 0) {
  console.log('🚨 IMMEDIATE ACTION NEEDED:');
  console.log('1. Your graph uses coordinate strings as node IDs but edges may reference different IDs');
  console.log('2. You need to either:');
  console.log('   - Regenerate the graph with consistent node IDs');
  console.log('   - Use the emergency network for now');
  console.log('   - Fix the node/edge ID matching');
} else {
  console.log('✅ Graph structure looks good for routing');
  console.log('   Make sure your roadRouter.js uses coordinate strings as node IDs');
}