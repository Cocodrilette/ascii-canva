import { X, Key, Plus, Trash2, RefreshCw, Check, Copy, ShieldAlert, Cpu } from "lucide-react";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { sileo } from "sileo";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: string;
  created_at: string;
  revoked_at?: string;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      setGeminiApiKey(localStorage.getItem("GEMINI_API_KEY") || "");
    }
  }, [isOpen]);

  const checkUser = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const fetchApiKeys = useCallback(async () => {
    const currentUser = await checkUser();
    if (!currentUser) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  }, [checkUser]);

  useEffect(() => {
    if (isOpen) {
      fetchApiKeys();
      setGeneratedKey(null);
    }
  }, [isOpen, fetchApiKeys]);

  const generateRandomKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segments = [8, 4, 4, 4, 12];
    return segments
      .map((len) =>
        Array.from({ length: len }, () =>
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join("")
      )
      .join("-");
  };

  const createApiKey = async () => {
    if (!newKeyName.trim() || !user) return;
    setLoading(true);
    const newKey = `ac_${generateRandomKey()}`;
    
    const { error } = await supabase.from("api_keys").insert({
      name: newKeyName,
      key: newKey,
      user_id: user.id,
    });

    if (error) {
      sileo.error({ title: "Authorization Error", description: error.message });
    } else {
      setNewKeyName("");
      setGeneratedKey(newKey);
      fetchApiKeys();
    }
    setLoading(false);
  };

  const revokeApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action is permanent for this key.")) return;
    setLoading(true);
    const { error } = await supabase
      .from("api_keys")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      sileo.error({ title: "Revocation Failure", description: error.message });
    } else {
      fetchApiKeys();
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="glass-floating w-full max-w-md shadow-2xl m-4 flex flex-col max-h-[85vh] overflow-hidden border-white/30 animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="bg-[#000080]/10 px-4 py-4 flex items-center justify-between border-b border-white/20">
            <div className="flex items-center gap-3 text-[#000080]">
              <div className="bg-[#000080] p-1.5 rounded-lg text-white shadow-lg shadow-blue-900/20">
                <Key size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">Security Center</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">API_KEY_MANAGER.EXE</span>
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

          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="relative">
                  <ShieldAlert size={64} className="text-[#000080] opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Key size={24} className="text-[#000080]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-zinc-800">Identity Verification Required</h3>
                  <p className="text-xs text-zinc-500 max-w-[280px] leading-relaxed">
                    To access secure terminal functions and manage your persistent workspace keys, please authenticate.
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuth(true)}
                  className="genesis-button genesis-button-primary px-8 py-3 rounded-2xl shadow-xl shadow-blue-900/30 font-bold"
                >
                  Verify Identity
                </button>
              </div>
            ) : (
              <>
                {/* Create New Key */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Generate New Access Key</label>
                  <div className="flex gap-2 p-1.5 bg-white/40 rounded-2xl border border-white/60">
                    <input
                      type="text"
                      placeholder="Identifier (e.g. VSCode Assistant)"
                      className="bg-transparent flex-1 px-3 py-2 text-xs font-medium outline-none placeholder:text-zinc-400"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={createApiKey}
                      disabled={loading || !newKeyName.trim()}
                      className="genesis-button genesis-button-primary px-4 py-2 rounded-xl text-xs whitespace-nowrap"
                    >
                      <Plus size={14} /> Create
                    </button>
                  </div>
                </div>

                {generatedKey && (
                  <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 space-y-3 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check size={14} className="font-bold" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Key Secured & Materialized</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-white/80 border border-green-200 px-3 py-2 text-xs rounded-xl flex-1 truncate font-mono text-green-800 font-bold">
                        {generatedKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedKey)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-green-200 text-green-600 shadow-sm hover:shadow-md transition-all active:scale-90"
                      >
                        {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-[9px] text-green-600 font-medium italic">Copy this key now. For your security, it will only be displayed once.</p>
                  </div>
                )}

                {/* Key List */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Active Credentials</label>
                  <div className="bg-white/40 rounded-2xl border border-white/60 overflow-hidden shadow-inner">
                    <table className="w-full border-collapse">
                      <thead className="bg-white/40 border-b border-white/60">
                        <tr className="text-left text-[9px] font-black uppercase tracking-tighter text-zinc-400">
                          <th className="px-4 py-2 font-black">Identity</th>
                          <th className="px-4 py-2 font-black text-center">Status</th>
                          <th className="px-4 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/40">
                        {apiKeys.length === 0 && !loading && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-zinc-400 text-[11px] italic">No active neural links found.</td>
                          </tr>
                        )}
                        {apiKeys.map((key) => (
                          <tr key={key.id} className={`group hover:bg-white/20 transition-colors ${key.status === 'revoked' ? 'opacity-40' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700 truncate max-w-[140px]">{key.name}</span>
                                <span className="text-[9px] font-medium text-zinc-400">Issued {new Date(key.created_at).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                                key.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                              }`}>
                                {key.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {key.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => revokeApiKey(key.id)}
                                  className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 ml-auto"
                                >
                                  <Trash2 size={12} /> Revoke
                                </button>
                              ) : (
                                <span className="text-[9px] font-bold text-zinc-400 uppercase">Revoked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* External AI Integration */}
                <div className="pt-6 border-t border-zinc-200 space-y-4">
                  <div className="flex items-center gap-3 text-zinc-800">
                    <div className="bg-zinc-100 p-1.5 rounded-lg">
                      <Cpu size={16} className="text-[#000080]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">External AI Integration</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Neural Link Pipeline</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-3">
                    <p className="text-[10px] text-blue-700/80 leading-relaxed font-medium">
                      Enable AI-powered diagram generation by linking your Google Gemini API key. 
                      Stored <span className="font-bold underline">locally in-session</span> for privacy.
                    </p>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Neural Access Key (AI_...)"
                        className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
                        value={geminiApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGeminiApiKey(val);
                          localStorage.setItem("GEMINI_API_KEY", val);
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Key size={14} className="text-blue-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-[#F8FAFC] border-t border-white/20 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-zinc-400">
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                 <span>Pipeline: {loading ? "Syncing" : "Encrypted"}</span>
               </div>
               <RefreshCw 
                 size={12} 
                 className={`cursor-pointer hover:text-[#000080] transition-colors ${loading ? "animate-spin text-blue-500" : ""}`} 
                 onClick={fetchApiKeys} 
               />
            </div>
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

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onSuccess={fetchApiKeys} 
      />
    </>
  );
};

export default ApiKeyModal;
