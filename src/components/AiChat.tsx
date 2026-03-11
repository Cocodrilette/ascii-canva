import { Bot, Send, X, Loader2, Info, Zap } from "lucide-react";
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
    { type: 'sys', text: "GENESIS_AI_CORE v2.0 (ENCRYPTED)" },
    { type: 'sys', text: "AWAITING NEURAL INPUT..." }
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
      setLogs(prev => [...prev, { type: 'err', text: "CRYPTO_FAILURE: MISSING_GEMINI_KEY" }]);
      return;
    }

    if (!spaceId) {
      setLogs(prev => [...prev, { type: 'err', text: "SYNC_FAILURE: LOCAL_MODE_ONLY" }]);
      return;
    }

    if (!apiKey) {
      setLogs(prev => [...prev, { type: 'err', text: "AUTH_FAILURE: NO_ACCESS_KEY" }]);
      return;
    }

    const currentPrompt = prompt;
    setPrompt("");
    setLoading(true);
    setLogs(prev => [...prev, { type: 'user', text: `> ${currentPrompt}` }]);

    try {
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
      if (!aiRes.ok) throw new Error(aiData.error || "CORE_PROCESS_FAILURE");

      setLogs(prev => [...prev, { type: 'sys', text: `MATERIALIZING ${aiData.elements.length} OBJECTS...` }]);

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
          setLogs(prev => [...prev, { type: 'ai', text: `+ SYNCED: ${element.type.toUpperCase()}` }]);
        } else {
          setLogs(prev => [...prev, { type: 'err', text: `! REJECTED: ${element.type.toUpperCase()}` }]);
        }
      }

      setLogs(prev => [...prev, { type: 'sys', text: "SEQUENCE_COMPLETE." }]);

    } catch (error: any) {
      setLogs(prev => [...prev, { type: 'err', text: `FATAL: ${error.message.toUpperCase()}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[100] w-[380px] glass-floating shadow-2xl border-white/30 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Title Bar */}
      <div className="bg-[#000080]/10 px-4 py-3 flex items-center justify-between border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="bg-[#000080] p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
            <Bot size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-wider text-[#000080]">AI_ASSISTANT</span>
            <span className="text-[9px] font-bold text-green-600 uppercase">Neural Link Active</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Terminal Area */}
      <div className="bg-zinc-900/90 text-green-400 p-4 h-[320px] overflow-y-auto font-mono text-[11px] space-y-2 border-b border-white/10 custom-scrollbar" ref={scrollRef}>
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-2 ${
            log.type === 'err' ? 'text-rose-400' : 
            log.type === 'sys' ? 'text-sky-400' : 
            log.type === 'user' ? 'text-zinc-100' : 'text-green-400'
          }`}>
            <span className="opacity-30">{i.toString().padStart(3, '0')}</span>
            <span className="flex-1 leading-relaxed">{log.text}</span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-sky-400 animate-pulse py-2">
            <Zap size={12} className="animate-bounce" />
            <span className="font-bold tracking-widest">PROCESSING_NEURAL_STREAMS...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/40 backdrop-blur-md space-y-3">
        <div className="relative group">
          <input
            type="text"
            className="w-full bg-white/60 border border-white/60 rounded-2xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-4 focus:ring-[#000080]/5 focus:border-[#000080]/20 transition-all placeholder:text-zinc-400"
            placeholder="Input diagram sequence..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-[#000080] text-white shadow-lg shadow-blue-900/20 active:scale-90 disabled:opacity-50 disabled:grayscale transition-all"
          >
            <Send size={14} />
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-tight">
          <Info size={10} className="opacity-50" />
          <span>Genesis Core V2.0 // Secured Connection</span>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
