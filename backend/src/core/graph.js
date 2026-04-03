// backend/src/core/graph.js
class Graph {
  constructor() {
    this.nodes = new Map();
    // store links with an ID, e.g. "A_B"
    this.links = new Map();
  }

  addNode(id, label, position = { x: 0, y: 0, z: 0 }) {
    this.nodes.set(id, { 
      id, 
      label, 
      position, // Optional position for 3D layout hinted from backend
      routingTable: {}, // { destination: { nextHop, cost } }
      linkStateDB: {} // For LS
    });
    return this;
  }

  addLink(source, target, cost = 1, delay = 10, status = 'active') {
    const id = this._getLinkId(source, target);
    this.links.set(id, { id, source, target, cost, delay, status });
    return this;
  }

  removeNode(id) {
    this.nodes.delete(id);
    // Remove all associated links
    for (const link of this.links.values()) {
      if (link.source === id || link.target === id) {
        this.links.delete(link.id);
      }
    }
  }

  removeLink(source, target) {
    const id = this._getLinkId(source, target);
    this.links.delete(id);
  }

  updateLinkStatus(source, target, status) {
    const id = this._getLinkId(source, target);
    if (this.links.has(id)) {
      this.links.get(id).status = status;
    }
  }

  updateLinkCost(source, target, newCost) {
    const id = this._getLinkId(source, target);
    if (this.links.has(id)) {
      this.links.get(id).cost = newCost;
    }
  }

  getNeighbors(nodeId) {
    const neighbors = [];
    for (const [id, link] of this.links.entries()) {
      if (link.status === 'down') continue; // Broken link

      if (link.source === nodeId) {
        neighbors.push({ id: link.target, cost: link.cost, delay: link.delay });
      } else if (link.target === nodeId) {
        neighbors.push({ id: link.source, cost: link.cost, delay: link.delay });
      }
    }
    return neighbors;
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getAllLinks() {
    return Array.from(this.links.values());
  }

  _getLinkId(source, target) {
    // Ensuring deterministic link ID regardless of direction
    return [source, target].sort().join('-');
  }
  
  resetRoutingTables() {
    for (const [id, node] of this.nodes.entries()) {
      node.routingTable = {};
      node.linkStateDB = {};
      node.routingTable[id] = { nextHop: id, cost: 0 }; // distance to self is 0
    }
  }

  serializeState() {
    return {
      nodes: this.getAllNodes().map(n => ({
        id: n.id,
         label: n.label,
         position: n.position,
         routingTable: n.routingTable
      })),
      links: this.getAllLinks()
    };
  }
}

module.exports = Graph;
