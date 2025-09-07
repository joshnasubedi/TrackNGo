// graph.js
// Example graph where nodes are labels (A, B, C, D)
// and edges have weights (like distances).

const graph = {
  A: { B: 2, C: 5 },
  B: { A: 2, C: 6, D: 1 },
  C: { A: 5, B: 6, D: 2 },
  D: { B: 1, C: 2 }
};

module.exports = graph;
