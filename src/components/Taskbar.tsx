import { Terminal } from "lucide-react";
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
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-(--os-bg) border-t-2 border-(--os-border-light) z-50 flex items-center px-1 justify-between shadow-[0_-2px_0_#808080]">
      <div className="flex items-center gap-1 h-full">
        <button
          type="button"
          className="retro-button h-6 px-2 flex items-center gap-1 font-bold text-xs shadow-[1px_1px_0_#000]"
        >
          <div className="bg-[#000080] p-0.5">
            <Terminal size={10} className="text-white" />
          </div>
          Start
        </button>
        <div className="w-[1px] h-5 bg-gray-400 mx-1 border-r border-white" />
        <div className="flex items-center gap-2 px-2 overflow-hidden max-w-[200px]">
          <div className="window-sunken px-2 py-0.5 text-[10px] bg-white/50 truncate">
            ascii_canva.exe
          </div>
        </div>
      </div>

      <div className="window-sunken px-2 h-6 flex items-center gap-2 bg-[#C0C0C0] border-t-2 border-l-2 border-[#808080] border-r-2 border-b-2 border-[#FFF] shadow-inner">
        <div className="flex items-center gap-1 opacity-70">
           {/* System Icons could go here */}
        </div>
        <span className="font-mono text-[10px] font-bold min-w-[45px] text-right">
          {mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
        </span>
      </div>
    </div>
  );
};

export default Taskbar;
