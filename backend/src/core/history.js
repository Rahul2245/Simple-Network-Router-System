class HistoryManager {
  constructor(graph, simulation, io) {
    this.graph = graph;
    this.simulation = simulation;
    this.io = io;
    this.history = [];
    this.historyIndex = -1;
  }

  // Initialize with the starting graph state
  init() {
    this.history = [JSON.parse(JSON.stringify(this.graph.serializeState()))];
    this.historyIndex = 0;
  }

  // Save state AFTER an action
  record() {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    const state = JSON.parse(JSON.stringify(this.graph.serializeState()));
    this.history.push(state);
    if (this.history.length > 50) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this._restore(this.history[this.historyIndex]);
    } else {
      this.io.emit('log', 'No more actions to undo.');
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this._restore(this.history[this.historyIndex]);
    } else {
      this.io.emit('log', 'No more actions to redo.');
    }
  }

  _restore(stateJson) {
    this.graph.nodes.clear();
    this.graph.links.clear();

    stateJson.nodes.forEach(n => {
      this.graph.nodes.set(n.id, n);
    });
    stateJson.links.forEach(l => {
      this.graph.links.set(l.id, l);
    });

    this.simulation.resetRoutingTables();
    this.simulation.broadcastState();
    this.io.emit('log', 'Topology state reverted/restored.');
  }
}

module.exports = HistoryManager;
