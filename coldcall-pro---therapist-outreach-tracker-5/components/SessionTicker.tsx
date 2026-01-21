
import React, { useState, useEffect } from 'react';

interface SessionTickerProps {
  sessionCalls: number;
  sessionStartTime: number;
  goal?: number;
}

const SessionTicker: React.FC<SessionTickerProps> = ({ sessionCalls, sessionStartTime, goal = 50 }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000); // Update pace every 10s
    return () => clearInterval(timer);
  }, []);

  const elapsedMinutes = (now - sessionStartTime) / 60000;
  const pace = elapsedMinutes > 1 ? Math.round((sessionCalls / elapsedMinutes) * 60) : 0;
  const progress = Math.min(Math.round((sessionCalls / goal) * 100), 100);

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between shadow-inner">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sprint Session</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white">{sessionCalls}</span>
            <span className="text-slate-600 text-[10px] font-bold">/ {goal}</span>
          </div>
        </div>
        
        <div className="hidden sm:flex flex-col border-l border-slate-800 pl-4">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Current Pace</span>
          <span className="text-xs font-black text-indigo-400">{pace} calls/hr</span>
        </div>
      </div>

      <div className="flex-1 max-w-[150px] mx-4 hidden xs:block">
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
        <span className="text-xs font-black text-emerald-400">{progress}%</span>
      </div>
    </div>
  );
};

export default SessionTicker;
