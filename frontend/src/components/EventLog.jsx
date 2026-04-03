import React, { useEffect, useRef } from 'react';

const EventLog = ({ logs }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef} 
      className="p-3 font-mono text-xs text-gray-400 leading-relaxed overflow-y-auto h-full"
    >
      {logs.length === 0 ? (
        <span className="opacity-50 italic">Waiting for simulation events...</span>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="mb-1 border-b border-[#2d333b]/50 pb-1">
            <span className="text-[#00ffa3] opacity-80 mr-2">
              [{new Date().toLocaleTimeString('en-US', { hour12: false })}]
            </span>
            <span className={log.msg.includes('down') || log.msg.includes('fail') ? 'text-statusRed font-bold whitespace-pre-wrap' : 'whitespace-pre-wrap text-gray-300'}>
              {log.msg}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default EventLog;
