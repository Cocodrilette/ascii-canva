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
  Home,
  ExternalLink,
  ArrowRight,
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
    <div className="relative group my-8">
      <div className="absolute -inset-2 bg-linear-to-r from-blue-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between px-4 py-3 bg-white/40 border-b border-white/60">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {language}
            </div>
            <Code size={12} className="text-zinc-400" />
          </div>
        </div>

        <div className="p-2">
          <SyntaxHighlighter
            language={language}
            style={theme}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              background: "transparent",
              fontSize: "13px",
              lineHeight: "1.7",
              fontFamily: "'Inter', system-ui, sans-serif",
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
    <div className="min-h-screen bg-[#f1f5f9] p-6 md:p-12 overflow-auto relative">
      <Head>
        <title>Documentation | ascii_canva</title>
      </Head>

      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-blue-500/5 blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] -z-10" />

      <div className="max-w-4xl mx-auto space-y-16 pb-24">
        {/* Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Link
              href="/space"
              className="genesis-button h-10 px-5 border-zinc-200"
            >
              <ChevronLeft size={16} />
              <span>Workspace</span>
            </Link>
            <Link
              href="/"
              className="genesis-button h-10 px-5 border-zinc-200"
            >
              <Home size={16} />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900">
              Extensions
            </h1>
            <p className="text-xl text-zinc-500 leading-relaxed font-medium max-w-2xl">
              A modular system that allows you to share and install components 
              instantly through the community marketplace.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center">
              <Puzzle size={24} className="text-zinc-900" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Marketplace</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Browse and install community-created extensions without an account.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center">
              <Zap size={24} className="text-zinc-900" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Auto-Install</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Missing extensions are automatically detected and installed when you join a space.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center">
              <Download size={24} className="text-zinc-900" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Instant Updates</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Extensions are updated at runtime, ensuring you always have the latest version.
            </p>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Implementation
          </h2>

          <div className="space-y-12">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-zinc-900">Pattern</h3>
              <p className="text-sm text-zinc-500">
                Extensions are defined as a function that accepts icons and returns the extension object.
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
              <h3 className="font-semibold text-lg text-zinc-900">Registry</h3>
              <p className="text-sm text-zinc-500">
                The registry manages extension availability across your workspace.
              </p>
              <ModernCodeBlock
                code={`class ExtensionRegistry {
  private extensions: Record<string, AsciiExtension> = { ...builtins };

  register(extension: AsciiExtension) {
    this.extensions[extension.type] = extension;
  }
}`}
              />
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            API Reference
          </h2>

          <div className="space-y-8">
            <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">
              Automate your canvas by pushing elements programmatically.
            </p>

            <div className="bg-zinc-900 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">POST</span>
                  <code className="text-zinc-100 text-sm font-mono">/api/spaces/[id]/elements</code>
                </div>
                <div className="h-px bg-zinc-800 w-full" />
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  X-API-KEY: your_key
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ModernCodeBlock
                language="javascript"
                code={`await fetch('/api/spaces/ABCD/elements', {
  method: 'POST',
  headers: {
    'X-API-KEY': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'box',
    x: 20,
    y: 10,
    params: { width: 10, height: 5 }
  })
});`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-6 pt-16 border-t border-zinc-100">
          <p className="text-sm text-zinc-400 font-medium tracking-tight">
            © 2026 ascii_canva
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
