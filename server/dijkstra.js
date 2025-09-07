// dijkstra.js
// Graph format: { nodeId: { neighborId: weight, ... }, ... }

function dijkstra(graph, start, end) {
  const distances = {};
  const previous = {};
  const visited = new Set();

  // init
  for (const node of Object.keys(graph)) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[start] = 0;

  const pq = new MinHeap((a, b) => a.dist - b.dist);
  pq.push({ node: start, dist: 0 });

  while (!pq.isEmpty()) {
    const { node: u, dist } = pq.pop();
    if (visited.has(u)) continue;
    visited.add(u);

    if (u === end) break; // found best path to end

    const neighbors = graph[u] || {};
    for (const [v, w] of Object.entries(neighbors)) {
      const alt = dist + w;
      if (alt < distances[v]) {
        distances[v] = alt;
        previous[v] = u;
        pq.push({ node: v, dist: alt });
      }
    }
  }

  // rebuild path
  const path = [];
  let cur = end;
  if (previous[cur] !== null || cur === start) {
    while (cur) {
      path.unshift(cur);
      cur = previous[cur];
    }
  }

  return { distance: distances[end], path };
}

// Minimal binary min-heap (priority queue)
class MinHeap {
  constructor(compare) {
    this.arr = [];
    this.cmp = compare;
  }
  isEmpty() { return this.arr.length === 0; }
  push(x) {
    this.arr.push(x);
    this._up(this.arr.length - 1);
  }
  pop() {
    if (this.arr.length === 0) return undefined;
    const top = this.arr[0];
    const last = this.arr.pop();
    if (this.arr.length > 0) {
      this.arr[0] = last;
      this._down(0);
    }
    return top;
  }
  _up(i) {
    const a = this.arr, cmp = this.cmp;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (cmp(a[i], a[p]) < 0) {
        [a[i], a[p]] = [a[p], a[i]];
        i = p;
      } else break;
    }
  }
  _down(i) {
    const a = this.arr, cmp = this.cmp, n = a.length;
    while (true) {
      let l = i * 2 + 1, r = l + 1, m = i;
      if (l < n && cmp(a[l], a[m]) < 0) m = l;
      if (r < n && cmp(a[r], a[m]) < 0) m = r;
      if (m === i) break;
      [a[i], a[m]] = [a[m], a[i]];
      i = m;
    }
  }
}

module.exports = dijkstra;
