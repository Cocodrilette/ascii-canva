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
    if (!confirm("Are you sure you want to revoke this API key?")) return;
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
      <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[200] overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
        <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-2xl flex flex-col items-center relative animate-in zoom-in-95 duration-700">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 p-2 text-zinc-400 hover:text-zinc-900 transition-colors md:top-0 md:right-0"
            >
              <X size={24} />
            </button>

            {/* Content */}
            <div className="w-full flex flex-col items-center text-center space-y-10">
              <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 flex items-center justify-center shadow-inner animate-in zoom-in-50 duration-700">
                <Key className="text-zinc-600" size={32} />
              </div>
              
              <div className="space-y-4 max-w-sm">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                  Access Keys
                </h2>
                <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                  Manage your credentials and external integrations for a more powerful workspace.
                </p>
              </div>

              {!user ? (
                <div className="flex flex-col items-center gap-6 py-8">
                  <ShieldAlert size={48} className="text-amber-500" />
                  <p className="text-zinc-500 font-medium max-w-xs">
                    Please sign in to manage your access keys and secure your workspace.
                  </p>
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="px-10 py-3 rounded-full bg-zinc-900 text-white text-sm font-bold shadow-xl shadow-zinc-900/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-12 pt-4 text-left">
                  {/* Create Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Create New Key</h3>
                    <div className="flex gap-2 p-2 bg-zinc-50 rounded-[2rem] border border-zinc-100 group focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all">
                      <input
                        type="text"
                        placeholder="Give your key a name..."
                        className="bg-transparent flex-1 px-6 py-3 text-sm font-medium text-zinc-600 outline-none"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={createApiKey}
                        disabled={loading || !newKeyName.trim()}
                        className="px-6 py-3 rounded-full bg-zinc-900 text-white text-sm font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Plus size={18} /> Create
                      </button>
                    </div>
                  </div>

                  {generatedKey && (
                    <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest px-2">New Key Created</p>
                      <div className="relative group">
                        <input
                          type="text"
                          readOnly
                          value={generatedKey}
                          className="w-full bg-white border border-emerald-200 rounded-full py-4 pl-6 pr-16 text-sm font-mono font-bold text-emerald-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(generatedKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-emerald-200 text-emerald-600 shadow-sm hover:scale-105 active:scale-95 transition-all"
                        >
                          {copySuccess ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-emerald-600 font-medium italic px-2">
                        Copy this key now. It won't be shown again.
                      </p>
                    </div>
                  )}

                  {/* List Section */}
                  {apiKeys.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Your Keys</h3>
                      <div className="bg-zinc-50 rounded-[2.5rem] border border-zinc-100 overflow-hidden">
                        <div className="divide-y divide-zinc-200/50">
                          {apiKeys.map((key) => (
                            <div key={key.id} className={`p-6 flex items-center justify-between group hover:bg-white/50 transition-colors ${key.status === 'revoked' ? 'opacity-40' : ''}`}>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-zinc-900">{key.name}</span>
                                <span className="text-[10px] font-medium text-zinc-400">Created {new Date(key.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                  key.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'
                                }`}>
                                  {key.status}
                                </span>
                                {key.status === 'active' && (
                                  <button
                                    type="button"
                                    onClick={() => revokeApiKey(key.id)}
                                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Revoke Key"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Integration */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                      <Cpu size={24} className="text-zinc-400" />
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">AI Integration</h3>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 space-y-6">
                      <p className="text-sm text-blue-700 font-medium leading-relaxed">
                        Link your Gemini API key to enable intelligent diagram generation. Stored locally in your session.
                      </p>
                      <div className="relative group">
                        <input
                          type="password"
                          placeholder="Gemini API Key..."
                          className="w-full bg-white border border-blue-200 rounded-full py-4 px-6 text-sm font-mono text-zinc-600 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          value={geminiApiKey}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGeminiApiKey(val);
                            localStorage.setItem("GEMINI_API_KEY", val);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
