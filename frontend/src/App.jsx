import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Scene from './3d/Scene';
import UIControls from './components/UIControls';
import EventLog from './components/EventLog';
import RoutingTablePanel from './components/RoutingTablePanel';
import LinkDetailsPanel from './components/LinkDetailsPanel';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import { Activity } from 'lucide-react';

const socket = io('http://localhost:3000');

function App() {
  const [graphState, setGraphState] = useState({ nodes: [], links: [] });
  const [logs, setLogs] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'

  // Interactive Topology States
  const [interactionMode, setInteractionMode] = useState('VIEW');
  const [sourceNode, setSourceNode] = useState(null);
  const [destNode, setDestNode] = useState(null);
  const [activePacket, setActivePacket] = useState(null);
  const [decisionData, setDecisionData] = useState(null);
  const [algorithmAnimation, setAlgorithmAnimation] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) socket.emit('redo_action');
        else socket.emit('undo_action');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        socket.emit('redo_action');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    socket.on('graph_state', (state) => {
      setGraphState(state);
      // Update selected node's data if it was selected
      if (selectedNode) {
        const updatedNode = state.nodes.find(n => n.id === selectedNode.id);
        if (updatedNode) setSelectedNode(updatedNode);
      }
    });

    socket.on('log', (msg) => {
      setLogs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), msg }]);
    });

    socket.on('packet_init', (pkt) => setActivePacket(pkt));
  
    socket.on('packet_decision', (data) => {
      setActivePacket(data.packet);
      setDecisionData(data);
      
      // Artificial delay to visualize the decision
      setTimeout(() => {
        socket.emit('packet_decision_complete', {
          packetId: data.packet.id,
          nextHop: data.nextHop,
          linkCost: data.linkCost
        });
      }, 1500);
    });
    
    socket.on('packet_transit_start', (pkt) => {
      setActivePacket(pkt);
      setDecisionData(null); // clear decision highlight when it starts moving
    });

    socket.on('packet_reached', (pkt) => {
      setActivePacket(pkt);
      setTimeout(() => setActivePacket(null), 3000); // clear after 3s
    });

    socket.on('packet_dropped', ({ packet }) => {
      setActivePacket(packet);
      setTimeout(() => setActivePacket(null), 3000); // clear after 3s
    });

    socket.on('algorithm_animation', (animData) => {
      setAlgorithmAnimation(animData);
    });

    return () => {
      socket.off('graph_state');
      socket.off('log');
      socket.off('route_update');
      socket.off('packet_init');
      socket.off('packet_decision');
      socket.off('packet_transit_start');
      socket.off('packet_reached');
      socket.off('packet_dropped');
    };
  }, [selectedNode, graphState]);

  const handleAction = (action, payload) => {
    socket.emit(action, payload);
  };

  const handleShuffleLayout = () => {
    const shuffled = graphState.nodes.map(node => ({
      id: node.id,
      position: {
        x: Math.random() * 30 - 15,
        y: Math.random() * 20 - 10,
        z: Math.random() * 30 - 15,
      }
    }));
    socket.emit('shuffle_layout', { nodes: shuffled });
  };

  const handleSendPacket = () => {
    if (sourceNode && destNode) {
       handleAction('start_packet_flow', { source: sourceNode.id, dest: destNode.id });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-darkBg text-white font-sans overflow-hidden">
      <Header />
      
      <main className="flex-1 relative w-full h-full p-4 md:p-6 lg:p-8 pt-0 flex flex-col">
        
        {/* Main Card Container mimicking traceroute-online */}
        <div className="flex-1 w-full bg-[#1e2329] border border-[#2d333b] rounded-xl overflow-hidden shadow-2xl relative flex flex-col">
          
          <div className="h-12 border-b border-[#2d333b] bg-[#161b22] px-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 tracking-wide">
              <Activity className="w-4 h-4 text-accentGreen" /> ROUTE MAP
            </div>
            {/* View Toggle */}
            <div className="flex bg-[#21262d] rounded-md p-1 border border-[#30363d]">
              <button 
                onClick={() => setViewMode('3D')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === '3D' ? 'bg-[#00ffa3]/10 text-accentGreen' : 'text-gray-400 hover:text-gray-200'}`}
              >
                3D GLOBE
              </button>
              <button 
                onClick={() => setViewMode('2D')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === '2D' ? 'bg-[#00ffa3]/10 text-accentGreen' : 'text-gray-400 hover:text-gray-200'}`}
              >
                2D MAP
              </button>
            </div>
          </div>

          <div className="flex-1 relative bg-[#0d1117] w-full h-full">
             <Scene 
                graph={graphState} 
                onSelectNode={(node) => { setSelectedNode(node); setSelectedLink(null); }}
                onSelectLink={(link) => { setSelectedLink(link); setSelectedNode(null); }}
                selectedLink={selectedLink}
                viewMode={viewMode} 
                onAction={handleAction} 
                interactionMode={interactionMode}
                sourceNode={sourceNode}
                destNode={destNode}
                setSourceNode={setSourceNode}
                setDestNode={setDestNode}
                activePacket={activePacket}
                decisionData={decisionData}
                algorithmAnimation={algorithmAnimation}
                onAnimationComplete={() => setAlgorithmAnimation(null)}
             />

             {/* UI Overlays inside the map container */}
             <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-4">
                <UIControls onAction={handleAction} />
             </div>
             
             <Toolbar 
                interactionMode={interactionMode} 
                setInteractionMode={setInteractionMode}
                sourceNode={sourceNode}
                destNode={destNode}
                activePacket={activePacket}
                onSendPacket={handleSendPacket}
                onShuffleLayout={handleShuffleLayout}
             />

             {/* Legend */}
             <div className="absolute top-4 right-4 bg-[#161b22]/90 border border-[#30363d] rounded-lg p-3 text-xs w-48 shadow-lg z-10 pointer-events-auto backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-accentGreen shadow-[0_0_8px_#00ffa3]"></span> Active Node</div>
                <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-statusYellow shadow-[0_0_5px_#f1c40f]"></span> Route Updating</div>
                <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-statusRed"></span> Down / Failed</div>
                <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-gray-600"></span> Active Link</div>
             </div>

             {selectedLink && (
               <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
                 <LinkDetailsPanel 
                   link={selectedLink} 
                   onClose={() => setSelectedLink(null)} 
                   onUpdate={(source, target, cost, delay) => { handleAction('edit_link', { source, target, cost, delay }); setSelectedLink(prev => ({ ...prev, cost, delay })); }}
                   onDelete={() => { handleAction('remove_link', { source: selectedLink.source, target: selectedLink.target }); setSelectedLink(null); }}
                   onToggleStatus={(st) => { handleAction('toggle_link_status', { source: selectedLink.source, target: selectedLink.target, status: st }); setSelectedLink(prev => ({ ...prev, status: st })); }}
                 />
               </div>
             )}
             
             {selectedNode && (
               <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
                 <RoutingTablePanel 
                   node={selectedNode} 
                   onClose={() => setSelectedNode(null)} 
                   onDelete={() => { handleAction('remove_node', { id: selectedNode.id }); setSelectedNode(null); }}
                   decisionData={decisionData && decisionData.decisionNode === selectedNode.id ? decisionData : null} 
                 />
               </div>
             )}
          </div>
        </div>

        {/* Logs Panel - Bottom horizontal split */}
        <div className="mt-4 h-48 bg-[#1e2329] border border-[#2d333b] rounded-xl overflow-hidden shadow-2xl flex flex-col">
           <div className="h-10 border-b border-[#2d333b] bg-[#161b22] px-4 flex items-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
             System Event Log
           </div>
           <div className="flex-1 overflow-auto p-0">
              <EventLog logs={logs} />
           </div>
        </div>
        
      </main>
    </div>
  );
}

export default App;
