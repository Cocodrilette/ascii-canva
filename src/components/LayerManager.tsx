import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import type React from "react";
import { hasExtension } from "../extensions/registry";
import type { BaseElement } from "../extensions/types";
import {
  type LayerDirection,
  reorderElements,
  toggleElementLock,
  toggleElementVisibility,
} from "../utils/layers";

interface LayerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  elements: BaseElement[];
  setElements: React.Dispatch<React.SetStateAction<BaseElement[]>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onDeleteElement: (id: string) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  isOpen,
  onClose,
  elements,
  setElements,
  selectedIds,
  setSelectedIds,
  onDeleteElement,
}) => {
  if (!isOpen) return null;

  const handleToggleVisibility = (id: string) => {
    setElements((prev) => toggleElementVisibility(prev, id));
  };

  const handleToggleLock = (id: string) => {
    setElements((prev) => toggleElementLock(prev, id));
  };

  const handleMoveLayer = (id: string, direction: LayerDirection) => {
    setElements((prev) => reorderElements(prev, id, direction));
  };

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl) {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <div className="fixed top-24 right-6 z-[150] w-72 glass-floating shadow-2xl flex flex-col max-h-[500px] border-white/30 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/20">
        <span className="font-bold text-sm tracking-tight text-zinc-800">Layers</span>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-hidden">
        <div className="bg-white/30 rounded-2xl border border-white/50 overflow-hidden shadow-inner flex-1 flex flex-col min-h-[140px]">
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-[10px] border-collapse">
              <thead className="sticky top-0 bg-white/40 backdrop-blur-xl border-b border-white/40 z-10">
                <tr className="text-left text-[9px] font-black uppercase tracking-tighter text-zinc-400">
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Element</th>
                  <th className="px-4 py-3 text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {[...elements].reverse().map((el, revIdx) => {
                  const idx = elements.length - 1 - revIdx;
                  const isSelected = selectedIds.includes(el.id);
                  return (
                    <tr
                      key={el.id}
                      className={`group hover:bg-white/40 transition-colors cursor-default ${
                        isSelected ? "bg-white/60 font-bold" : ""
                      }`}
                      onClick={(e) => handleRowClick(e, el.id)}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(el.id);
                            }}
                            className={`transition-colors ${el.hidden ? "text-zinc-400" : "text-blue-600"}`}
                            title={el.hidden ? "Show" : "Hide"}
                          >
                            {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(el.id);
                            }}
                            className={`transition-colors ${el.locked ? "text-red-500" : "text-zinc-400 hover:text-zinc-900"}`}
                            title={el.locked ? "Unlock" : "Lock"}
                          >
                            {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className={`text-[11px] ${isSelected ? "text-zinc-900" : "text-zinc-700"}`}>
                            {el.type.toLowerCase()}
                            {!hasExtension(el.type) && (
                              <span className="text-red-500 ml-1 font-black">(!)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveLayer(el.id, "up");
                            }}
                            disabled={idx === elements.length - 1}
                            className="p-1 hover:bg-white rounded-md text-zinc-400 hover:text-zinc-900 disabled:opacity-0"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveLayer(el.id, "down");
                            }}
                            disabled={idx === 0}
                            className="p-1 hover:bg-white rounded-md text-zinc-400 hover:text-zinc-900 disabled:opacity-0"
                          >
                            <ChevronDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteElement(el.id);
                            }}
                            className="p-1 hover:bg-red-50 rounded-md text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {elements.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-zinc-400 text-[11px] italic">No elements yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedIds.length === 1 && (
          <div className="flex gap-2 p-1 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => handleMoveLayer(selectedIds[0], "back")}
              className="genesis-button flex-1 h-8 text-[10px] font-semibold justify-center"
            >
              <ArrowDownToLine size={12} /> Send Back
            </button>
            <button
              type="button"
              onClick={() => handleMoveLayer(selectedIds[0], "front")}
              className="genesis-button genesis-button-primary flex-1 h-8 text-[10px] font-semibold justify-center"
            >
              <ArrowUpToLine size={12} /> Bring Front
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/40 border-t border-white/20 flex justify-between items-center text-[10px] font-medium text-zinc-400">
        <span>{elements.length} elements</span>
      </div>
    </div>
  );
};

export default LayerManager;
