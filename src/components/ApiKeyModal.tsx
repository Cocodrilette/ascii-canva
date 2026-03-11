import { X, Key, Plus, Trash2, RefreshCw, Check, Copy, ShieldAlert } from "lucide-react";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
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
      alert(`Error creating key: ${error.message}`);
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
      alert(`Error revoking key: ${error.message}`);
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
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/20">
        <div className="window-raised w-full max-w-md shadow-[4px_4px_0_rgba(0,0,0,0.5)] m-4 flex flex-col max-h-[80vh]">
          <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between font-['VT323'] text-sm">
            <div className="flex items-center gap-2">
              <Key size={14} />
              <span>API_KEY_MANAGER.EXE</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-4 h-4 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] flex items-center justify-center text-black active:border-inset p-0"
            >
              <X size={10} />
            </button>
          </div>

          <div className="p-4 bg-[#C0C0C0] space-y-4 overflow-y-auto">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <ShieldAlert size={48} className="text-[#000080] opacity-50" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm uppercase">Authentication Required</h3>
                  <p className="text-[10px] text-gray-600 max-w-[250px]">
                    To protect your workspace data, API key management is only available to registered operators.
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuth(true)}
                  className="retro-button px-6 py-2 font-bold flex items-center gap-2"
                >
                  <Key size={14} /> Identity Verification
                </button>
              </div>
            ) : (
              <>
                {/* Create New Key */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold block uppercase">Generate New Access Key:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key Name (e.g. My App)"
                      className="window-sunken flex-1 px-2 py-1 text-[11px] outline-none"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={createApiKey}
                      disabled={loading || !newKeyName.trim()}
                      className="retro-button px-3 py-1 text-[11px] flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus size={12} /> Create
                    </button>
                  </div>
                </div>

                {generatedKey && (
                  <div className="p-2 border-2 border-green-600 bg-green-50 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] text-green-800 font-bold uppercase">Key Generated! Copy it now, it won't be shown again in full.</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white border border-green-300 px-2 py-1 text-[11px] flex-1 truncate font-mono">
                        {generatedKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedKey)}
                        className="retro-button p-1"
                        title="Copy to clipboard"
                      >
                        {copySuccess ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Key List */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold block uppercase">Active & Revoked Keys:</label>
                  <div className="window-sunken bg-white min-h-[150px] overflow-y-auto">
                    <table className="w-full text-[10px] border-collapse">
                      <thead className="bg-gray-100 border-b border-gray-300 sticky top-0">
                        <tr className="text-left uppercase">
                          <th className="px-2 py-1 border-r border-gray-300">Name</th>
                          <th className="px-2 py-1 border-r border-gray-300">Status</th>
                          <th className="px-2 py-1">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys.length === 0 && !loading && (
                          <tr>
                            <td colSpan={3} className="px-2 py-4 text-center text-gray-400 italic">No keys found.</td>
                          </tr>
                        )}
                        {apiKeys.map((key) => (
                          <tr key={key.id} className={`border-b border-gray-100 ${key.status === 'revoked' ? 'bg-gray-50 text-gray-400' : ''}`}>
                            <td className="px-2 py-1 border-r border-gray-100 font-bold truncate max-w-[120px]" title={key.name}>
                              {key.name}
                            </td>
                            <td className="px-2 py-1 border-r border-gray-100">
                              <span className={`px-1 ${key.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                                {key.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-2 py-1">
                              {key.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => revokeApiKey(key.id)}
                                  className="text-red-600 hover:underline flex items-center gap-1"
                                >
                                  <Trash2 size={10} /> Revoke
                                </button>
                              ) : (
                                <span className="text-[9px]">
                                  {new Date(key.revoked_at!).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-2 border-t-2 border-[#808080] flex justify-between items-center text-[10px] font-bold uppercase text-gray-600 bg-[#C0C0C0]">
            <div className="flex items-center gap-2">
               <RefreshCw size={10} className={loading ? "animate-spin" : ""} onClick={fetchApiKeys} />
               <span>Status: {loading ? "Syncing..." : "Ready"}</span>
            </div>
            <button type="button" onClick={onClose} className="retro-button px-4">Close</button>
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
