// backend/src/core/simulation.js
const { runDistanceVectorStep } = require('../algorithms/distanceVector');
const { runLinkStateStep } = require('../algorithms/linkState');

class Simulation {
  constructor(graph, io) {
    this.graph = graph;
    this.io = io;
    this.algorithm = 'distanceVector'; // default
    this.metric = 'cost'; // cost, hop, delay
    this.isRunning = false;
    this.timer = null;
    this.tickRate = 100; // ms
    this.activePackets = new Map();
  }

  startPacketFlow(packetId, sourceId, destId) {
    const node = this.graph.nodes.get(sourceId);
    if (!node) return;

    const packet = {
      id: packetId,
      source: sourceId,
      dest: destId,
      currentNode: sourceId,
      path: [sourceId],
      ttl: 15, // max bounds to prevent infinite loop
      status: 'routing', // 'routing', 'transit', 'reached', 'dropped'
      totalCost: 0
    };

    this.activePackets.set(packetId, packet);
    this.io.emit('packet_init', packet);
    this.io.emit('log', `Packet ${packetId} originated at Node ${sourceId} destined for ${destId}.`);

    // We immediately trigger the first routing decision visibly
    this.processPacketStep(packetId);
  }

  processPacketStep(packetId) {
    const packet = this.activePackets.get(packetId);
    if (!packet || packet.status !== 'routing') return;

    if (packet.ttl <= 0) {
      packet.status = 'dropped';
      this.io.emit('packet_dropped', { packet, reason: 'TTL expired. Possible routing loop.' });
      this.io.emit('log', `Packet ${packetId} dropped! TTL Expired.`);
      this.activePackets.delete(packetId);
      return;
    }

    if (packet.currentNode === packet.dest) {
      packet.status = 'reached';
      this.io.emit('packet_reached', packet);
      this.io.emit('log', `Packet ${packetId} successfully reached destination ${packet.dest}! Total Cost: ${packet.totalCost}`);
      this.activePackets.delete(packetId);
      return;
    }

    const node = this.graph.nodes.get(packet.currentNode);
    if (!node) return;

    // Use routing table to find next hop
    const routingEntry = node.routingTable[packet.dest];

    if (!routingEntry || !routingEntry.nextHop || routingEntry.cost === Infinity) {
      packet.status = 'dropped';
      this.io.emit('packet_dropped', { packet, reason: 'No route to destination.' });
      this.io.emit('log', `Packet ${packetId} dropped at ${packet.currentNode}! No route to ${packet.dest}.`);
      this.activePackets.delete(packetId);
      return;
    }

    const nextHopId = routingEntry.nextHop;
    const link = this.graph.getAllLinks().find(l =>
      (l.source === packet.currentNode && l.target === nextHopId) ||
      (l.target === packet.currentNode && l.source === nextHopId)
    );

    if (!link || link.status === 'down') {
      packet.status = 'dropped';
      this.io.emit('packet_dropped', { packet, reason: 'Link to next hop is down.' });
      this.io.emit('log', `Packet ${packetId} dropped at ${packet.currentNode}! Link to ${nextHopId} is down.`);
      this.activePackets.delete(packetId);
      return;
    }

    // Emit decision so frontend can highlight it and pause
    this.io.emit('packet_decision', {
      packet,
      decisionNode: packet.currentNode,
      nextHop: nextHopId,
      linkCost: link.cost,
      logic: `Lookup table for ${packet.dest} -> Next Hop: ${nextHopId}`
    });

    // Keep packet in routing state. 
    // Wait for the frontend to acknowledge the decision to start the transit.
  }

  // Called by frontend after visual decision timer completes
  executePacketDecision(packetId, nextHopId, linkCost) {
    const packet = this.activePackets.get(packetId);
    if (!packet || packet.status !== 'routing') return;

    packet.currentNode = nextHopId;
    packet.path.push(nextHopId);
    packet.ttl -= 1;
    packet.totalCost += linkCost;
    packet.status = 'transit';

    // Emit transit start for the animator
    this.io.emit('packet_transit_start', packet);
  }

  // Called by frontend after an animation finishes
  completePacketTransit(packetId) {
    const packet = this.activePackets.get(packetId);
    if (!packet) return;

    packet.status = 'routing';
    this.processPacketStep(packetId);
  }

  setAlgorithm(algo) {
    if (['distanceVector', 'linkState', 'dijkstra'].includes(algo)) {
      this.algorithm = algo;
      this.resetRoutingTables();
      this.broadcastState();
      this.io.emit('log', `Algorithm changed to ${algo}`);
    }
  }

  setMetric(m) {
    if (['cost', 'hop', 'delay'].includes(m)) {
      this.metric = m;
      this.resetRoutingTables();
      this.broadcastState();
      this.io.emit('log', `Metric changed to ${m}`);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
    this.io.emit('log', 'Simulation started.');
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
    this.io.emit('log', 'Simulation paused.');
  }

  resetRoutingTables() {
    this.graph.resetRoutingTables();
    this.broadcastState();
  }

  tick() {
    if (!this.isRunning) return;

    let result = { hasChanges: false, updates: [] };

    switch (this.algorithm) {
      case 'distanceVector':
        result = runDistanceVectorStep(this.graph, this.metric);
        break;
      case 'linkState':
        result = runLinkStateStep(this.graph, this.metric);
        break;
      case 'dijkstra':
        // Dijkstra is typically Link State internally without the flooding step separated
        result = runLinkStateStep(this.graph, this.metric);
        break;
    }

    if (result.hasChanges || result.animation) {
      if (result.animation) {
        this.io.emit('algorithm_animation', result.animation);
      }

      if (result.hasChanges) {
        setTimeout(() => {
          this.broadcastState();
          result.updates.forEach(update => {
            this.io.emit('route_update', update);
            if (update.msg) this.io.emit('log', update.msg);
          });
        }, 1500); // Wait for frontend visual flooding/exchange to finish
      }
    }

    // Schedule next tick
    this.timer = setTimeout(() => this.tick(), this.tickRate);
  }

  broadcastState() {
    this.io.emit('graph_state', this.graph.serializeState());
  }

  // Handle a direct route recalculation after an event
  handleTopologyChange(eventMsg) {
    this.io.emit('log', eventMsg);
    // Don't instantly broadcast state if we are going to calculate right now.
    if (!this.isRunning) {
      const res = this.algorithm === 'distanceVector' ?
        runDistanceVectorStep(this.graph, this.metric) : runLinkStateStep(this.graph, this.metric);

      if (res.animation) {
        this.io.emit('algorithm_animation', res.animation);
      }

      setTimeout(() => {
        this.broadcastState();
        if (res.hasChanges) {
          res.updates.forEach(update => {
            this.io.emit('route_update', update);
          });
        }
      }, 1500);
    } else {
      this.broadcastState();
    }
  }
}

module.exports = Simulation;
