import { Copy, Download, FileText, RefreshCw } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { translateCanvasToAscii } from "../utils/ascii";

/**
 * AsciiEditor component that allows text input, canvas rendering,
 * and translation to ASCII format.
 */
const AsciiEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("ASCII ART");
  const [ascii, setAscii] = useState("");
  const [resolution, setResolution] = useState(100);
  const [fontSize, setFontSize] = useState(48);

  // Redraw canvas whenever text or font size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text in black
    ctx.fillStyle = "black";
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Split text by newlines and draw each line
    const lines = text.split("\n");
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
  }, [text, fontSize]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const asciiOutput = translateCanvasToAscii(canvas, resolution);
    setAscii(asciiOutput);
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
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-6">
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 dark:bg-zinc-900/60 dark:border-zinc-800/50 dark:shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" /> Text to ASCII
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="text-input"
              className="text-sm font-medium opacity-70"
            >
              Enter text
            </label>
            <textarea
              id="text-input"
              className="w-full h-32 p-3 bg-white/40 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="canvas-preview"
              className="text-sm font-medium opacity-70"
            >
              Canvas Preview
            </label>
            <div
              id="canvas-preview"
              className="border border-black/10 rounded-xl overflow-hidden bg-white"
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="resolution-input"
              className="text-xs font-medium opacity-60"
            >
              Resolution (Width)
            </label>
            <input
              id="resolution-input"
              type="range"
              min="20"
              max="200"
              step="10"
              value={resolution}
              onChange={(e) => setResolution(parseInt(e.target.value, 10))}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="font-size-input"
              className="text-xs font-medium opacity-60"
            >
              Font Size
            </label>
            <input
              id="font-size-input"
              type="range"
              min="10"
              max="100"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-32"
            />
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="ml-auto flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Translate to ASCII
          </button>
        </div>
      </div>

      {ascii && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 dark:bg-zinc-900/60 dark:border-zinc-800/50 dark:shadow-2xl animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">ASCII Result</h3>
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
          <pre className="bg-black text-white p-4 rounded-xl overflow-x-auto font-mono text-[10px] leading-[8px]">
            {ascii}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AsciiEditor;
