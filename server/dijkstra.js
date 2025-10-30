// dijkstra.js
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

function buildGraphWithDriver(driverLocation, pickupPoints) {
  const nodes = ['driver', ...pickupPoints.map((_, i) => `point${i}`)];
  const graph = {};
  
  // Initialize graph
  nodes.forEach(node => {
    graph[node] = {};
  });
  
  // Add edges from driver to all pickup points
  pickupPoints.forEach((point, i) => {
    const distance = calculateDistance(
      driverLocation.lat, driverLocation.lng,
      point.lat, point.lng
    );
    graph['driver'][`point${i}`] = distance;
    graph[`point${i}`]['driver'] = distance;
  });
  
  // Add edges between pickup points
  for (let i = 0; i < pickupPoints.length; i++) {
    for (let j = i + 1; j < pickupPoints.length; j++) {
      const distance = calculateDistance(
        pickupPoints[i].lat, pickupPoints[i].lng,
        pickupPoints[j].lat, pickupPoints[j].lng
      );
      graph[`point${i}`][`point${j}`] = distance;
      graph[`point${j}`][`point${i}`] = distance;
    }
  }
  
  return { graph, nodes };
}

function dijkstra(graph, start) {
  const distances = {};
  const previous = {};
  const nodes = new Set();
  
  // Initialize
  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
    nodes.add(node);
  });
  distances[start] = 0;
  
  while (nodes.size > 0) {
    // Find node with smallest distance
    let closestNode = null;
    for (const node of nodes) {
      if (closestNode === null || distances[node] < distances[closestNode]) {
        closestNode = node;
      }
    }
    
    if (distances[closestNode] === Infinity) break;
    
    nodes.delete(closestNode);
    
    // Update neighbors
    for (const neighbor in graph[closestNode]) {
      const alt = distances[closestNode] + graph[closestNode][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = closestNode;
      }
    }
  }
  
  return { distances, previous };
}

function getShortestRoute(driverLocation, pickupPoints, targetPointIndex) {
  const { graph, nodes } = buildGraphWithDriver(driverLocation, pickupPoints);
  const { distances, previous } = dijkstra(graph, 'driver');
  
  const targetNode = `point${targetPointIndex}`;
  const distance = distances[targetNode];
  
  // Build path
  const path = [];
  let current = targetNode;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }
  
  // Convert path to coordinates
  const coordinates = path.map(node => {
    if (node === 'driver') {
      return [driverLocation.lat, driverLocation.lng];
    } else {
      const index = parseInt(node.replace('point', ''));
      return [pickupPoints[index].lat, pickupPoints[index].lng];
    }
  });
  
  return {
    distance: distance.toFixed(2),
    path: coordinates,
    waypoints: path
  };
}

module.exports = {
  calculateDistance,
  buildGraphWithDriver,
  dijkstra,
  getShortestRoute
};