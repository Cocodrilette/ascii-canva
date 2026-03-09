import {
  Copy,
  Download,
  FileText,
  GripHorizontal,
  MousePointer2,
  Plus,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TextElement {
  id: string;
  text: string;
  x: number; // grid x
  y: number; // grid y
}

const GRID_COLS = 80;
const GRID_ROWS = 30;
const CELL_SIZE = 12; // visual size of a cell in pixels

/**
 * AsciiEditor component with grid-based element positioning.
 */
const AsciiEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<TextElement[]>([
    { id: "1", text: "HELLO WORLD", x: 5, y: 5 },
    { id: "2", text: "GRID EDITOR", x: 5, y: 10 },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [ascii, setAscii] = useState("");
  const [newText, setNewText] = useState("");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with light theme / dark theme background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_ROWS * CELL_SIZE);
      ctx.stroke();
    }
    for (let j = 0; j <= GRID_ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL_SIZE);
      ctx.lineTo(GRID_COLS * CELL_SIZE, j * CELL_SIZE);
      ctx.stroke();
    }

    // Draw elements
    ctx.font = `${CELL_SIZE}px monospace`;
    ctx.textBaseline = "top";

    for (const el of elements) {
      const isSelected = el.id === selectedId;

      // Highlight selection
      if (isSelected) {
        ctx.fillStyle = "rgba(0, 120, 255, 0.1)";
        ctx.fillRect(
          el.x * CELL_SIZE,
          el.y * CELL_SIZE,
          el.text.length * CELL_SIZE,
          CELL_SIZE,
        );
        ctx.strokeStyle = "rgba(0, 120, 255, 0.5)";
        ctx.strokeRect(
          el.x * CELL_SIZE,
          el.y * CELL_SIZE,
          el.text.length * CELL_SIZE,
          CELL_SIZE,
        );
      }

      ctx.fillStyle = isSelected ? "#0066ff" : "black";
      // Draw characters one by one to ensure alignment
      for (let i = 0; i < el.text.length; i++) {
        ctx.fillText(
          el.text[i],
          (el.x + i) * CELL_SIZE + CELL_SIZE * 0.2, // slight offset for centering char
          el.y * CELL_SIZE,
        );
      }
    }
  }, [elements, selectedId]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const gridX = Math.floor(mouseX / CELL_SIZE);
    const gridY = Math.floor(mouseY / CELL_SIZE);

    // Find clicked element
    const clickedEl = [...elements]
      .reverse()
      .find(
        (el) =>
          gridY === el.y && gridX >= el.x && gridX < el.x + el.text.length,
      );

    if (clickedEl) {
      setSelectedId(clickedEl.id);
      setIsDragging(true);
      setDragOffset({ x: gridX - clickedEl.x, y: gridY - clickedEl.y });
    } else {
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const gridX = Math.floor(mouseX / CELL_SIZE);
    const gridY = Math.floor(mouseY / CELL_SIZE);

    const newX = gridX - dragOffset.x;
    const newY = gridY - dragOffset.y;

    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedId ? { ...el, x: newX, y: newY } : el,
      ),
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addElement = () => {
    if (!newText.trim()) return;
    const newEl: TextElement = {
      id: Math.random().toString(36).substr(2, 9),
      text: newText,
      x: 2,
      y: 2,
    };
    setElements([...elements, newEl]);
    setNewText("");
    setSelectedId(newEl.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(elements.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const generateAscii = () => {
    const grid: string[][] = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => " "),
    );

    for (const el of elements) {
      for (let i = 0; i < el.text.length; i++) {
        const x = el.x + i;
        const y = el.y;
        if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
          grid[y][x] = el.text[i];
        }
      }
    }

    setAscii(grid.map((row) => row.join("")).join("\n"));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ascii);
  };

  const downloadAscii = () => {
    const blob = new Blob([ascii], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-art.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-6">
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 dark:bg-zinc-900/60 dark:border-zinc-800/50 dark:shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MousePointer2 className="w-6 h-6" /> Grid Canvas Editor
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add new text..."
              className="px-4 py-2 bg-white/40 border border-black/10 rounded-full focus:outline-none focus:ring-2 focus:ring-black/20"
              onKeyDown={(e) => e.key === "Enter" && addElement()}
            />
            <button
              type="button"
              onClick={addElement}
              className="p-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative border border-black/10 rounded-2xl overflow-hidden bg-white cursor-crosshair shadow-inner">
            <canvas
              ref={canvasRef}
              width={GRID_COLS * CELL_SIZE}
              height={GRID_ROWS * CELL_SIZE}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-auto block"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {selectedId && (
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-full transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete Selected
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={generateAscii}
              className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors font-bold"
            >
              <GripHorizontal className="w-4 h-4" /> Export ASCII
            </button>
          </div>
        </div>
      </div>

      {ascii && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 dark:bg-zinc-900/60 dark:border-zinc-800/50 dark:shadow-2xl animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 opacity-40" /> Generated ASCII
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={downloadAscii}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                title="Download as TXT"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          <pre className="bg-black text-white p-6 rounded-2xl overflow-x-auto font-mono text-[12px] leading-[12px] tracking-[0px]">
            {ascii}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AsciiEditor;
