// process_geojson.js
// Usage: node process_geojson.js <geojson_file.json>
// This script parses GeoJSON and builds a road graph for routing.

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node process_geojson.js <geojson_file.json>');
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(inputFile));
const nodes = {};
const edges = [];
let nodeId = 1;

console.log('Parsing GeoJSON file:', inputFile);

// Helper to get or create node
function getNode(lat, lon) {
  const key = `${lat},${lon}`;
  if (!nodes[key]) {
    nodes[key] = { id: nodeId++, lat, lon };
  }
  return nodes[key].id;
}

// Process each LineString (road)
geojson.features.forEach(feature => {
  if (feature.geometry.type === 'LineString') {
    const coords = feature.geometry.coordinates;
    for (let i = 1; i < coords.length; i++) {
      const [lon1, lat1] = coords[i - 1];
      const [lon2, lat2] = coords[i];
      const id1 = getNode(lat1, lon1);
      const id2 = getNode(lat2, lon2);
      edges.push({ from: id1, to: id2 });
    }
  }
});

console.log('GeoJSON parsing complete. Nodes:', Object.keys(nodes).length, 'Edges:', edges.length);
fs.writeFileSync(path.join(__dirname, 'road_graph.json'), JSON.stringify({ nodes, edges }, null, 2));
console.log('Graph saved to road_graph.json');
