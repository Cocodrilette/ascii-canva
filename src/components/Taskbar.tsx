import { Terminal, Clock, Activity } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

const Taskbar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 h-12 glass-surface rounded-full z-50 flex items-center px-4 gap-4 shadow-2xl border-white/20">
      <div className="flex items-center gap-3">
        <div className="bg-[#000080] p-1.5 rounded-full shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer">
          <Terminal size={14} className="text-white" />
        </div>
        
        <div className="h-6 w-px bg-zinc-300/50" />
        
        <div className="flex items-center gap-2">
          <div className="bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live Session
          </div>
        </div>
      </div>

      <div className="h-6 w-px bg-zinc-300/50" />

      <div className="flex items-center gap-4 text-zinc-600">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">60 FPS</span>
        </div>
        
        <div className="flex items-center gap-2 bg-white/40 px-3 py-1 rounded-full border border-white/40 shadow-sm">
          <Clock size={12} className="opacity-60" />
          <span className="font-mono text-[11px] font-bold min-w-[45px]">
            {mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
