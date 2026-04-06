import React from 'react';
import { MousePointer2, Plus, Link as LinkIcon, Send, X, Shuffle } from 'lucide-react';

const Toolbar = ({ interactionMode, setInteractionMode, sourceNode, destNode, activePacket, onSendPacket, onShuffleLayout, metric, setMetric }) => {
  const modes = [
    { id: 'VIEW', label: 'Inspect', icon: <MousePointer2 className="w-4 h-4" /> },
    { id: 'ADD_NODE', label: 'Add Node', icon: <Plus className="w-4 h-4" /> },
    { id: 'ADD_LINK', label: 'Add Link', icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'SELECT_ROUTE', label: 'Select Route', icon: <Send className="w-4 h-4" /> }
  ];

  return (
    <div className="absolute top-4 right-56 bg-[#121822]/95 backdrop-blur-md border border-[#2d333b] rounded-lg p-2 shadow-xl flex items-center gap-2 pointer-events-auto z-10 w-fit">
      
      <div className="flex gap-1 border-r border-[#2d333b] pr-2">
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => setInteractionMode(mode.id)}
            className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-semibold
              ${interactionMode === mode.id ? 'bg-[#00ffa3]/20 text-accentGreen border border-[#00ffa3]/50' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e2329] border border-transparent'}
            `}
            title={mode.label}
          >
            {mode.icon}
          </button>
        ))}
      </div>

      <button
        onClick={onShuffleLayout}
        className="p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-accentGreen hover:bg-[#00ffa3]/10 border border-transparent hover:border-[#00ffa3]/30"
        title="Shuffle 3D Layout"
      >
        <Shuffle className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[#2d333b]"></div>
      <div className="flex items-center gap-2 text-xs px-2">
  <span className="text-gray-500 uppercase font-bold text-[10px]">Metric</span>
  <select 
    value={metric} 
    onChange={(e) => setMetric(e.target.value)}
    className="bg-[#1e2329] border border-[#30363d] text-white text-xs px-2 py-1 rounded focus:outline-none"
  >
    <option value="cost">Cost</option>
    <option value="delay">Delay</option>
  </select>
</div>

<div className="w-px h-6 bg-[#2d333b]"></div>
      
      {interactionMode === 'SELECT_ROUTE' && (
         <div className="flex items-center gap-3 pl-1 text-xs px-2">
            <div className="flex flex-col">
              <span className="text-gray-500 uppercase font-bold text-[10px]">Source</span>
              <span className={sourceNode ? "text-[#3b82f6] font-mono tracking-widest" : "text-gray-600"}>{sourceNode ? sourceNode.id : 'Click a Node'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 uppercase font-bold text-[10px]">Destination</span>
              <span className={destNode ? "text-[#a855f7] font-mono tracking-widest" : "text-gray-600"}>{destNode ? destNode.id : 'Click a Node'}</span>
            </div>
            
            {(sourceNode && destNode) && !activePacket && (
               <button 
                  onClick={onSendPacket}
                  className="ml-2 bg-[#00ffa3] hover:bg-emerald-400 text-[#090D14] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 shadow-[0_0_10px_#00ffa3]"
               >
                 <Send className="w-3 h-3" /> SEND
               </button>
            )}

            {activePacket && (
                <div className="ml-2 px-3 py-1.5 rounded-md bg-[#f1c40f]/20 text-[#f1c40f] border border-[#f1c40f]/50 font-mono flex items-center gap-2">
                   <span className="animate-pulse w-2 h-2 rounded-full bg-[#f1c40f]"></span> 
                   {activePacket.status === 'routing' ? 'Routing...' : activePacket.status === 'transit' ? 'In Transit' : activePacket.status}
                </div>
            )}
         </div>
      )}
      
    </div>
  );
};

export default Toolbar;
