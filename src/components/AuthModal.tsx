import { X, Lock, Mail, UserPlus, LogIn, AlertCircle } from "lucide-react";
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="window-raised w-full max-w-sm shadow-[8px_8px_0_rgba(0,0,0,0.5)] m-4 flex flex-col">
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between font-['VT323'] text-sm">
          <div className="flex items-center gap-2">
            <Lock size={14} />
            <span>{mode === "login" ? "SYSTEM_LOGIN.EXE" : "USER_REGISTRATION.EXE"}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] flex items-center justify-center text-black active:border-inset p-0"
          >
            <X size={10} />
          </button>
        </div>

        <div className="p-6 bg-[#C0C0C0] space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-['VT323'] text-2xl uppercase tracking-tighter">
              {mode === "login" ? "Access Terminal" : "Create Account"}
            </h2>
            <p className="text-[10px] uppercase font-bold text-gray-600">
              {mode === "login" 
                ? "Identification required for cloud features." 
                : "Register to sync your workspace data."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold block uppercase flex items-center gap-1">
                <Mail size={12} /> Email Address:
              </label>
              <input
                type="email"
                required
                className="window-sunken w-full px-2 py-1.5 text-[11px] outline-none font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@system.net"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold block uppercase flex items-center gap-1">
                <Lock size={12} /> Password:
              </label>
              <input
                type="password"
                required
                className="window-sunken w-full px-2 py-1.5 text-[11px] outline-none font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            {error && (
              <div className="p-2 border-2 border-red-600 bg-red-50 text-red-700 text-[10px] font-bold flex gap-2 items-center animate-pulse">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="retro-button w-full py-2 flex items-center justify-center gap-2 font-bold uppercase text-xs"
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : mode === "login" ? (
                <><LogIn size={14} /> Initialize Login</>
              ) : (
                <><UserPlus size={14} /> Confirm Signup</>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-400 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-[10px] uppercase font-bold text-[var(--os-titlebar)] hover:underline"
            >
              {mode === "login" 
                ? "Don't have an account? Register here" 
                : "Already registered? Switch to login"}
            </button>
          </div>
        </div>

        <div className="p-2 border-t-2 border-[#808080] flex justify-center text-[9px] font-bold uppercase text-gray-500 bg-[#C0C0C0]">
          SECURE_ENCRYPTION_LAYER_ACTIVE
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
