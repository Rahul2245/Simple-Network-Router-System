import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Layers } from 'lucide-react';

const UIControls = ({ onAction }) => {
  const [algo, setAlgo] = useState('distanceVector');
  const [metric, setMetric] = useState('cost');
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => {
    
    
    onAction('start_simulation');
    setIsRunning(true);
  };
  
  const handlePause = () => {
    onAction('pause_simulation');
    setIsRunning(false);
  };

  const handleStep = () => {
    onAction('step_simulation');
  };

const handleReset = () => {
  onAction('reset_simulation');
 
   setTimeout(() => {
     onAction('pause_simulation');
     setIsRunning(false);
  }, 2000);

  setTimeout(() => {
    onAction('start_simulation');
    setIsRunning(true);
    
  }, 2000);
};

  const handleAlgoChange = (e) => {
    const val = e.target.value;
    setAlgo(val);
    onAction('set_algorithm', val);
  };

  const handleMetricChange = (e) => {
    const val = e.target.value;
    setMetric(val);
    onAction('set_metric', val);
  };

  return (
    <div className="bg-[#121822]/95 backdrop-blur-md border border-[#2d333b] rounded-lg p-4 shadow-xl text-sm flex flex-col gap-4 pointer-events-auto">
      
       <div className="flex flex-col gap-1">
         <label className="text-gray-400 font-semibold tracking-wider text-xs uppercase flex items-center gap-2">
            <Layers className="w-3 h-3" /> Algorithm
         </label>
         <select 
           value={algo}
           onChange={handleAlgoChange}
           className="w-full bg-[#1e2329] border border-[#30363d] rounded p-2 text-white focus:outline-none focus:border-accentGreen outline-none transition-colors"
         >
           <option value="distanceVector">Distance Vector (Bellman-Ford)</option>
           <option value="linkState">Link State (Flooding + Dijkstra)</option>
           <option value="dijkstra">Pure Dijkstra (Single Source)</option>
         </select>
       </div>

       <div className="flex flex-col gap-1 mt-2">
         <label className="text-gray-400 font-semibold tracking-wider text-xs uppercase flex items-center gap-2">
            Target Metric
         </label>
         <select 
           value={metric}
           onChange={handleMetricChange}
           className="w-full bg-[#1e2329] border border-[#30363d] rounded p-2 text-white focus:outline-none focus:border-accentGreen outline-none transition-colors"
         >
           <option value="cost">Cumulative Cost</option>
           <option value="hop">Hop Count</option>
           <option value="delay">Physical Delay</option>
         </select>
       </div>

      <div className="flex flex-col gap-2 border-t border-[#2d333b] pt-3">
         <div className="grid grid-cols-2 gap-2">
           {!isRunning ? (
              <button 
                onClick={handleStart} 
                className="col-span-1 bg-statusGreen hover:bg-emerald-500 text-darkBg font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <Play className="w-4 h-4" /> Start
              </button>
           ) : (
              <button 
                onClick={handlePause} 
                className="col-span-1 bg-statusYellow hover:bg-yellow-400 text-darkBg font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
           )}
           <button 
             onClick={handleReset} 
             className="col-span-1 bg-[#252b33] hover:bg-[#2d333b] border border-[#3a4149] text-white py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
           >
             <RefreshCw className="w-4 h-4" /> Reset
           </button>
         </div>
         <button 
            onClick={handleStep} 
            className="w-full bg-[#1e2329] hover:bg-accentGreen/20 hover:text-accentGreen hover:border-accentGreen/50 border border-[#2d333b] text-gray-300 font-medium py-2 rounded transition-colors tracking-wide"
            title="Execute one step instantly"
          >
            STEP ALGORITHM
          </button>
      </div>
    </div>
  );
};

export default UIControls;
