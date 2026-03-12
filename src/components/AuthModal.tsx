import { X, Lock, Mail, UserPlus, LogIn, AlertCircle, ShieldCheck } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { sileo } from "sileo";
import { supabase } from "../lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
      } else {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signupError) throw signupError;
        sileo.success({ title: "Authorization Dispatched", description: "Verification signal sent to your inbox." });
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-floating w-full max-w-sm shadow-2xl m-4 flex flex-col overflow-hidden border-white/30 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#000080]/10 px-4 py-4 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-3 text-[#000080]">
            <div className="bg-[#000080] p-1.5 rounded-lg text-white shadow-lg shadow-blue-900/20">
              <Lock size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs tracking-tight">Identity Gateway</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                {mode === "login" ? "SESSION_INIT.EXE" : "IDENTITY_CREATION.EXE"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tighter text-zinc-800 uppercase">
              {mode === "login" ? "Welcome Back" : "Begin Journey"}
            </h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {mode === "login" 
                ? "Identity verification required for cloud sync." 
                : "Register your signature to sync workspace."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                Operator Signal
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full bg-white/60 border border-white/60 rounded-xl px-4 py-2.5 pl-10 text-xs font-medium outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@neural.net"
                />
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                Access Code
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full bg-white/60 border border-white/60 rounded-xl px-4 py-2.5 pl-10 text-xs font-medium outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-[10px] font-bold flex gap-2 items-center animate-in slide-in-from-top-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="genesis-button genesis-button-primary w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase text-xs shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
            >
              {loading ? (
                <span className="animate-pulse">Authorizing...</span>
              ) : mode === "login" ? (
                <><LogIn size={16} /> Initialize Session</>
              ) : (
                <><UserPlus size={16} /> Finalize Registration</>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-200 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest"
            >
              {mode === "login" 
                ? "Request New Identity" 
                : "Existing Identity detected"}
            </button>
          </div>
        </div>

        <div className="p-3 bg-white/40 border-t border-white/20 flex justify-center items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Encrypted Tunnel Active</span>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
