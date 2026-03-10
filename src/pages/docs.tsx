import {
  Book,
  ChevronLeft,
  Code,
  Layers,
  Share2,
  Terminal,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors as theme } from "react-syntax-highlighter/dist/cjs/styles/prism";

function ModernCodeBlock({
  code,
  language = "typescript",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative group my-6">
      {/* Subtle modern glow */}
      <div className="absolute -inset-1 bg-linear-to-r from-gray-200 to-gray-100 rounded-xl blur-sm opacity-50"></div>

      <div className="relative bg-[#f6f8fa] rounded-lg border border-gray-200 overflow-hidden shadow-xl">
        {/* Modern GitHub-style header */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              {language}
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <Code size={10} className="text-gray-400" />
          </div>
        </div>

        <div className="p-0">
          <SyntaxHighlighter
            language={language}
            style={theme}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              background: "transparent",
              fontSize: "12px",
              lineHeight: "1.6",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

export default function Docs() {
  return (
    <div className="min-h-screen bg-(--os-bg) p-8 overflow-auto">
      <Head>
        <title>ascii_canva - Documentation</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link
            href="/space"
            className="retro-button flex items-center gap-2 no-underline"
          >
            <ChevronLeft size={14} />
            <span>Back to Workspace</span>
          </Link>
          <Link
            href="/"
            className="retro-button flex items-center gap-2 no-underline"
          >
            <span>Home</span>
          </Link>
          <div className="ui-label uppercase tracking-widest opacity-50">
            System Documentation v{process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"}
          </div>
        </div>

        {/* Header Window */}
        <div className="window-raised shadow-lg overflow-hidden">
          <div className="title-bar">
            <div className="flex items-center gap-2">
              <Book size={14} />
              <span>README.TXT</span>
            </div>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-(--os-bg) border border-(--os-border-dark)" />
              <div className="w-3 h-3 bg-(--os-bg) border border-(--os-border-dark) flex items-center justify-center text-[8px]">
                ✕
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold tracking-tight uppercase">
              Extension System Guide
            </h1>
            <p className="opacity-80 leading-relaxed">
              ascii_canva is built on a modular extension architecture. This
              document explains how to develop, test, and integrate new drawing
              primitives into the platform.
            </p>
          </div>
        </div>

        {/* Core Concepts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="window-raised p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold uppercase text-xs border-b border-(--os-border-dark) pb-2 mb-4">
              <Layers size={14} />
              <span>Core Primitives</span>
            </div>
            <p className="text-xs leading-relaxed">
              Every element on the grid is an extension. This includes basic
              text, boxes, and even complex vector paths. This abstraction
              allows for infinite expansion of the toolkit.
            </p>
          </div>
          <div className="window-raised p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold uppercase text-xs border-b border-(--os-border-dark) pb-2 mb-4">
              <Share2 size={14} />
              <span>Registry System</span>
            </div>
            <p className="text-xs leading-relaxed">
              Extensions are registered in a central registry, making them
              instantly available to the UI, the rendering engine, and the ASCII
              synchronization layer.
            </p>
          </div>
        </div>

        {/* Code Section */}
        <div className="window-raised shadow-md">
          <div className="title-bar">
            <div className="flex items-center gap-2">
              <Code size={14} />
              <span>EXTENSIONS/TYPES.TS</span>
            </div>
          </div>
          <div className="p-4 bg-white/50">
            <ModernCodeBlock
              code={`export interface AsciiExtension<T extends BaseElement, C = unknown> {
  type: string;          // Unique ID
  label: string;         // UI Display name
  icon: React.FC;        // UI Icon
  
  // Factory
  create: (x: number, y: number, params?: C) => T;
  
  // Rendering & Logic
  render: (ctx: CanvasRenderingContext2D, el: T, isSelected: boolean, size: number) => void;
  getBounds: (element: T) => { left: number, top: number, right: number, bottom: number };
  toAscii: (element: T, grid: string[][], offset: { x: number, y: number }) => void;
}`}
            />
          </div>
        </div>

        {/* Implementation Example */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-bold uppercase text-sm px-2">
            <Terminal size={16} />
            <span>Implementation Example: "Cross" Extension</span>
          </h2>

          <div className="window-sunken p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase border-b border-(--os-border-dark) pb-1">
                1. Define the Data Model
              </h3>
              <ModernCodeBlock
                code={`interface CrossElement extends BaseElement {
  type: "cross";
  size: number;
}`}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase border-b border-(--os-border-dark) pb-1">
                2. Implement the Logic
              </h3>
              <ModernCodeBlock
                code={`export const crossExtension: AsciiExtension<CrossElement> = {
  type: "cross",
  label: "Cross",
  icon: XIcon,
  create: (x, y) => ({
    id: Math.random().toString(36),
    type: "cross",
    x, y, size: 2
  }),
  render: (ctx, el, isSelected, cellSize) => {
    ctx.strokeStyle = isSelected ? "#000080" : "#000000";
    ctx.beginPath();
    // Logic to draw an 'X' on the canvas...
    ctx.stroke();
  },
  toAscii: (el, grid, offset) => {
    // Logic to write 'X' characters to the grid...
  }
};`}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase border-b border-(--os-border-dark) pb-1">
                3. Register Globally
              </h3>
              <p className="text-xs opacity-70">
                Add the export to <code>src/extensions/registry.ts</code>:
              </p>
              <ModernCodeBlock
                code={`export const extensions = {
  text: textExtension,
  box: boxExtension,
  cross: crossExtension, // Added here
};`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center p-8">
          <p className="ui-label opacity-40 uppercase tracking-widest">
            https://github.com/cocodrilette/ascii-canva
          </p>
        </div>
      </div>

      <style jsx global>{`
        body {
          overflow: auto !important;
        }
      `}</style>
    </div>
  );
}
