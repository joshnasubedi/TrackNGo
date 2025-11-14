// osm/check_connectivity.js
const roadGraph = require('./road_graph.json');

function areConnected(graph, startId, endId) {
  const visited = new Set();
  const queue = [startId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (nodeId === endId) return true;
    visited.add(nodeId);

  const neighbors = Array.isArray(graph.edges[nodeId]) ? graph.edges[nodeId] : [];
for (const neighbor of neighbors) {
  if (!visited.has(neighbor.target)) {
    queue.push(neighbor.target);
  }

    }
  }
  return false;
}

const startNode = 8767;
const endNode = 2131;
console.log(`Checking connectivity between ${startNode} and ${endNode}...`);
if (areConnected(roadGraph, String(startNode), String(endNode))) {
  console.log('✅ Nodes are connected!');
} else {
  console.log('❌ Nodes are NOT connected!');
}