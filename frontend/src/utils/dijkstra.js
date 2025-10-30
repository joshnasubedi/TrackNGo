function buildGraph(school, pickupPoints) {
  const nodes = [school, ...pickupPoints];
  const graph = {};

  for (let i = 0; i < nodes.length; i++) {
    graph[i] = {};
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        const distance = getDistance(
          nodes[i].lat,
          nodes[i].lng,
          nodes[j].lat,
          nodes[j].lng
        );
        graph[i][j] = distance;
      }
    }
  }
  return { graph, nodes };
}

function dijkstra(graph, start, end) {
  const distances = {};
  const visited = {};
  const previous = {};

  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
    previous[node] = null;
  });
  distances[start] = 0;

  while (true) {
    let currentNode = null;
    let minDistance = Infinity;

    for (let node in distances) {
      if (!visited[node] && distances[node] < minDistance) {
        minDistance = distances[node];
        currentNode = node;
      }
    }

    if (currentNode === null || currentNode === end) break;
    visited[currentNode] = true;

    for (let neighbor in graph[currentNode]) {
      const total = distances[currentNode] + graph[currentNode][neighbor];
      if (total < distances[neighbor]) {
        distances[neighbor] = total;
        previous[neighbor] = currentNode;
      }
    }
  }

  const path = [];
  let node = end;
  while (node !== null) {
    path.unshift(node);
    node = previous[node];
  }

  return { path, distance: distances[end] };
}

// Distance formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function findOptimalRoute(school, pickupPoints) {
  const { graph, nodes } = buildGraph(school, pickupPoints);
  const route = [];
  let totalDistance = 0;

  let currentIndex = 0;
  const visited = new Set();
  route.push(nodes[currentIndex]);

  while (visited.size < pickupPoints.length) {
    let nearest = null;
    let minDist = Infinity;
    for (let i = 1; i < nodes.length; i++) {
      if (!visited.has(i) && graph[currentIndex][i] < minDist) {
        nearest = i;
        minDist = graph[currentIndex][i];
      }
    }
    visited.add(nearest);
    route.push(nodes[nearest]);
    totalDistance += minDist;
    currentIndex = nearest;
  }

  totalDistance += graph[currentIndex][0];
  route.push(nodes[0]);

  return { route, totalDistance: totalDistance.toFixed(2) };
}

module.exports = { buildGraph, dijkstra, findOptimalRoute };
