import React from 'react';
import { X, Network, Database, Trash2 } from 'lucide-react';

const RoutingTablePanel = ({ node, onClose, onDelete, decisionData }) => {

  const tableEntries = Object.entries(node.routingTable || {}).map(([dest, info]) => ({
    dest, 
    ...info
  })).sort((a,b) => a.dest.localeCompare(b.dest));
  
  const hasLSDB = node.linkStateDB && Object.keys(node.linkStateDB).length > 0;

  return (
    <div className="bg-[#121822]/95 backdrop-blur-md border border-[#00ffa3]/40 rounded-lg w-[320px] shadow-2xl flex flex-col font-sans transition-all duration-300">
      <div className="flex justify-between items-center p-3 border-b border-[#2d333b] bg-[#00ffa3]/5 rounded-t-lg">
        <h3 className="font-bold text-gray-100 flex items-center gap-2">
           <Network className="w-4 h-4 text-accentGreen" />
           {node.label || node.id}
        </h3>
        <div className="flex items-center gap-2">
           {onDelete && (
             <button onClick={onDelete} className="text-red-400 hover:text-red-300 transition-colors tooltip" title="Delete Router">
               <Trash2 className="w-4 h-4" />
             </button>
           )}
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <X className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs uppercase font-bold text-gray-500 mb-2 py-1 tracking-wider border-b border-[#2d333b]">
           Routing Table
        </div>
        <div className="max-h-48 overflow-y-auto mb-3">
           {tableEntries.length > 0 ? (
             <table className="w-full text-left text-sm text-gray-300">
               <thead>
                 <tr className="text-xs text-gray-500">
                   <th className="pb-1 font-medium">Dest</th>
                   <th className="pb-1 font-medium">Next Hop</th>
                   <th className="pb-1 font-medium text-right">Cost</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#2d333b]/50">
                 {tableEntries.map((row) => {
                   const isDeciding = decisionData && decisionData.packet.dest === row.dest;

                   return (
                   <tr key={row.dest} className={`transition-colors ${isDeciding ? 'bg-[#f1c40f]/20 border border-[#f1c40f] shadow-[inset_0_0_10px_#f1c40f]' : 'hover:bg-white/5'}`}>
                     <td className={`py-1.5 font-semibold ${isDeciding ? 'text-[#f1c40f]' : 'text-gray-200'}`}>{row.dest}</td>
                     <td className={`py-1.5 font-mono ${isDeciding ? 'text-[#f1c40f] font-bold animate-pulse' : 'text-accentGreen/80'}`}>{row.nextHop}</td>
                     <td className={`py-1.5 text-right font-mono ${isDeciding ? 'text-white' : ''}`}>
                        {row.cost === null ? '∞' : (row.cost > 9999 ? '∞' : row.cost)}
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
           ) : (
             <div className="text-center py-4 text-xs text-gray-500 italic">Table empty</div>
           )}
        </div>

        {hasLSDB && (
           <>
              <div className="text-xs uppercase font-bold text-gray-500 mb-2 py-1 tracking-wider border-b border-[#2d333b] flex items-center gap-1">
                 <Database className="w-3 h-3" /> Link State DB
              </div>
              <div className="max-h-32 overflow-y-auto">
                 <pre className="text-[10px] text-gray-400 font-mono bg-black/30 p-2 rounded relative">
                   {JSON.stringify(node.linkStateDB, null, 2)}
                 </pre>
              </div>
           </>
        )}
      </div>
    </div>
  );
};

export default RoutingTablePanel;
