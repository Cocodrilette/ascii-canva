import React, { useState } from "react";
import { X, Puzzle, Download, Plus, Check } from "lucide-react";
import { useExtensions } from "../hooks/useExtensions";
import { supabase } from "../lib/supabase";

interface MarketplaceProps {
  onClose: () => void;
}

export const ExtensionMarketplace: React.FC<MarketplaceProps> = ({ onClose }) => {
  const { loading, extensions, installedIds, installExtension, publishExtension } = useExtensions();
  const [view, setView] = useState<"browse" | "publish">("browse");
  const [newExt, setNewExt] = useState({
    name: "",
    description: "",
    type: "",
    icon: "Puzzle",
    code: "(function() { \n  return { \n    type: 'custom', \n    label: 'Custom', \n    render: (ctx, el, sel, size) => { ctx.strokeRect(el.x*size, el.y*size, size, size); }, \n    getBounds: (el) => ({ left: el.x, top: el.y, right: el.x+1, bottom: el.y+1 }), \n    toAscii: (el, grid, off) => { grid[el.y-off.y][el.x-off.x] = '*'; }, \n    create: (x, y) => ({ id: Math.random().toString(36), type: 'custom', x, y })\n  };\n})()",
  });

  const handlePublish = async () => {
    try {
      await publishExtension(newExt);
      alert("Extension published successfully!");
      setView("browse");
    } catch (err) {
      console.error(err);
      alert("Failed to publish extension");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] font-['MS_Sans_Serif']">
      <div className="w-[600px] h-[500px] flex flex-col border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] bg-[#C0C0C0] shadow-xl">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white flex items-center justify-between px-2 py-1 select-none">
          <div className="flex items-center gap-2">
            <Puzzle size={14} />
            <span className="text-[13px] font-['VT323']">Extension Marketplace</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] flex items-center justify-center text-black active:border-inset p-0"
          >
            <X size={10} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-[#C0C0C0]">
          <button
            onClick={() => setView("browse")}
            className={`px-4 py-1 text-[11px] ${
              view === "browse"
                ? "bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-0 border-b-0"
                : "bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] active:border-inset"
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setView("publish")}
            className={`px-4 py-1 text-[11px] ${
              view === "publish"
                ? "bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-0 border-b-0"
                : "bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] active:border-inset"
            }`}
          >
            Publish
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white mx-2 mb-2 border-t-2 border-l-2 border-[#808080] border-r-2 border-b-2 border-white overflow-y-auto p-4">
          {view === "browse" ? (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading extensions...</div>
              ) : (
                extensions.map((ext) => (
                  <div key={ext.id} className="flex items-center justify-between p-3 border-b border-[#C0C0C0]">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-[#C0C0C0] border-t border-l border-white border-r-2 border-b-2 border-[#808080]">
                         <Puzzle size={24} />
                       </div>
                       <div>
                         <h3 className="text-sm font-bold">{ext.name}</h3>
                         <p className="text-xs text-[#808080]">{ext.description}</p>
                         <p className="text-[10px] text-[#000080]">Type: {ext.type}</p>
                       </div>
                    </div>
                    <button
                      disabled={installedIds.has(ext.id)}
                      onClick={() => installExtension(ext.id)}
                      className={`flex items-center gap-2 px-3 py-1 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] active:border-inset text-[11px] ${
                        installedIds.has(ext.id) ? "opacity-50 cursor-default" : ""
                      }`}
                    >
                      {installedIds.has(ext.id) ? (
                        <>
                          <Check size={14} /> Installed
                        </>
                      ) : (
                        <>
                          <Download size={14} /> Install
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px]">Extension Name:</label>
                <input
                  type="text"
                  className="px-2 py-1 border-t-2 border-l-2 border-[#808080] border-r border-b border-[#C0C0C0] outline-none text-[11px]"
                  value={newExt.name}
                  onChange={(e) => setNewExt({ ...newExt, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px]">Description:</label>
                <textarea
                  className="px-2 py-1 border-t-2 border-l-2 border-[#808080] border-r border-b border-[#C0C0C0] outline-none text-[11px] h-16"
                  value={newExt.description}
                  onChange={(e) => setNewExt({ ...newExt, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px]">Unique Type:</label>
                <input
                  type="text"
                  className="px-2 py-1 border-t-2 border-l-2 border-[#808080] border-r border-b border-[#C0C0C0] outline-none text-[11px]"
                  value={newExt.type}
                  placeholder="e.g. custom-star"
                  onChange={(e) => setNewExt({ ...newExt, type: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px]">Logic (JavaScript):</label>
                <textarea
                  className="px-2 py-1 border-t-2 border-l-2 border-[#808080] border-r border-b border-[#C0C0C0] outline-none text-[11px] font-mono h-32"
                  value={newExt.code}
                  onChange={(e) => setNewExt({ ...newExt, code: e.target.value })}
                />
              </div>
              <button
                onClick={handlePublish}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] active:border-inset text-[11px]"
              >
                <Plus size={14} />
                Publish Extension
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 flex justify-end gap-2 bg-[#C0C0C0]">
           <button
             onClick={onClose}
             className="px-6 py-1 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] active:border-inset text-[11px]"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};
