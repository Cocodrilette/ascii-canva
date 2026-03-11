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
    idle: { color: "bg-zinc-100 text-zinc-500", label: "Idle" },
    connecting: { color: "bg-yellow-100 text-yellow-700 animate-pulse", label: "Linking" },
    connected: { color: "bg-green-100 text-green-700 font-bold", label: "Active" },
    failed: { color: "bg-red-100 text-red-700", label: "Failed" },
    loading: { color: "bg-blue-100 text-blue-700", label: "Syncing" },
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-floating w-full max-w-md shadow-2xl m-4 flex flex-col border-white/30 animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="bg-[#000080]/10 px-4 py-4 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-3 text-[#000080]">
            <div className="bg-[#000080] p-1.5 rounded-lg text-white shadow-lg shadow-blue-900/20">
              <Users size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight">Collaboration Hub</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">REALTIME_ENGINE.V1</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="bg-white/40 p-4 rounded-2xl border border-white/60 flex flex-col gap-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Local Peer ID
              </span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                {peerId}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-white/60 pt-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Nexus Status
              </span>
              <span
                className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${statusConfig[status].color}`}
              >
                {status === "connected" && <Wifi size={12} className="animate-pulse" />}
                {statusConfig[status].label}
              </span>
            </div>
          </div>

          {!channelId ? (
            <div className="flex flex-col gap-4 py-4 text-center">
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[280px] mx-auto">
                Establish a neural link to share your ASCII canvas in real-time with remote operators.
              </p>
              <button
                type="button"
                onClick={onStartHost}
                className="genesis-button genesis-button-primary py-3 flex items-center justify-center gap-3 w-full font-bold text-sm rounded-2xl shadow-xl shadow-blue-900/30"
              >
                <Shield size={18} /> Establish Nexus Link
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col gap-2">
                <label htmlFor="collab-link" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Shareable Gateway
                </label>
                <div className="flex gap-2 p-1.5 bg-white/40 rounded-2xl border border-white/60">
                  <input
                    id="collab-link"
                    type="text"
                    readOnly
                    value={collabUrl}
                    className="bg-transparent flex-1 text-[10px] font-mono px-3 py-2 outline-none text-zinc-600 truncate"
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${copyFeedback ? 'bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-white border border-zinc-200 text-zinc-600 shadow-sm'}`}
                    title="Copy Link"
                  >
                    {copyFeedback ? <Check size={18} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                <div className="bg-blue-100 p-1.5 rounded-lg mt-0.5">
                  <Link size={14} className="text-blue-600" />
                </div>
                <p className="text-[10px] text-blue-800/80 font-medium leading-relaxed">
                  Transmit this link to a peer. Once they sync with the gateway, they will materialize in your session.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#F8FAFC] border-t border-white/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="genesis-button h-8 px-6 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollabModal;
