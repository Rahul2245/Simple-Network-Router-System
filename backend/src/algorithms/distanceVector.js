// backend/src/algorithms/distanceVector.js

/**
 * Network infinity constant.  Any route cost >= MAX_COST is treated as
 * unreachable.  Using a small finite value (like RIP's 16) prevents the
 * Count-to-Infinity problem from spiralling to JavaScript's Infinity.
 */
const MAX_COST = 16;

/**
 * Build the distance-vector that node `senderId` would advertise to a
 * specific `recipientId`, applying **Poison Reverse**.
 *
 * Rule: if the sender's best path to a destination goes *through* the
 * recipient, the sender reports that destination's cost as MAX_COST
 * (poison) instead of simply omitting it (plain Split Horizon).
 *
 * @param {Object} senderTable  – the routing table of the sending node
 * @param {string} senderId     – the sending node id
 * @param {string} recipientId  – the neighbour that will receive this vector
 * @returns {Object} a filtered/poisoned copy of the sender's routing table
 */
function buildPoisonedVector(senderTable, senderId, recipientId) {
  const advertisedVector = {};

  for (const dest in senderTable) {
    if (dest === senderId) {
      // Always advertise distance-to-self as 0
      advertisedVector[dest] = { nextHop: senderId, cost: 0 };
      continue;
    }

    const entry = senderTable[dest];

    if (entry.nextHop === recipientId) {
      // Poison Reverse: my best route to `dest` goes through the recipient,
      // so I tell them it costs MAX_COST (unreachable) to prevent loops.
      advertisedVector[dest] = { nextHop: entry.nextHop, cost: MAX_COST };
    } else {
      // Normal advertisement – forward as-is (already capped at MAX_COST)
      advertisedVector[dest] = { ...entry };
    }
  }

  return advertisedVector;
}

/**
 * Performs one iterational step of the Distance Vector (Bellman-Ford)
 * routing algorithm with:
 *   1. MAX_COST (network infinity) capping
 *   2. Poison Reverse
 *   3. Triggered Update detection
 *
 * @param {Graph}  graph
 * @param {string} metric – 'cost', 'hop', or 'delay'
 * @returns {Object} { hasChanges, updates, animation, triggeredNodes }
 *   - triggeredNodes: array of node IDs whose tables changed significantly
 *     (callers can use this to fire immediate re-broadcasts)
 */
