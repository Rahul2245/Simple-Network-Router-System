// backend/src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const Graph = require('./core/graph');
const Simulation = require('./core/simulation');
const HistoryManager = require('./core/history')

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup Default Topology
const graph = new Graph();
graph.addNode('R1', 'Router 1', { x: -10, y: 0, z: -5 });
graph.addNode('R2', 'Router 2', { x: -5, y: 2, z: 5 });
graph.addNode('R3', 'Router 3', { x: 0, y: -2, z: 0 });
graph.addNode('R4', 'Router 4', { x: 5, y: 2, z: 5 });
graph.addNode('R5', 'Router 5', { x: 10, y: 0, z: -5 });

graph.addLink('R1', 'R2', 2);
graph.addLink('R1', 'R3', 5);
graph.addLink('R2', 'R3', 1);
graph.addLink('R2', 'R4', 4);
graph.addLink('R3', 'R4', 3);
graph.addLink('R4', 'R5', 2);
graph.addLink('R3', 'R5', 8);

graph.resetRoutingTables();

const simulation = new Simulation(graph, io);
const history = new HistoryManager(graph, simulation, io);
history.init();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state
  socket.emit('graph_state', graph.serializeState());

  socket.on('set_algorithm', (algo) => {
    simulation.setAlgorithm(algo);
  });

  socket.on('set_metric', (metric) => {
    simulation.setMetric(metric);
  });

  socket.on('start_simulation', () => {
    simulation.start();
  });

  socket.on('pause_simulation', () => {
    simulation.pause();
  });

  socket.on('step_simulation', () => {
    simulation.tick(); // Wait, tick scheduled via Timer inside start(), but we might want manual step.
    // Hack: manual tick
    let res = null;
    if (simulation.algorithm === 'distanceVector') {
      const { runDistanceVectorStep } = require('./algorithms/distanceVector');
      res = runDistanceVectorStep(simulation.graph, simulation.metric);
    } else {
      const { runLinkStateStep } = require('./algorithms/linkState');
      res = runLinkStateStep(simulation.graph, simulation.metric);
    }
    
    if (res.hasChanges) {
      simulation.broadcastState();
      res.updates.forEach(u => {
        io.emit('route_update', u);
        if (u.msg) io.emit('log', u.msg);
      });
    } else {
      io.emit('log', 'Network is stable. No routing updates.');
    }
  });

  socket.on('reset_simulation', () => {
    simulation.pause();
    simulation.resetRoutingTables();
    io.emit('log', 'Routing tables reset.');
  });

  socket.on('toggle_link_status', ({ source, target, status }) => {
    graph.updateLinkStatus(source, target, status);
    // simulation.handleTopologyChange(`Link ${source}-${target} is now ${status}`);
    io.emit('log', `Link ${source}-${target} is now ${status}`);
    simulation.broadcastState();
    
    // In distance vector, node detects physical link down immediately. But algorithm logic processes it.
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // --- TOPOLOGY EDITING ---
  socket.on('add_node', ({ id, label, position }) => {
    graph.addNode(id, label, position);
    simulation.resetRoutingTables();
    history.record();
    io.emit('log', `Node ${id} added.`);
    simulation.broadcastState();
  });

  socket.on('remove_node', ({ id }) => {
    graph.removeNode(id);
    simulation.resetRoutingTables();
    history.record();
    io.emit('log', `Node ${id} removed.`);
    simulation.broadcastState();
  });

  socket.on('add_link', ({ source, target, cost, delay }) => {
    graph.addLink(source, target, cost, delay, 'active');
    simulation.resetRoutingTables();
    history.record();
    io.emit('log', `Link added between ${source} and ${target} (cost: ${cost}).`);
    simulation.broadcastState();
  });

  socket.on('remove_link', ({ source, target }) => {
    graph.removeLink(source, target);
    simulation.resetRoutingTables();
    history.record();
    io.emit('log', `Link removed between ${source} and ${target}.`);
    simulation.broadcastState();
  });
  
  socket.on('edit_link', ({ source, target, cost, delay }) => {
    graph.updateLinkCost(source, target, cost);
    if (delay !== undefined) {
      const linkId = graph._getLinkId(source, target);
      if (graph.links.has(linkId)) graph.links.get(linkId).delay = delay;
    }
    simulation.resetRoutingTables();
    history.record();
    io.emit('log', `Link modified: ${source}-${target}.`);
    simulation.broadcastState();
  });

  socket.on('undo_action', () => {
    history.undo();
  });

  socket.on('redo_action', () => {
    history.redo();
  });

  socket.on('shuffle_layout', ({ nodes: shuffledNodes }) => {
    shuffledNodes.forEach(({ id, position }) => {
      const node = graph.nodes.get(id);
      if (node) {
        node.position = position;
      }
    });
    history.record();
    io.emit('log', 'Layout shuffled to 3D positions.');
    simulation.broadcastState();
  });
  
  // --- PACKET FLOW ---
  socket.on('start_packet_flow', ({ source, dest }) => {
    const packetId = `pkt_${Date.now()}`;
    simulation.startPacketFlow(packetId, source, dest);
  });

  socket.on('packet_decision_complete', ({ packetId, nextHop, linkCost }) => {
    simulation.executePacketDecision(packetId, nextHop, linkCost);
  });

  socket.on('packet_animation_complete', ({ packetId }) => {
    simulation.completePacketTransit(packetId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Simulation backend running on http://localhost:${PORT}`);
});
