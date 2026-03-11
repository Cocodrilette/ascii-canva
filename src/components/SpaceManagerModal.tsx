import { X, Layout, Plus, ExternalLink, Copy, Check, Hash, Globe } from "lucide-react";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
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
      alert(`Error creating space: ${error.message}`);
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
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/20">
        <div className="window-raised w-full max-w-md shadow-[4px_4px_0_rgba(0,0,0,0.5)] m-4 flex flex-col max-h-[80vh]">
          <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between font-['VT323'] text-sm">
            <div className="flex items-center gap-2">
              <Layout size={14} />
              <span>SPACE_EXPLORER.EXE</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-4 h-4 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] flex items-center justify-center text-black active:border-inset p-0"
            >
              <X size={10} />
            </button>
          </div>

          <div className="p-4 bg-[#C0C0C0] space-y-4 overflow-y-auto font-['MS_Sans_Serif']">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <Globe size={48} className="text-[#000080] opacity-50" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm uppercase">Cloud Storage Offline</h3>
                  <p className="text-[10px] text-gray-600 max-w-[250px]">
                    Login to initialize permanent spaces and manage your API integration targets.
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuth(true)}
                  className="retro-button px-6 py-2 font-bold flex items-center gap-2"
                >
                  <Plus size={14} /> Initialize User
                </button>
              </div>
            ) : (
              <>
                {/* Create New Space */}
                <div className="window-sunken p-3 bg-white/50 space-y-3">
                  <label className="text-[11px] font-bold block uppercase">Initialize New Space:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Space Name"
                      className="window-sunken px-2 py-1 text-[11px] outline-none"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="SLUG (e.g. ART-01)"
                      className="window-sunken px-2 py-1 text-[11px] outline-none uppercase"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={createSpace}
                    disabled={loading || !newName.trim() || !newSlug.trim()}
                    className="retro-button w-full py-1 text-[11px] flex items-center justify-center gap-2"
                  >
                    <Plus size={12} /> Register Space
                  </button>
                </div>

                {/* Space List */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold block uppercase">Your Registered Spaces:</label>
                  <div className="window-sunken bg-white min-h-[150px] overflow-y-auto">
                    {spaces.length === 0 && !loading && (
                      <div className="p-8 text-center text-gray-400 italic text-[10px]">No spaces initialized.</div>
                    )}
                    {spaces.map((space) => (
                      <div key={space.id} className="border-b border-gray-100 p-2 hover:bg-blue-50 group">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-[11px] flex items-center gap-1">
                              {space.name} 
                              <span className="text-[9px] font-normal text-gray-500 bg-gray-100 px-1 border">
                                {space.slug}
                              </span>
                            </div>
                            <div className="text-[9px] text-gray-400 mt-1 font-mono flex items-center gap-1">
                              <Hash size={8} /> ID: {space.id}
                              <button 
                                onClick={() => copyToClipboard(space.id, space.id)}
                                className="opacity-0 group-hover:opacity-100 text-blue-600 hover:underline ml-1"
                              >
                                {copyId === space.id ? <Check size={8} /> : <Copy size={8} />}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => onSwitchSpace(space.slug)}
                            className="retro-button p-1"
                            title="Open Space"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-2 border-t-2 border-[#808080] flex justify-between items-center text-[10px] font-bold uppercase text-gray-600 bg-[#C0C0C0]">
             <span>Registered Spaces: {spaces.length}</span>
             <button type="button" onClick={onClose} className="retro-button px-4">Close</button>
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
