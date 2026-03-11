import { X, Layout, Plus, ExternalLink, Copy, Check, Hash, Globe, ChevronRight } from "lucide-react";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { sileo } from "sileo";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";

interface Space {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

interface SpaceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchSpace: (slug: string) => void;
}

const SpaceManagerModal: React.FC<SpaceManagerModalProps> = ({ isOpen, onClose, onSwitchSpace }) => {
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyId, setCopyId] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const fetchSpaces = useCallback(async () => {
    const currentUser = await checkUser();
    if (!currentUser) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("owner_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching spaces:", error);
    } else {
      setSpaces(data || []);
    }
    setLoading(false);
  }, [checkUser]);

  useEffect(() => {
    if (isOpen) {
      fetchSpaces();
    }
  }, [isOpen, fetchSpaces]);

  const createSpace = async () => {
    if (!newName.trim() || !newSlug.trim() || !user) return;
    setLoading(true);
    
    const { error } = await supabase.from("spaces").insert({
      name: newName,
      slug: newSlug.toUpperCase(),
      owner_id: user.id,
    });

    if (error) {
      sileo.error({ title: "Sector Registration Failure", description: error.message });
    } else {
      setNewName("");
      setNewSlug("");
      fetchSpaces();
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyId(id);
    setTimeout(() => setCopyId(null), 2000);
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
                <Layout size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">Space Explorer</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">WORKSPACE_INDEX.V2</span>
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

          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white/20">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="bg-zinc-100 p-6 rounded-full relative shadow-inner">
                  <Globe size={48} className="text-[#000080] opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Plus size={24} className="text-[#000080]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-zinc-800">Cloud Sync Required</h3>
                  <p className="text-xs text-zinc-500 max-w-[280px] leading-relaxed">
                    Initialize your operator profile to manage persistent canvas spaces and establish secure neural links.
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuth(true)}
                  className="genesis-button genesis-button-primary px-8 py-3 rounded-2xl shadow-xl shadow-blue-900/30 font-bold"
                >
                  Sync Profile
                </button>
              </div>
            ) : (
              <>
                {/* Create New Space */}
                <div className="p-4 rounded-2xl bg-white/40 border border-white/60 space-y-4 shadow-sm">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Initialize Workspace</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Project Name"
                        className="w-full bg-white/60 border border-white/60 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="SLUG-01"
                        className="w-full bg-white/60 border border-white/60 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={createSpace}
                    disabled={loading || !newName.trim() || !newSlug.trim()}
                    className="genesis-button genesis-button-primary w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs"
                  >
                    <Plus size={14} /> Register New Sector
                  </button>
                </div>

                {/* Space List */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Registered Sectors</label>
                  <div className="rounded-2xl border border-white/60 overflow-hidden bg-white/40 shadow-inner min-h-[200px]">
                    {spaces.length === 0 && !loading && (
                      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                        <Layout size={32} className="opacity-20 mb-2" />
                        <p className="text-[11px] italic">No active sectors detected.</p>
                      </div>
                    )}
                    <div className="divide-y divide-white/60">
                      {spaces.map((space) => (
                        <div key={space.id} className="p-4 hover:bg-white/40 transition-all group cursor-default">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-zinc-800">{space.name}</span>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-tight">
                                  {space.slug}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                                  <Hash size={10} className="opacity-50" />
                                  <span className="truncate max-w-[100px]">{space.id}</span>
                                  <button 
                                    onClick={() => copyToClipboard(space.id, space.id)}
                                    className="ml-1 text-blue-400 hover:text-blue-600 transition-colors"
                                  >
                                    {copyId === space.id ? <Check size={10} /> : <Copy size={10} />}
                                  </button>
                                </div>
                                <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                                <span className="text-[9px] text-zinc-400 font-medium">Created {new Date(space.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => onSwitchSpace(space.slug)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-[#000080] shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all"
                              title="Engage Space"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-[#F8FAFC] border-t border-white/20 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
               <span>Sectors: {spaces.length}</span>
             </div>
             <button type="button" onClick={onClose} className="genesis-button h-8 px-6 font-bold">Close</button>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onSuccess={fetchSpaces} 
      />
    </>
  );
};

export default SpaceManagerModal;
