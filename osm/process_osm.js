// process_osm.js
// Usage: node process_osm.js <osm_file.osm>
// This script parses OSM XML and builds a road graph for routing.

const fs = require('fs');
const osmRead = require('osm-read');
const path = require('path');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node process_osm.js <osm_file.osm>');
  process.exit(1);
}

const nodes = {};
const edges = [];

console.log('Parsing OSM file:', inputFile);

osmRead.parse({
  filePath: inputFile,
  endDocument: () => {
    console.log('OSM parsing complete. Nodes:', Object.keys(nodes).length, 'Edges:', edges.length);
    fs.writeFileSync(path.join(__dirname, 'road_graph.json'), JSON.stringify({ nodes, edges }, null, 2));
    console.log('Graph saved to road_graph.json');
  },
  node: (node) => {
    nodes[node.id] = { id: node.id, lat: node.lat, lon: node.lon };
  },
  way: (way) => {
    if (way.tags && way.tags.highway) {
      for (let i = 1; i < way.nodeRefs.length; i++) {
        edges.push({
          from: way.nodeRefs[i - 1],
          to: way.nodeRefs[i],
        });
      }
    }
  }
});
