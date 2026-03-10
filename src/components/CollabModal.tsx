import { Copy, Link, Shield, Users, Wifi } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface CollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerId: string;
  channelId: string;
  status: "idle" | "connecting" | "connected" | "failed";
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
      // Try the modern Clipboard API first
      await navigator.clipboard.writeText(collabUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.warn("Modern clipboard API failed, trying fallback...", err);
      
      // Fallback: Using a hidden textarea
      try {
        const textArea = document.createElement("textarea");
        textArea.value = collabUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        }
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
    }
  };

  const statusColors = {
    idle: "text-gray-500",
    connecting: "text-yellow-600 animate-pulse",
    connected: "text-green-600 font-bold",
    failed: "text-red-600",
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
      <div className="window-raised w-full max-w-md shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
        <div className="title-bar">
          <span className="flex items-center gap-2 font-bold">
            <Users className="w-3 h-3" /> Collaboration_Manager.exe
          </span>
          <button
            type="button"
            onClick={onClose}
            className="retro-button px-1 py-0 leading-none h-4 w-4 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 bg-[var(--os-bg)]">
          <div className="window-sunken p-3 bg-white flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="ui-label text-xs uppercase opacity-70">
                Local Peer ID
              </span>
              <span className="font-mono text-sm font-bold bg-blue-50 px-1 border border-blue-200">
                {peerId}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-2">
              <span className="ui-label text-xs uppercase opacity-70">
                Connection Status
              </span>
              <span
                className={`flex items-center gap-1 text-sm ${statusColors[status]}`}
              >
                {status === "connected" && <Wifi className="w-3 h-3" />}
                {status.toUpperCase()}
              </span>
            </div>
          </div>

          {!channelId ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-600 leading-relaxed italic">
                Hosting a session allows you to share your ASCII canvas in
                real-time with others via Supabase Realtime.
              </p>
              <button
                type="button"
                onClick={onStartHost}
                className="retro-button py-2 flex items-center justify-center gap-2 w-full font-bold text-sm"
              >
                <Shield className="w-4 h-4" /> Start Hosting Session
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="collab-link" className="ui-label">
                  Shareable Link
                </label>
                <div className="flex gap-1">
                  <input
                    id="collab-link"
                    type="text"
                    readOnly
                    value={collabUrl}
                    className="retro-input flex-1 text-[10px] font-mono py-1"
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="retro-button px-2"
                    title="Copy Link"
                  >
                    {copyFeedback ? "OK!" : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="p-2 border-2 border-dashed border-[var(--os-border-dark)] bg-blue-50/50 rounded flex items-start gap-2">
                <Link className="w-4 h-4 mt-1 text-blue-600" />
                <p className="text-[10px] text-blue-800 leading-tight">
                  Send this link to a peer. Once they open it, they will join
                  the real-time canvas session.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[var(--os-border-dark)]">
            <button
              type="button"
              onClick={onClose}
              className="retro-button min-w-[80px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabModal;
