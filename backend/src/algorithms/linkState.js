// backend/src/algorithms/linkState.js
const { dijkstra } = require('./dijkstra');

/**
 * Performs one iterational step of the Link State routing algorithm.
 * Each node exchanges its immediate link states with all neighbors (Flooding phase).
 * Once the link state database (LSDB) is updated, each node runs Dijkstra's algorithm.
 * @param {Graph} graph 
 * @returns {Object} result containing boolean hasChanges and an array of update events
 */
function runLinkStateStep(graph, metric = 'cost') {
  let hasChanges = false;
  const updates = [];
  const nodes = graph.getAllNodes();

  // For this simplified step, we assume nodes have flooded their link states
  // We represent this by building a global LSDB and pushing it to each node,
  // representing what they WOULD know after flooding settles.
  const globalLSDB = {};
  for (const node of nodes) {
    globalLSDB[node.id] = [];
    const neighbors = graph.getNeighbors(node.id);
    for (const neighbor of neighbors) {
      if (neighbor.cost !== Infinity) {
        globalLSDB[node.id].push({ target: neighbor.id, cost: neighbor.cost, delay: neighbor.delay });
      }
    }
  }

  // Update LSDB and run Dijkstra for each node
  for (const node of nodes) {
    // Check if LSDB changed (ignoring sequence numbers for simple sim)
    const oldLSDBstr = JSON.stringify(node.linkStateDB || {});
    const newLSDBstr = JSON.stringify(globalLSDB);

    if (oldLSDBstr !== newLSDBstr) {
       node.linkStateDB = JSON.parse(newLSDBstr);
       // Graph changed according to this node
       const newRoutingTable = dijkstra(globalLSDB, node.id, metric);
       
       const oldTableStr = JSON.stringify(node.routingTable || {});
       const newTableStr = JSON.stringify(newRoutingTable);

       if (oldTableStr !== newTableStr) {
           node.routingTable = newRoutingTable;
           hasChanges = true;
           updates.push({
               type: 'LS_UPDATE',
               nodeId: node.id,
               msg: `Node ${node.id} rebuilt routing table via Dijkstra.`
           });
       }
    }
  }

  const floodingNodes = nodes.map(n => n.id);
  return { hasChanges, updates, animation: { type: 'LS_FLOODING', nodes: floodingNodes } };
}

module.exports = { runLinkStateStep };
