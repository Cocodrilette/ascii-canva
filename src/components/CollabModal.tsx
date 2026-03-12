import { Copy, Link, Shield, Users, Wifi, X, Check } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface CollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerId: string;
  channelId: string;
  status: "idle" | "connecting" | "connected" | "failed" | "loading";
  onStartHost: () => void;
}

const CollabModal: React.FC<CollabModalProps> = ({
  isOpen,
  onClose,
  peerId,
  channelId,
  status,
  onStartHost,
}) => {
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isOpen) return null;

  const collabUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?join=${channelId}`
      : "";

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(collabUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.warn("Clipboard API failed");
    }
  };

  const statusConfig = {
    idle: { color: "text-zinc-400", label: "Idle" },
    connecting: { color: "text-amber-500 animate-pulse", label: "Connecting" },
    connected: { color: "text-emerald-500 font-bold", label: "Active" },
    failed: { color: "text-red-500", label: "Failed" },
    loading: { color: "text-blue-500", label: "Syncing" },
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-xl flex items-center justify-center z-[200] animate-in fade-in duration-500">
      <div className="w-full max-w-lg p-12 flex flex-col items-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="w-full flex flex-col items-center text-center space-y-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 flex items-center justify-center shadow-inner animate-in zoom-in-50 duration-700">
            <Users className="text-zinc-600" size={32} />
          </div>
          
          <div className="space-y-4 max-w-sm">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Collaboration
            </h2>
            <p className="text-lg text-zinc-500 font-medium leading-relaxed">
              Work together in real-time. Share your workspace with others to build together.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-6 pt-4">
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 rounded-3xl border border-zinc-100">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</span>
                <span className={`text-sm font-bold flex items-center gap-2 ${statusConfig[status].color}`}>
                  {status === "connected" && <Wifi size={14} />}
                  {statusConfig[status].label}
                </span>
              </div>
              <div className="h-8 w-px bg-zinc-200" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Peer ID</span>
                <span className="text-sm font-mono font-bold text-zinc-600">{peerId || "---"}</span>
              </div>
            </div>

            {!channelId ? (
              <button
                type="button"
                onClick={onStartHost}
                className="w-full py-4 rounded-full bg-zinc-900 text-white text-sm font-bold shadow-xl shadow-zinc-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                Enable Real-time Sync
              </button>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="relative group">
                  <input
                    type="text"
                    readOnly
                    value={collabUrl}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-full py-4 pl-6 pr-16 text-sm font-medium text-zinc-600 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-100 text-zinc-600 shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    {copyFeedback ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 font-medium italic">
                  Share this link with anyone you want to build with.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="w-full mt-16 flex justify-center">
          <button
            onClick={onClose}
            className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollabModal;
