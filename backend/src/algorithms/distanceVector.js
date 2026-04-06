// backend/src/algorithms/distanceVector.js

function runDistanceVectorStep(graph, metric = 'cost') {
  let hasChanges = false;
  const updates = [];

  const previousTables = new Map();
  const nodes = graph.getAllNodes();

  // ---------- STEP 1: Snapshot ----------
  for (const node of nodes) {
    if (!node.routingTable[node.id]) {
      node.routingTable[node.id] = { nextHop: node.id, cost: 0 };
    }
    previousTables.set(node.id, JSON.parse(JSON.stringify(node.routingTable)));
  }

  // ---------- STEP 2: Process each node ----------
  for (const node of nodes) {
    const neighbors = graph.getNeighbors(node.id);
    const myTable = node.routingTable;

    // ---------- STEP 2A: Validate existing routes ----------
    for (const dest in myTable) {
      if (dest === node.id) continue;

      const nextHop = myTable[dest].nextHop;

      const link = graph.getAllLinks().find(l =>
        (l.source === node.id && l.target === nextHop) ||
        (l.target === node.id && l.source === nextHop)
      );

      if (!link || link.status !== 'active') {
        if (myTable[dest].cost !== Infinity) {
          myTable[dest] = { nextHop: null, cost: Infinity };
          hasChanges = true;

          updates.push({
            type: 'ROUTE_FAILED',
            nodeId: node.id,
            dest,
            msg: `Node ${node.id}: route to ${dest} failed (link down)`
          });
        }
      }
    }

    // ---------- STEP 2B: Process neighbors ----------
    for (const neighbor of neighbors) {
      const neighborId = neighbor.id;

      // 🔥 FIX: get link properly
      const link = graph.getAllLinks().find(l =>
        (l.source === node.id && l.target === neighborId) ||
        (l.target === node.id && l.source === neighborId)
      );

      if (!link || link.status !== 'active') continue;

      // 🔥 FIX: correct metric usage
      const linkCost =
        metric === 'hop' ? 1 :
        metric === 'delay' ? (link.delay || 1) :
        link.cost;

      const neighborTable = previousTables.get(neighborId);
      if (!neighborTable) continue;

      // Ensure direct route to neighbor
      if (!myTable[neighborId] || linkCost < myTable[neighborId].cost) {
        myTable[neighborId] = { nextHop: neighborId, cost: linkCost };
        hasChanges = true;
      }

      // ---------- STEP 2C: Bellman-Ford Relaxation ----------
      for (const dest in neighborTable) {
        const costFromNeighbor = neighborTable[dest].cost;

        if (costFromNeighbor === Infinity) continue;

        // 🔥 Split Horizon
        if (neighborTable[dest].nextHop === node.id) continue;

        const newCost = linkCost + costFromNeighbor;

        if (!myTable[dest] || newCost < myTable[dest].cost) {
          myTable[dest] = {
            nextHop: neighborId,
            cost: newCost
          };

          hasChanges = true;

          updates.push({
            type: 'DV_UPDATE',
            nodeId: node.id,
            dest,
            cost: newCost,
            nextHop: neighborId,
            msg: `Node ${node.id}: route to ${dest} via ${neighborId} (cost: ${newCost})`
          });
        }
      }
    }
  }

  // ---------- STEP 3: Animation ----------
  const animationLinks = [];
  for (const node of nodes) {
    const neighbors = graph.getNeighbors(node.id);
    for (const n of neighbors) {
      animationLinks.push({ source: node.id, target: n.id });
    }
  }

  return {
    hasChanges,
    updates,
    animation: { type: 'DV_EXCHANGE', edges: animationLinks }
  };
}

module.exports = { runDistanceVectorStep };