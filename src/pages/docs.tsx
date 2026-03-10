import {
  Book,
  ChevronLeft,
  Code,
  Layers,
  Share2,
  Terminal,
  Puzzle,
  Download,
  Zap,
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
        <div className="window-raised shadow-lg overflow-hidden border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080]">
          <div className="title-bar bg-[#000080] text-white">
            <div className="flex items-center gap-2">
              <Book size={14} />
              <span className="font-['VT323']">README.TXT</span>
            </div>
          </div>
          <div className="p-6 space-y-4 font-['MS_Sans_Serif'] text-[11px]">
            <h1 className="text-2xl font-bold tracking-tight uppercase font-['VT323']">
              Dynamic Extension System
            </h1>
            <p className="opacity-80 leading-relaxed">
              ascii_canva features a powerful, decentralized extension system that allows users to share components 
              and install them instantly via a community marketplace.
            </p>
          </div>
        </div>

        {/* New System Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="window-raised p-4 space-y-3 border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080]">
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] border-b border-[#808080] pb-2 mb-4 font-['MS_Sans_Serif']">
              <Puzzle size={14} className="text-[#000080]" />
              <span>Marketplace</span>
            </div>
            <p className="text-[10px] leading-relaxed font-['MS_Sans_Serif']">
              Browse and install community-created extensions. No login required—installation state is saved in your local workspace.
            </p>
          </div>
          <div className="window-raised p-4 space-y-3 border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080]">
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] border-b border-[#808080] pb-2 mb-4 font-['MS_Sans_Serif']">
              <Zap size={14} className="text-[#000080]" />
              <span>Auto-Install</span>
            </div>
            <p className="text-[10px] leading-relaxed font-['MS_Sans_Serif']">
              When joining a shared space, the system automatically detects and installs any missing extensions required to render the canvas.
            </p>
          </div>
          <div className="window-raised p-4 space-y-3 border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080]">
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] border-b border-[#808080] pb-2 mb-4 font-['MS_Sans_Serif']">
              <Download size={14} className="text-[#000080]" />
              <span>Zero-Friction</span>
            </div>
            <p className="text-[10px] leading-relaxed font-['MS_Sans_Serif']">
              Extensions are evaluated at runtime using a secure execution context, allowing for instant updates without application rebuilds.
            </p>
          </div>
        </div>

        {/* Dynamic Registry Section */}
        <div className="window-raised shadow-md border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080]">
          <div className="title-bar bg-[#000080] text-white">
            <div className="flex items-center gap-2">
              <Code size={14} />
              <span className="font-['VT323']">REGISTRY.TS - DYNAMIC ARCHITECTURE</span>
            </div>
          </div>
          <div className="p-4 bg-white/50">
            <p className="text-[10px] mb-4 font-['MS_Sans_Serif']">
              The <code>ExtensionRegistry</code> now supports runtime registration. Use <code>hasExtension(type)</code> to verify availability before rendering.
            </p>
            <ModernCodeBlock
              code={`class ExtensionRegistry {
  private extensions: Record<string, AsciiExtension> = { ...builtins };

  register(extension: AsciiExtension) {
    this.extensions[extension.type] = extension;
  }

  exists(type: string): boolean {
    return !!this.extensions[type];
  }

  get(type: string): AsciiExtension {
    return this.extensions[type];
  }
}`}
            />
          </div>
        </div>

        {/* Publishing Guide */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-bold uppercase text-sm px-2 font-['VT323']">
            <Terminal size={16} />
            <span>Publishing to Marketplace</span>
          </h2>

          <div className="window-sunken p-6 space-y-6 border-t-2 border-l-2 border-[#808080] border-r-2 border-b-2 border-white bg-white">
            <div className="space-y-4">
              <h3 className="font-bold text-[10px] uppercase border-b border-[#C0C0C0] pb-1 font-['MS_Sans_Serif']">
                1. Extension Format
              </h3>
              <p className="text-[10px] font-['MS_Sans_Serif'] opacity-80">
                Extensions must be written as an Immediately Invoked Function Expression (IIFE) that accepts <code>LucideIcons</code> and returns the extension object.
              </p>
              <ModernCodeBlock
                code={`(function(LucideIcons) {
  return {
    type: "diamond",
    label: "Diamond",
    icon: LucideIcons.Gem,
    create: (x, y) => ({ ... }),
    render: (ctx, el, selected, size) => { ... },
    toAscii: (el, grid, offset) => { ... }
  };
})(LucideIcons)`}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-[10px] uppercase border-b border-[#C0C0C0] pb-1 font-['MS_Sans_Serif']">
                2. Deployment
              </h3>
              <p className="text-[10px] font-['MS_Sans_Serif'] opacity-80">
                Navigate to the <strong>Marketplace</strong>, click the <strong>Publish</strong> tab, and paste your code. 
                Your extension will be instantly available to all users.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center p-8">
          <p className="ui-label opacity-40 uppercase tracking-widest font-['MS_Sans_Serif'] text-[9px]">
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
