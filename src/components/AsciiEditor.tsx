import { Copy, FileText, GripHorizontal, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoxElement } from "../extensions/builtin/box";
import type { TextElement } from "../extensions/builtin/text";
import { getAllExtensions, getExtension } from "../extensions/registry";
import type { BaseElement } from "../extensions/types";

const CELL_SIZE = 14;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;

const AsciiEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<BaseElement[]>([
    getExtension("text").create(100, 100, { text: "GENESIS ASCII" }),
    getExtension("box").create(100, 100, { width: 20, height: 6 }),
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [capturedIds, setCapturedIds] = useState<string[]>([]);

  const [ascii, setAscii] = useState("");
  const [showAscii, setShowAscii] = useState(false);
  const [newText, setNewText] = useState("");
  const [zoom, setZoom] = useState(1);
  const [touchDist, setTouchDist] = useState<number | null>(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);

  const visualCellSize = CELL_SIZE * zoom;

  const getGridCoords = useCallback(
    (clientX: number, clientY: number) => {
      const x = Math.floor((clientX - viewOffset.x) / visualCellSize);
      const y = Math.floor((clientY - viewOffset.y) / visualCellSize);
      return { x, y };
    },
    [viewOffset, visualCellSize],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const isInside = useCallback((child: BaseElement, parent: BaseElement) => {
    if (child.id === parent.id) return false;
    const childBounds = getExtension(child.type).getBounds(child);
    const parentBounds = getExtension(parent.type).getBounds(parent);
    return (
      childBounds.left >= parentBounds.left &&
      childBounds.right <= parentBounds.right &&
      childBounds.top >= parentBounds.top &&
      childBounds.bottom <= parentBounds.bottom
    );
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    if (
      canvas.width !== window.innerWidth ||
      canvas.height !== window.innerHeight
    ) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);

    // Grid
    ctx.strokeStyle = "#F0F0F0";
    ctx.lineWidth = 1;
    const startCol = Math.floor(-viewOffset.x / visualCellSize);
    const endCol = startCol + Math.ceil(canvas.width / visualCellSize) + 1;
    const startRow = Math.floor(-viewOffset.y / visualCellSize);
    const endRow = startRow + Math.ceil(canvas.height / visualCellSize) + 1;

    ctx.beginPath();
    for (let i = startCol; i <= endCol; i++) {
      ctx.moveTo(i * visualCellSize, startRow * visualCellSize);
      ctx.lineTo(i * visualCellSize, endRow * visualCellSize);
    }
    for (let j = startRow; j <= endRow; j++) {
      ctx.moveTo(startCol * visualCellSize, j * visualCellSize);
      ctx.lineTo(endCol * visualCellSize, j * visualCellSize);
    }
    ctx.stroke();

    // Culling and Rendering
    const visibleElements = elements.filter((el) => {
      const ext = getExtension(el.type);
      const b = ext.getBounds(el);
      const screenX = b.left * visualCellSize + viewOffset.x;
      const screenY = b.top * visualCellSize + viewOffset.y;
      const screenW = (b.right - b.left) * visualCellSize;
      const screenH = (b.bottom - b.top) * visualCellSize;
      return (
        screenX + screenW > 0 &&
        screenX < canvas.width &&
        screenY + screenH > 0 &&
        screenY < canvas.height
      );
    });

    const sortedElements = [...visibleElements].sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === "box" ? -1 : 1;
    });

    for (const el of sortedElements) {
      const ext = getExtension(el.type);
      ext.render(ctx, el, el.id === selectedId, visualCellSize);
    }

    ctx.restore();
  }, [elements, selectedId, visualCellSize, viewOffset]);

  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      draw();
      animationFrameId = window.requestAnimationFrame(render);
    };
    animationFrameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [draw]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
    setCapturedIds([]);
  }, []);
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);

      // Logic to select element under right-click if not already selected
      const clickedEl = [...elements]
        .sort((a, b) => {
          if (a.type === b.type) return 0;
          return a.type === "box" ? -1 : 1;
        })
        .reverse()
        .find((el) => {
          const ext = getExtension(el.type);
          const b = ext.getBounds(el);
          return (
            gridX >= b.left &&
            gridX < b.right &&
            gridY >= b.top &&
            gridY < b.bottom
          );
        });

      if (clickedEl) {
        setSelectedId(clickedEl.id);
        setContextMenu({ x: e.clientX, y: e.clientY, elementId: clickedEl.id });
      } else {
        setSelectedId(null);
        setContextMenu(null);
      }
    },
    [elements, getGridCoords],
  );
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);

      if (isResizing && selectedId) {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id === selectedId && el.type === "box") {
              const box = el as BoxElement;
              const newWidth = Math.max(2, gridX - box.x + 1);
              const newHeight = Math.max(2, gridY - box.y + 1);
              const children = prev.filter((child) => isInside(child, box));
              if (children.length > 0) {
                const minR = Math.max(
                  ...children.map(
                    (c) => getExtension(c.type).getBounds(c).right,
                  ),
                );
                const minB = Math.max(
                  ...children.map(
                    (c) => getExtension(c.type).getBounds(c).bottom,
                  ),
                );
                return {
                  ...box,
                  width: Math.max(newWidth, minR - box.x),
                  height: Math.max(newHeight, minB - box.y),
                };
              }
              return { ...box, width: newWidth, height: newHeight };
            }
            return el;
          }),
        );
      } else if (isDragging && selectedId) {
        const dx = gridX - dragOffset.x;
        const dy = gridY - dragOffset.y;
        if (dx !== 0 || dy !== 0) {
          setElements((prev) =>
            prev.map((el) => {
              if (el.id === selectedId || capturedIds.includes(el.id)) {
                return { ...el, x: el.x + dx, y: el.y + dy };
              }
              return el;
            }),
          );
          setDragOffset({ x: gridX, y: gridY });
        }
      } else if (isPanning) {
        setViewOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [
      isDragging,
      isResizing,
      isPanning,
      selectedId,
      getGridCoords,
      dragOffset,
      panStart,
      capturedIds,
      isInside,
    ],
  );

  const handleTouchEnd = useCallback(() => {
    setTouchDist(null);
    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
    setCapturedIds([]);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && touchDist !== null) {
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY,
        );
        const delta = dist / touchDist;
        setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta)));
        setTouchDist(dist);
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const { x: gridX, y: gridY } = getGridCoords(
          touch.clientX,
          touch.clientY,
        );

        if (isResizing && selectedId) {
          setElements((prev) =>
            prev.map((el) => {
              if (el.id === selectedId && el.type === "box") {
                const box = el as BoxElement;
                const newWidth = Math.max(2, gridX - box.x + 1);
                const newHeight = Math.max(2, gridY - box.y + 1);
                const children = prev.filter((child) => isInside(child, box));
                if (children.length > 0) {
                  const minR = Math.max(
                    ...children.map(
                      (c) => getExtension(c.type).getBounds(c).right,
                    ),
                  );
                  const minB = Math.max(
                    ...children.map(
                      (c) => getExtension(c.type).getBounds(c).bottom,
                    ),
                  );
                  return {
                    ...box,
                    width: Math.max(newWidth, minR - box.x),
                    height: Math.max(newHeight, minB - box.y),
                  };
                }
                return { ...box, width: newWidth, height: newHeight };
              }
              return el;
            }),
          );
        } else if (isDragging && selectedId) {
          const dx = gridX - dragOffset.x;
          const dy = gridY - dragOffset.y;
          if (dx !== 0 || dy !== 0) {
            setElements((prev) =>
              prev.map((el) =>
                el.id === selectedId || capturedIds.includes(el.id)
                  ? { ...el, x: el.x + dx, y: el.y + dy }
                  : el,
              ),
            );
            setDragOffset({ x: gridX, y: gridY });
          }
        } else if (isPanning) {
          setViewOffset({
            x: touch.clientX - panStart.x,
            y: touch.clientY - panStart.y,
          });
        }
      }
    },
    [
      isDragging,
      isResizing,
      isPanning,
      selectedId,
      getGridCoords,
      dragOffset,
      panStart,
      capturedIds,
      touchDist,
      isInside,
    ],
  );

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    } else {
      setViewOffset((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas?.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      canvas?.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    closeContextMenu();
    const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);
    const selected = elements.find((el) => el.id === selectedId);

    if (selected?.type === "box") {
      const box = selected as BoxElement;
      const handleX = (box.x + box.width) * visualCellSize + viewOffset.x;
      const handleY = (box.y + box.height) * visualCellSize + viewOffset.y;
      if (
        Math.abs(e.clientX - handleX) < 15 &&
        Math.abs(e.clientY - handleY) < 15
      ) {
        setIsResizing(true);
        return;
      }
    }

    // Selection logic
    const clickedEl = [...elements]
      .sort((a, b) => {
        if (a.type === b.type) return 0;
        return a.type === "box" ? -1 : 1;
      })
      .reverse()
      .find((el) => {
        const ext = getExtension(el.type);
        const b = ext.getBounds(el);
        return (
          gridX >= b.left &&
          gridX < b.right &&
          gridY >= b.top &&
          gridY < b.bottom
        );
      });

    if (clickedEl) {
      setSelectedId(clickedEl.id);
      setIsDragging(true);
      setDragOffset({ x: gridX, y: gridY });
      if (clickedEl.type === "box") {
        const children = elements.filter((el) => isInside(el, clickedEl));
        setCapturedIds(children.map((c) => c.id));
      } else {
        setCapturedIds([]);
      }
    } else {
      setSelectedId(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY,
      );
      setTouchDist(dist);
    } else if (e.touches.length === 1) {
      closeContextMenu();
      const touch = e.touches[0];
      const { x: gridX, y: gridY } = getGridCoords(
        touch.clientX,
        touch.clientY,
      );
      const selected = elements.find((el) => el.id === selectedId);
      if (selected?.type === "box") {
        const box = selected as BoxElement;
        const handleX = (box.x + box.width) * visualCellSize + viewOffset.x;
        const handleY = (box.y + box.height) * visualCellSize + viewOffset.y;
        if (
          Math.abs(touch.clientX - handleX) < 30 &&
          Math.abs(touch.clientY - handleY) < 30
        ) {
          setIsResizing(true);
          return;
        }
      }
      const clickedEl = [...elements]
        .sort((a, b) => {
          if (a.type === b.type) return 0;
          return a.type === "box" ? -1 : 1;
        })
        .reverse()
        .find((el) => {
          const ext = getExtension(el.type);
          const b = ext.getBounds(el);
          return (
            gridX >= b.left &&
            gridX < b.right &&
            gridY >= b.top &&
            gridY < b.bottom
          );
        });
      if (clickedEl) {
        setSelectedId(clickedEl.id);
        setIsDragging(true);
        setDragOffset({ x: gridX, y: gridY });
        if (clickedEl.type === "box") {
          const children = elements.filter((el) => isInside(el, clickedEl));
          setCapturedIds(children.map((c) => c.id));
        } else {
          setCapturedIds([]);
        }
      } else {
        setSelectedId(null);
        setIsPanning(true);
        setPanStart({
          x: touch.clientX - viewOffset.x,
          y: touch.clientY - viewOffset.y,
        });
      }
    }
  };

  const addExtensionElement = (type: string) => {
    const ext = getExtension(type);
    const newEl = ext.create(
      Math.floor((window.innerWidth / 2 - viewOffset.x) / visualCellSize),
      Math.floor((window.innerHeight / 2 - viewOffset.y) / visualCellSize),
      type === "text" ? { text: newText.trim() || "NEW TEXT" } : {},
    );
    setElements([...elements, newEl]);
    setNewText("");
    setSelectedId(newEl.id);
  };

  const updateSelectedText = (text: string) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedId && el.type === "text"
          ? { ...(el as TextElement), text }
          : el,
      ),
    );
  };

  const deleteSelected = useCallback(
    (id?: string) => {
      const targetId = id || selectedId;
      if (!targetId) return;
      setElements((prev) => prev.filter((el) => el.id !== targetId));
      if (targetId === selectedId) {
        setSelectedId(null);
      }
    },
    [selectedId],
  );
  const generateAscii = () => {
    if (elements.length === 0) return;
    const bounds = elements.map((el) => getExtension(el.type).getBounds(el));
    const minX = Math.min(...bounds.map((b) => b.left));
    const maxX = Math.max(...bounds.map((b) => b.right));
    const minY = Math.min(...bounds.map((b) => b.top));
    const maxY = Math.max(...bounds.map((b) => b.bottom));

    const width = maxX - minX;
    const height = maxY - minY;
    const grid: string[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => " "),
    );

    for (const el of elements) {
      getExtension(el.type).toAscii(el, grid, { x: minX, y: minY });
    }

    setAscii(grid.map((row) => row.join("")).join("\n"));
    setShowAscii(true);
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--os-bg)] select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onContextMenu={handleContextMenu}
        className="w-full h-full block cursor-default"
      />
      <div className="absolute top-4 left-4 window-raised flex flex-col z-50 min-w-[260px] shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
        <div className="title-bar cursor-default">
          <span className="flex items-center gap-2 font-bold">
            Genesis_ASCII.exe
          </span>
          <button
            type="button"
            className="retro-button px-1 py-0 leading-none h-4 w-4 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>
        <div className="p-2 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="text-content-input" className="ui-label">
              Text Content
            </label>
            <div className="flex gap-1">
              <input
                id="text-content-input"
                type="text"
                value={
                  selectedElement?.type === "text"
                    ? (selectedElement as TextElement).text
                    : newText
                }
                onChange={(e) =>
                  selectedElement?.type === "text"
                    ? updateSelectedText(e.target.value)
                    : setNewText(e.target.value)
                }
                placeholder="Enter text..."
                className="retro-input flex-1"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !selectedId &&
                  addExtensionElement("text")
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--os-border-dark)] border-b border-[var(--os-border-light)] pb-2 relative">
            <div className="absolute -top-[1px] left-0 right-0 h-[1px] bg-[var(--os-border-light)]" />
            <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] bg-[var(--os-border-dark)]" />

            {getAllExtensions().map((ext) => (
              <button
                key={ext.type}
                type="button"
                onClick={() => addExtensionElement(ext.type)}
                className="retro-button flex items-center gap-1"
                title={`Add ${ext.label}`}
              >
                <ext.icon className="w-3 h-3" /> {ext.label}
              </button>
            ))}

            {selectedId && (
              <button
                type="button"
                onClick={() => deleteSelected()}
                className="retro-button flex items-center gap-1"
                title="Delete selected"
              >
                {" "}
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={generateAscii}
            className="retro-button flex items-center justify-center gap-2 mt-1 py-1"
          >
            <GripHorizontal className="w-3 h-3" /> Export ASCII
          </button>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed window-raised z-[110] shadow-[2px_2px_0_rgba(0,0,0,0.5)] p-[2px] min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
          role="menu"
        >
          {" "}
          <button
            type="button"
            onClick={() => {
              deleteSelected(contextMenu.elementId);
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-1 ui-label hover:bg-[var(--os-titlebar)] hover:text-white flex items-center gap-2"
          >
            {" "}
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}

      {showAscii && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent">
          <div className="window-raised w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[4px_4px_0_rgba(0,0,0,0.5)] m-4">
            <div className="title-bar cursor-default">
              <span className="flex items-center gap-2 font-bold">
                <FileText className="w-3 h-3" /> ASCII_Manifest.txt
              </span>
              <button
                type="button"
                onClick={() => setShowAscii(false)}
                className="retro-button px-1 py-0 leading-none h-4 w-4 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-2 flex-1 flex flex-col gap-2 overflow-hidden bg-[var(--os-bg)]">
              <div className="window-sunken flex-1 overflow-auto p-2">
                <pre className="terminal-output whitespace-pre m-0 min-h-full">
                  {ascii}
                </pre>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(ascii)}
                  className="retro-button flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => setShowAscii(false)}
                  className="retro-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsciiEditor;
