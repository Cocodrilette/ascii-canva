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
} from "lucide-react";
import type React from "react";
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
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onDeleteElement: (id: string) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  isOpen,
  onClose,
  elements,
  setElements,
  selectedId,
  setSelectedId,
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

  return (
    <div className="fixed top-20 right-4 z-[150] w-64 shadow-[4px_4px_0_rgba(0,0,0,0.5)] window-raised">
      <div className="title-bar cursor-default">
        <span className="flex items-center gap-2 font-bold">
          <Layers className="w-3 h-3" /> Explorer.exe
        </span>
        <button
          type="button"
          onClick={onClose}
          className="retro-button px-1 py-0 leading-none h-4 w-4 flex items-center justify-center font-bold"
        >
          ✕
        </button>
      </div>

      <div className="p-2 bg-[var(--os-bg)] flex flex-col gap-2 max-h-[400px]">
        <div className="window-sunken bg-white flex-1 overflow-y-auto min-h-[100px]">
          <table className="w-full text-[10px] border-collapse">
            <thead className="sticky top-0 bg-gray-100 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="p-1 text-left w-8">Vis</th>
                <th className="p-1 text-left w-8">Lck</th>
                <th className="p-1 text-left">Element</th>
                <th className="p-1 text-right w-16">Z-Pos</th>
              </tr>
            </thead>
            <tbody>
              {[...elements].reverse().map((el, revIdx) => {
                const idx = elements.length - 1 - revIdx;
                const isSelected = el.id === selectedId;
                return (
                  <tr
                    key={el.id}
                    className={`border-b border-gray-50 hover:bg-blue-50 cursor-default ${
                      isSelected ? "bg-blue-100 font-bold" : ""
                    }`}
                    onClick={() => setSelectedId(el.id)}
                  >
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(el.id);
                        }}
                        className="hover:text-blue-600"
                        title={el.hidden ? "Show" : "Hide"}
                      >
                        {el.hidden ? (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </td>
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLock(el.id);
                        }}
                        className="hover:text-blue-600"
                        title={el.locked ? "Unlock" : "Lock"}
                      >
                        {el.locked ? (
                          <Lock className="w-3 h-3 text-red-500" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </button>
                    </td>
                    <td className="p-1 truncate">
                      <span className="opacity-70 mr-1">#{idx}</span>
                      {el.type.toUpperCase()}
                    </td>
                    <td className="p-1 text-right flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        className="hover:text-red-600 mr-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(el.id, "up");
                        }}
                        disabled={idx === elements.length - 1}
                        className="disabled:opacity-20"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(el.id, "down");
                        }}
                        disabled={idx === 0}
                        className="disabled:opacity-20"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {elements.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center italic text-gray-400">
                    Empty Canvas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedId && (
          <div className="flex gap-1 justify-between p-1 bg-gray-100 border border-[var(--os-border-dark)]">
            <button
              type="button"
              onClick={() => handleMoveLayer(selectedId, "back")}
              className="retro-button px-2 py-1 text-[9px] flex items-center gap-1"
              title="Send to Back"
            >
              <ArrowDownToLine className="w-3 h-3" /> Back
            </button>
            <button
              type="button"
              onClick={() => handleMoveLayer(selectedId, "front")}
              className="retro-button px-2 py-1 text-[9px] flex items-center gap-1"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3 h-3" /> Front
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerManager;
