import { Terminal, Send, X, Loader2, Info } from "lucide-react";
import type React from "react";
import { useState, useRef, useEffect } from "react";

interface AiChatProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  onNewElement: (element: any) => void;
  apiKey: string | null;
  elements: any[];
}

const AiChat: React.FC<AiChatProps> = ({ isOpen, onClose, spaceId, onNewElement, apiKey, elements }) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{ type: 'sys' | 'user' | 'ai' | 'err', text: string }[]>([
    { type: 'sys', text: "GEMINI_AI_AGENT v1.0.0 (CONNECTED)" },
    { type: 'sys', text: "TYPE YOUR DIAGRAM REQUEST BELOW..." }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const geminiKey = localStorage.getItem("GEMINI_API_KEY");
    if (!geminiKey) {
      setLogs(prev => [...prev, { type: 'err', text: "ERROR: MISSING GEMINI_API_KEY. CHECK SETTINGS." }]);
      return;
    }

    if (!spaceId) {
      setLogs(prev => [...prev, { type: 'err', text: "ERROR: AI ASSISTANT REQUIRES A SAVED SPACE." }]);
      setLogs(prev => [...prev, { type: 'sys', text: "HINT: CLICK 'COLLABORATE' TO HOST AND SAVE THIS SPACE." }]);
      return;
    }

    if (!apiKey) {
      setLogs(prev => [...prev, { type: 'err', text: "ERROR: NO ASCII_CANVA API KEY DETECTED." }]);
      return;
    }

    const currentPrompt = prompt;
    setPrompt("");
    setLoading(true);
    setLogs(prev => [...prev, { type: 'user', text: `> ${currentPrompt}` }]);

    try {
      // 1. Get drawing instructions from AI
      const aiRes = await fetch("/api/ai/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: currentPrompt, 
          geminiKey,
          currentElements: elements.map(el => ({
            type: el.type,
            x: el.x,
            y: el.y,
            params: {
              width: el.width,
              height: el.height,
              text: el.text,
              x2: el.x2,
              y2: el.y2
            }
          }))
        })
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "AI FAILED TO RESPOND");

      setLogs(prev => [...prev, { type: 'sys', text: `EXECUTING ${aiData.elements.length} COMMANDS...` }]);

      // 2. Execute each command via the Elements API
      for (const element of aiData.elements) {
        const drawRes = await fetch(`/api/spaces/${spaceId}/elements`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify(element)
        });

        const drawData = await drawRes.json();
        if (drawRes.ok) {
          onNewElement(drawData.element);
          setLogs(prev => [...prev, { type: 'ai', text: `+ DRAWN: ${element.type} at ${element.x},${element.y}` }]);
        } else {
          setLogs(prev => [...prev, { type: 'err', text: `! FAILED: ${element.type} - ${drawData.error}` }]);
        }
      }

      setLogs(prev => [...prev, { type: 'sys', text: "BATCH OPERATION COMPLETE." }]);

    } catch (error: any) {
      setLogs(prev => [...prev, { type: 'err', text: `FATAL: ${error.message.toUpperCase()}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-10 right-4 z-[100] w-[350px] window-raised shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
      {/* Title Bar */}
      <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between font-['VT323'] text-sm">
        <div className="flex items-center gap-2">
          <Terminal size={14} />
          <span>TERMINAL.EXE - AI_AGENT</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-4 h-4 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] flex items-center justify-center text-black active:border-inset p-0"
        >
          <X size={10} />
        </button>
      </div>

      {/* Terminal Area */}
      <div className="bg-[#0D0D0D] text-[#00FF41] p-3 h-[300px] overflow-y-auto font-mono text-[11px] space-y-1" ref={scrollRef}>
        {logs.map((log, i) => (
          <div key={i} className={
            log.type === 'err' ? 'text-red-500' : 
            log.type === 'sys' ? 'text-yellow-400' : 
            log.type === 'user' ? 'text-white' : ''
          }>
            {log.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 animate-pulse">
            <Loader2 size={10} className="animate-spin" />
            <span>AI PROCESSING...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#C0C0C0] p-2 border-t-2 border-[#808080] flex gap-2">
        <input
          type="text"
          className="window-sunken flex-1 px-2 py-1 text-[11px] font-mono outline-none"
          placeholder="Draw a simple flowchart..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !prompt.trim()}
          className="retro-button p-1 w-8 flex items-center justify-center"
        >
          <Send size={14} />
        </button>
      </div>
      
      <div className="bg-[#C0C0C0] px-2 pb-1 flex items-center gap-1 text-[9px] text-gray-600 italic">
        <Info size={10} />
        <span>Uses Gemini API Key from Settings</span>
      </div>
    </div>
  );
};

export default AiChat;
