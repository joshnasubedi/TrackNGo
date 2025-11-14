const fs = require('fs');
const path = require('path');

function createDenseGraph() {
  const outputPath = path.join(__dirname, '..', 'osm', 'road_graph_DENSE.json');
  
  console.log('🗺️ Creating DENSE road graph with more intermediate points...');

  const nodes = {};
  const edges = [];
  
  // Your exact locations
  const keyPoints = {
    'driver_area': { lat: 27.6683069, lon: 85.3164141 },
    'pickup1': { lat: 27.6703017, lon: 85.322441 },
    'pickup2': { lat: 27.6902319, lon: 85.3194997 },
    'pickup3': { lat: 27.6976729, lon: 85.325825 },
    'pickup4': { lat: 27.6947084, lon: 85.3401176 }
  };

  // Add MANY more intermediate points to create realistic road curves
  const intermediatePoints = {
    // Route from driver to pickup1 (dense)
    'd1': { lat: 27.6685, lon: 85.3170 },
    'd2': { lat: 27.6688, lon: 85.3175 },
    'd3': { lat: 27.6690, lon: 85.3180 },
    'd4': { lat: 27.6692, lon: 85.3185 },
    'd5': { lat: 27.6695, lon: 85.3190 },
    'd6': { lat: 27.6698, lon: 85.3195 },
    'd7': { lat: 27.6700, lon: 85.3200 },
    'd8': { lat: 27.6701, lon: 85.3210 },
    'd9': { lat: 27.6702, lon: 85.3215 },
    
    // Route from pickup1 to pickup2 (dense)
    'p12_1': { lat: 27.6710, lon: 85.3215 },
    'p12_2': { lat: 27.6720, lon: 85.3210 },
    'p12_3': { lat: 27.6730, lon: 85.3205 },
    'p12_4': { lat: 27.6740, lon: 85.3200 },
    'p12_5': { lat: 27.6750, lon: 85.3198 },
    'p12_6': { lat: 27.6760, lon: 85.3196 },
    'p12_7': { lat: 27.6770, lon: 85.3194 },
    'p12_8': { lat: 27.6780, lon: 85.3193 },
    'p12_9': { lat: 27.6790, lon: 85.3192 },
    'p12_10': { lat: 27.6800, lon: 85.3191 },
    'p12_11': { lat: 27.6810, lon: 85.3190 },
    'p12_12': { lat: 27.6820, lon: 85.3190 },
    'p12_13': { lat: 27.6830, lon: 85.3190 },
    'p12_14': { lat: 27.6840, lon: 85.3190 },
    'p12_15': { lat: 27.6850, lon: 85.3190 },
    'p12_16': { lat: 27.6860, lon: 85.3190 },
    'p12_17': { lat: 27.6870, lon: 85.3190 },
    'p12_18': { lat: 27.6880, lon: 85.3190 },
    'p12_19': { lat: 27.6890, lon: 85.3190 },
    
    // Route from pickup2 to pickup3 (dense)
    'p23_1': { lat: 27.6905, lon: 85.3195 },
    'p23_2': { lat: 27.6910, lon: 85.3200 },
    'p23_3': { lat: 27.6915, lon: 85.3205 },
    'p23_4': { lat: 27.6920, lon: 85.3210 },
    'p23_5': { lat: 27.6925, lon: 85.3215 },
    'p23_6': { lat: 27.6930, lon: 85.3220 },
    'p23_7': { lat: 27.6935, lon: 85.3225 },
    'p23_8': { lat: 27.6940, lon: 85.3230 },
    'p23_9': { lat: 27.6945, lon: 85.3235 },
    'p23_10': { lat: 27.6950, lon: 85.3240 },
    'p23_11': { lat: 27.6955, lon: 85.3245 },
    'p23_12': { lat: 27.6960, lon: 85.3250 },
    
    // Route from pickup3 to pickup4 (dense)
    'p34_1': { lat: 27.6965, lon: 85.3255 },
    'p34_2': { lat: 27.6965, lon: 85.3265 },
    'p34_3': { lat: 27.6965, lon: 85.3275 },
    'p34_4': { lat: 27.6960, lon: 85.3285 },
    'p34_5': { lat: 27.6955, lon: 85.3295 },
    'p34_6': { lat: 27.6950, lon: 85.3305 },
    'p34_7': { lat: 27.6948, lon: 85.3315 },
    'p34_8': { lat: 27.6947, lon: 85.3325 },
    'p34_9': { lat: 27.6946, lon: 85.3335 },
    'p34_10': { lat: 27.6945, lon: 85.3345 },
    'p34_11': { lat: 27.6945, lon: 85.3355 },
    'p34_12': { lat: 27.6945, lon: 85.3365 },
    'p34_13': { lat: 27.6945, lon: 85.3375 },
    'p34_14': { lat: 27.6945, lon: 85.3385 },
    'p34_15': { lat: 27.6945, lon: 85.3395 }
  };

  // Add all nodes
  Object.assign(nodes, keyPoints, intermediatePoints);

  // Create dense road connections (like real roads with curves)
  const roadSegments = [
    // Driver to Pickup1 (detailed route)
    { from: 'driver_area', to: 'd1' }, { from: 'd1', to: 'd2' }, { from: 'd2', to: 'd3' },
    { from: 'd3', to: 'd4' }, { from: 'd4', to: 'd5' }, { from: 'd5', to: 'd6' },
    { from: 'd6', to: 'd7' }, { from: 'd7', to: 'd8' }, { from: 'd8', to: 'd9' },
    { from: 'd9', to: 'pickup1' },
    
    // Pickup1 to Pickup2 (main road with many points)
    { from: 'pickup1', to: 'p12_1' }, { from: 'p12_1', to: 'p12_2' }, { from: 'p12_2', to: 'p12_3' },
    { from: 'p12_3', to: 'p12_4' }, { from: 'p12_4', to: 'p12_5' }, { from: 'p12_5', to: 'p12_6' },
    { from: 'p12_6', to: 'p12_7' }, { from: 'p12_7', to: 'p12_8' }, { from: 'p12_8', to: 'p12_9' },
    { from: 'p12_9', to: 'p12_10' }, { from: 'p12_10', to: 'p12_11' }, { from: 'p12_11', to: 'p12_12' },
    { from: 'p12_12', to: 'p12_13' }, { from: 'p12_13', to: 'p12_14' }, { from: 'p12_14', to: 'p12_15' },
    { from: 'p12_15', to: 'p12_16' }, { from: 'p12_16', to: 'p12_17' }, { from: 'p12_17', to: 'p12_18' },
    { from: 'p12_18', to: 'p12_19' }, { from: 'p12_19', to: 'pickup2' },
    
    // Pickup2 to Pickup3
    { from: 'pickup2', to: 'p23_1' }, { from: 'p23_1', to: 'p23_2' }, { from: 'p23_2', to: 'p23_3' },
    { from: 'p23_3', to: 'p23_4' }, { from: 'p23_4', to: 'p23_5' }, { from: 'p23_5', to: 'p23_6' },
    { from: 'p23_6', to: 'p23_7' }, { from: 'p23_7', to: 'p23_8' }, { from: 'p23_8', to: 'p23_9' },
    { from: 'p23_9', to: 'p23_10' }, { from: 'p23_10', to: 'p23_11' }, { from: 'p23_11', to: 'p23_12' },
    { from: 'p23_12', to: 'pickup3' },
    
    // Pickup3 to Pickup4
    { from: 'pickup3', to: 'p34_1' }, { from: 'p34_1', to: 'p34_2' }, { from: 'p34_2', to: 'p34_3' },
    { from: 'p34_3', to: 'p34_4' }, { from: 'p34_4', to: 'p34_5' }, { from: 'p34_5', to: 'p34_6' },
    { from: 'p34_6', to: 'p34_7' }, { from: 'p34_7', to: 'p34_8' }, { from: 'p34_8', to: 'p34_9' },
    { from: 'p34_9', to: 'p34_10' }, { from: 'p34_10', to: 'p34_11' }, { from: 'p34_11', to: 'p34_12' },
    { from: 'p34_12', to: 'p34_13' }, { from: 'p34_13', to: 'p34_14' }, { from: 'p34_14', to: 'p34_15' },
    { from: 'p34_15', to: 'pickup4' },
    
    // Some alternative routes for realism
    { from: 'p12_5', to: 'p12_10' }, // Shortcut
    { from: 'p12_10', to: 'p12_15' }, // Bypass
    { from: 'p23_5', to: 'p34_5' }    // Cross connection
  ];

  // Convert to bidirectional edges
  roadSegments.forEach(segment => {
    edges.push({ from: segment.from, to: segment.to });
    edges.push({ from: segment.to, to: segment.from });
  });

  const graph = { nodes, edges };
  
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  
  console.log('✅ DENSE GRAPH CREATED:');
  console.log(`   Nodes: ${Object.keys(nodes).length}`);
  console.log(`   Edges: ${edges.length}`);
  console.log(`   Average points per route: ~15-20`);
  console.log(`   Saved to: ${outputPath}`);
  
  return graph;
}

createDenseGraph();