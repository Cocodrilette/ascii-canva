import { X, Layout, Plus, Copy, Check, Hash, Globe, ChevronRight, ShieldAlert } from "lucide-react";
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
  activeSpaceId?: string;
}

const SpaceManagerModal: React.FC<SpaceManagerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchSpace,
  activeSpaceId 
}) => {
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
      sileo.error({ title: "Registration Failure", description: error.message });
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
                <Layout className="text-zinc-600" size={32} />
              </div>
              
              <div className="space-y-4 max-w-sm">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                  Workspace
                </h2>
                <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                  Organize your projects into sectors. Use the Space ID for programmatic access via API.
                </p>
              </div>

              {!user ? (
                <div className="flex flex-col items-center gap-6 py-8">
                  <Globe size={48} className="text-blue-500" />
                  <p className="text-zinc-500 font-medium max-w-xs">
                    Sign in to create and manage your persistent workspace sectors.
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
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">New Sector</h3>
                    </div>
                    <div className="bg-zinc-50 rounded-[2.5rem] border border-zinc-100 p-2 space-y-2">
                      <div className="flex flex-col md:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Project Name..."
                          className="bg-white border border-zinc-100 flex-1 px-6 py-3 rounded-full text-sm font-medium text-zinc-600 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Slug..."
                          className="bg-white border border-zinc-100 w-full md:w-32 px-6 py-3 rounded-full text-sm font-mono font-bold text-zinc-600 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all uppercase"
                          value={newSlug}
                          onChange={(e) => setNewSlug(e.target.value.toUpperCase())}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={createSpace}
                        disabled={loading || !newName.trim() || !newSlug.trim()}
                        className="w-full py-4 rounded-full bg-zinc-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Plus size={18} /> Create Sector
                      </button>
                    </div>
                  </div>

                  {/* Current Space Info (If active) */}
                  {activeSpaceId && spaces.find(s => s.id === activeSpaceId) && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Active Sector</h3>
                      <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                          <span className="text-lg font-bold text-blue-900">
                            {spaces.find(s => s.id === activeSpaceId)?.name}
                          </span>
                          <span className="text-xs font-medium text-blue-600 uppercase tracking-widest">
                            Currently engaged
                          </span>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-2">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Space ID (API)</span>
                          <div className="flex items-center gap-2 bg-white/60 border border-blue-200 px-4 py-2 rounded-full">
                            <code className="text-xs font-mono font-bold text-blue-800">{activeSpaceId}</code>
                            <button 
                              onClick={() => copyToClipboard(activeSpaceId, activeSpaceId)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              {copyId === activeSpaceId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-blue-400" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* List Section */}
                  {spaces.filter(s => s.id !== activeSpaceId).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Other Sectors</h3>
                      <div className="bg-zinc-50 rounded-[2.5rem] border border-zinc-100 overflow-hidden">
                        <div className="divide-y divide-zinc-200/50">
                          {spaces.filter(s => s.id !== activeSpaceId).map((space) => (
                            <div key={space.id} className="p-6 flex items-center justify-between group hover:bg-white/50 transition-colors">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-zinc-900">{space.name}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-600 text-[10px] font-bold font-mono">
                                    {space.slug}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                  <Hash size={12} />
                                  <span className="text-[10px] font-medium truncate max-w-[120px]">{space.id}</span>
                                  <button 
                                    onClick={() => copyToClipboard(space.id, space.id)}
                                    className="hover:text-zinc-900 transition-colors"
                                  >
                                    {copyId === space.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => onSwitchSpace(space.slug)}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-zinc-100 text-zinc-900 shadow-sm hover:scale-110 active:scale-90 transition-all"
                                title="Engage Sector"
                              >
                                <ChevronRight size={24} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
        onSuccess={fetchSpaces} 
      />
    </>
  );
};

export default SpaceManagerModal;
