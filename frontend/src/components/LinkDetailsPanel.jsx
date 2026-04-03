import React, { useState, useEffect } from 'react';
import { X, Activity, Save, Trash2, PowerOff } from 'lucide-react';

const LinkDetailsPanel = ({ link, onClose, onUpdate, onDelete, onToggleStatus }) => {
  const [cost, setCost] = useState(link.cost);
  const [delay, setDelay] = useState(link.delay || 10);

  useEffect(() => {
    setCost(link.cost);
    setDelay(link.delay || 10);
  }, [link]);

  const handleSave = () => {
    onUpdate(link.source, link.target, parseInt(cost, 10), parseInt(delay, 10));
  };

  return (
    <div className="bg-[#121822]/95 backdrop-blur-md border border-[#00ffa3]/40 rounded-lg w-[300px] shadow-2xl flex flex-col font-sans transition-all duration-300">
      <div className="flex justify-between items-center p-3 border-b border-[#2d333b] bg-[#00ffa3]/5 rounded-t-lg">
        <h3 className="font-bold text-gray-100 flex items-center gap-2 text-sm uppercase tracking-wide">
           <Activity className="w-4 h-4 text-accentGreen" />
           Link: {link.source} <span className="text-gray-500 mx-1">↔</span> {link.target}
        </h3>
        <div className="flex items-center gap-2">
           <button onClick={() => onToggleStatus(link.status === 'down' ? 'active' : 'down')} className={`${link.status === 'down' ? 'text-green-400 hover:text-green-300' : 'text-yellow-500 hover:text-yellow-400'} transition-colors tooltip`} title="Toggle State">
             <PowerOff className="w-4 h-4" />
           </button>
           <button onClick={onDelete} className="text-red-400 hover:text-red-300 transition-colors tooltip" title="Delete Link">
             <Trash2 className="w-4 h-4" />
           </button>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <X className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Base Cost</label>
          <input 
            type="number" 
            min="1" max="999"
            value={cost} 
            onChange={e => setCost(e.target.value)}
            className="w-full bg-[#1e2329] border border-[#30363d] rounded p-2 text-white focus:outline-none focus:border-accentGreen outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Physical Delay (ms)</label>
          <input 
            type="number" 
            min="1" max="9999"
            value={delay} 
            onChange={e => setDelay(e.target.value)}
            className="w-full bg-[#1e2329] border border-[#30363d] rounded p-2 text-white focus:outline-none focus:border-accentGreen outline-none transition-colors"
          />
        </div>
        
        <button 
           onClick={handleSave}
           className="mt-2 w-full bg-accentGreen/10 hover:bg-accentGreen/20 text-accentGreen border border-accentGreen/50 font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" /> Save Attributes
        </button>
      </div>
    </div>
  );
};

export default LinkDetailsPanel;
