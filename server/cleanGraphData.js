const fs = require('fs');
const path = require('path');

const graphPath = path.join(__dirname, "osm", "road_graph.json");
const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

console.log("Creating cleaned graph...");

// Strategy 1: Only keep edges where both nodes exist
const validEdges = graph.edges.filter(edge => {
  return graph.nodes[edge.from] && graph.nodes[edge.to];
});

console.log(`Original: ${graph.edges.length} edges`);
console.log(`Cleaned: ${validEdges.length} edges`);
console.log(`Removed: ${graph.edges.length - validEdges.length} invalid edges`);

if (validEdges.length === 0) {
  console.log("WARNING: No valid edges found! Trying alternative approach...");
  
  // Strategy 2: Check if there's an ID offset issue
  // Sometimes OSM data has ID mapping problems
  const nodeIdMap = {};
  Object.keys(graph.nodes).forEach(id => {
    nodeIdMap[id] = true;
  });
  
  // Try to find any valid edges at all
  let foundValid = 0;
  graph.edges.slice(0, 100).forEach(edge => {
    if (nodeIdMap[edge.from] && nodeIdMap[edge.to]) {
      foundValid++;
      console.log(`Found valid edge: ${edge.from} -> ${edge.to}`);
    }
  });
  
  console.log(`Found ${foundValid} potentially valid edges in first 100`);
}

// Save cleaned graph
const cleanedGraph = {
  nodes: graph.nodes,
  edges: validEdges
};

const outputPath = path.join(__dirname, "osm", "road_graph_cleaned.json");
fs.writeFileSync(outputPath, JSON.stringify(cleanedGraph));

console.log(`\nCleaned graph saved to: ${outputPath}`);
console.log(`Nodes: ${Object.keys(cleanedGraph.nodes).length}`);
console.log(`Edges: ${cleanedGraph.edges.length}`);

// If cleaning didn't work, we need to regenerate the graph data
if (validEdges.length === 0) {
  console.log("\n🚨 CRITICAL: No valid edges in the graph!");
  console.log("This suggests a fundamental problem with your OSM data export.");
  console.log("You may need to:");
  console.log("1. Re-export your OSM data");
  console.log("2. Check your OSM data processing pipeline");
  console.log("3. Use a different OSM data source");
}