// backend/src/algorithms/dijkstra.js

/**
 * Runs Dijkstra's algorithm from a source node to all other nodes.
 * Used primarily by the Link State routing algorithm.
 * @param {Map} graph - An adjacency list representation { nodeId: [{target, cost}] }
 * @param {string} sourceId - The source node
 * @returns {Object} routing table { destination: { cost, nextHop } }
 */
function dijkstra(graph, sourceId, metric = 'cost') {
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(graph));
  
  // Initialize
  for (const node of unvisited) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[sourceId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current = null;
    let minDistance = Infinity;
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (current === null || distances[current] === Infinity) {
      break; // Unreachable nodes
    }

    unvisited.delete(current);

    // Update neighbors
    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.target)) continue;

      const edgeCost = metric === 'hop' ? 1 : neighbor[metric] || neighbor.cost; // fallback to cost if undefined
      const altDistance = distances[current] + edgeCost;
      if (altDistance < distances[neighbor.target]) {
        distances[neighbor.target] = altDistance;
        previous[neighbor.target] = current;
      }
    }
  }

  // Build routing table by tracing paths
  const routingTable = {};
  for (const dest of Object.keys(graph)) {
    if (dest === sourceId) {
      routingTable[dest] = { cost: 0, nextHop: sourceId };
      continue;
    }
    if (distances[dest] === Infinity) continue;

    let nextHop = dest;
    let curr = dest;
    while (previous[curr] !== sourceId && previous[curr] !== null) {
      curr = previous[curr];
      nextHop = curr;
    }
    
    routingTable[dest] = { cost: distances[dest], nextHop: nextHop };
  }

  return routingTable;
}

module.exports = { dijkstra };