function runDistanceVectorStep(graph, metric = 'cost') {
  let hasChanges = false;
  const updates = [];
  const triggeredNodes = new Set(); // nodes that need a triggered update

  // --- Snapshot phase --------------------------------------------------
  // Take a deep copy of every routing table so all nodes process the same
  // "previous tick" state (synchronous Bellman-Ford semantics).
  const previousTables = new Map();
  const nodes = graph.getAllNodes();

  for (const node of nodes) {
    // Bootstrap: ensure every node knows the distance to itself
    if (!node.routingTable[node.id]) {
      node.routingTable[node.id] = { nextHop: node.id, cost: 0 };
    }
    previousTables.set(node.id, JSON.parse(JSON.stringify(node.routingTable)));
  }

  // --- Per-node processing ---------------------------------------------
  for (const node of nodes) {
    const neighbors = graph.getNeighbors(node.id);
    const myTable = node.routingTable;

    // ── 1. Detect local link failures ──────────────────────────────────
    for (const dest in myTable) {
      if (dest === node.id) continue;

      const nextHop = myTable[dest].nextHop;
      if (!nextHop) continue;

      // Find the physical link to our next-hop
      const link = graph.getAllLinks().find(l =>
        (l.source === node.id && l.target === nextHop) ||
        (l.target === node.id && l.source === nextHop)
      );

      if (!link || link.status !== 'active') {
        // Link down → mark route unreachable at MAX_COST
        if (myTable[dest].cost < MAX_COST) {
          myTable[dest].cost = MAX_COST;
          hasChanges = true;
          triggeredNodes.add(node.id); // ** Triggered Update **
          updates.push({
            type: 'ROUTE_FAILED',
            nodeId: node.id,
            dest,
            msg: `Node ${node.id} detected link failure to ${nextHop}, route to ${dest} set to MAX_COST (${MAX_COST}).`
          });
        }
      }
    }

    // ── 2. Process each neighbour's (poisoned) distance vector ─────────
    for (const neighbor of neighbors) {
      const neighborId = neighbor.id;
      const linkCost = metric === 'hop' ? 1 : neighbor[metric];
      const neighborRawTable = previousTables.get(neighborId);

      if (!neighborRawTable) continue;

      // Build the vector the neighbour would *actually* send us
      // (with Poison Reverse applied for routes that go through us).
      const neighborVector = buildPoisonedVector(
        neighborRawTable,
        neighborId,
        node.id
      );

      // Ensure we always have a direct-route entry to each neighbour
      if (!myTable[neighborId] || linkCost < myTable[neighborId].cost) {
        myTable[neighborId] = { nextHop: neighborId, cost: linkCost };
        hasChanges = true;
      }

      // Bellman-Ford relaxation over the neighbour's advertised vector
      for (const dest in neighborVector) {
        if (dest === node.id) continue; // skip route to self

        const advertisedCost = neighborVector[dest].cost;

        // If neighbour says dest is unreachable, skip (poisoned or genuinely MAX_COST)
        if (advertisedCost >= MAX_COST) continue;

        let newCost = linkCost + advertisedCost;

        // Cap at MAX_COST to prevent Count-to-Infinity escalation
        if (newCost >= MAX_COST) newCost = MAX_COST;

        if (!myTable[dest]) {
          // Brand-new destination learned from this neighbour
          myTable[dest] = { nextHop: neighborId, cost: newCost };
          hasChanges = true;
          if (newCost < MAX_COST) {
            triggeredNodes.add(node.id);
            updates.push({
              type: 'DV_UPDATE',
              nodeId: node.id,
              dest,
              cost: newCost,
              nextHop: neighborId,
              msg: `Node ${node.id} learned route to ${dest} via ${neighborId} (Cost: ${newCost})`
            });
          }
        } else if (newCost < myTable[dest].cost) {
          // Found a strictly cheaper path
          const oldCost = myTable[dest].cost;
          myTable[dest] = { nextHop: neighborId, cost: newCost };
          hasChanges = true;
          triggeredNodes.add(node.id);
          updates.push({
            type: 'DV_UPDATE',
            nodeId: node.id,
            dest,
            cost: newCost,
            nextHop: neighborId,
            msg: `Node ${node.id} updated route to ${dest} via ${neighborId} (Cost: ${newCost}, was ${oldCost})`
          });
        } else if (myTable[dest].nextHop === neighborId && newCost !== myTable[dest].cost) {
          // Same next-hop but its cost changed (e.g., got worse).
          // We must accept the new cost because we *depend* on this
          // neighbour for this route.
          const oldCost = myTable[dest].cost;
          myTable[dest].cost = newCost;
          hasChanges = true;
          triggeredNodes.add(node.id);
          updates.push({
            type: 'DV_UPDATE',
            nodeId: node.id,
            dest,
            cost: newCost,
            nextHop: neighborId,
            msg: `Node ${node.id} route to ${dest} via ${neighborId} cost changed (${oldCost} → ${newCost})`
          });
        }
      }
    }

    // ── 3. Clamp any residual Infinity values to MAX_COST ─────────────
    for (const dest in myTable) {
      if (myTable[dest].cost === Infinity) {
        myTable[dest].cost = MAX_COST;
        hasChanges = true;
      }
    }
  }

  // --- Build animation payload ------------------------------------------
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
    animation: { type: 'DV_EXCHANGE', edges: animationLinks },
    triggeredNodes: Array.from(triggeredNodes)
  };
}

module.exports = { runDistanceVectorStep, MAX_COST };
