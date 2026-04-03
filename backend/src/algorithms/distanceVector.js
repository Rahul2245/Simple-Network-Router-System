// backend/src/algorithms/distanceVector.js

/**
 * Performs one iterational step of the Distance Vector (Bellman-Ford) routing algorithm.
 * Each node exchanges its routing table with its immediate neighbors.
 * @param {Graph} graph 
 * @returns {Object} result containing boolean hasChanges and an array of update events
 */
function runDistanceVectorStep(graph, metric = 'cost') {
  let hasChanges = false;
  const updates = [];
  
  // Snapshots to ensure simultaneous updates (preventing chaotic propagation in single tick)
  const previousTables = new Map();
  const nodes = graph.getAllNodes();

  for (const node of nodes) {
    // If table is empty, initialize self
    if (!node.routingTable[node.id]) {
      node.routingTable[node.id] = { nextHop: node.id, cost: 0 };
    }
    previousTables.set(node.id, JSON.parse(JSON.stringify(node.routingTable)));
  }

  for (const node of nodes) {
    const neighbors = graph.getNeighbors(node.id);
    const myTable = node.routingTable;
    
    // Validate current routes: if a neighbor is down, cost = Infinity
    for (const dest in myTable) {
      if (dest === node.id) continue;
      const nextHop = myTable[dest].nextHop;
      if (nextHop) {
        // Find link to nextHop
        const link = graph.getAllLinks().find(l => 
          (l.source === node.id && l.target === nextHop) || 
          (l.target === node.id && l.source === nextHop)
        );
        
        if (!link || link.status !== 'active') {
           // Link is down
           if (myTable[dest].cost !== Infinity) {
             myTable[dest].cost = Infinity;
             hasChanges = true;
             updates.push({
               type: 'ROUTE_FAILED',
               nodeId: node.id,
               dest: dest,
               msg: `Node ${node.id} detected link fail to ${nextHop}, route to ${dest} is unreachable.`
             });
           }
        } else if (link.cost !== myTable[nextHop]?.cost) {
            // Direct link cost changed (but maybe another path is better, we'll let BF sort it out)
        }
      }
    }

    // Process neighbor table DVs
    for (const neighbor of neighbors) {
      const neighborId = neighbor.id;
      const linkCost = metric === 'hop' ? 1 : neighbor[metric];
      const neighborTable = previousTables.get(neighborId);
      
      if (!neighborTable) continue;

      // Ensure we have a direct route to neighbor
      if (!myTable[neighborId] || linkCost < myTable[neighborId].cost) {
         myTable[neighborId] = { nextHop: neighborId, cost: linkCost };
         hasChanges = true;
      }

      for (const dest in neighborTable) {
        const costFromNeighbor = neighborTable[dest].cost;
        if (costFromNeighbor === Infinity) continue;

        // Split horizon with poisoned reverse
        if (neighborTable[dest].nextHop === node.id) {
          continue; // The neighbor routes through ME to get to dest. I shouldn't use its cost to dest.
        }

        const newCost = linkCost + costFromNeighbor;
        
        // Bellman Ford relaxation
        if (!myTable[dest] || newCost < myTable[dest].cost) {
          myTable[dest] = { nextHop: neighborId, cost: newCost };
          hasChanges = true;
          updates.push({
            type: 'DV_UPDATE',
            nodeId: node.id,
            dest: dest,
            cost: newCost,
            nextHop: neighborId,
            msg: `Node ${node.id} updated route to ${dest} via ${neighborId} (Cost: ${newCost})`
          });
        }
      }
    }
  }

  const animationLinks = [];
  for (const node of nodes) {
    const neighbors = graph.getNeighbors(node.id);
    for (const n of neighbors) {
       animationLinks.push({ source: node.id, target: n.id });
    }
  }

  return { hasChanges, updates, animation: { type: 'DV_EXCHANGE', edges: animationLinks } };
}

module.exports = { runDistanceVectorStep };
