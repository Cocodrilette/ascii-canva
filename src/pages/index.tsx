import Head from "next/head";
import Link from "next/link";
import { Terminal, Users, Layers, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-(--os-bg) flex items-center justify-center p-4">
      <Head>
        <title>ascii_canva | Retro ASCII Canvas</title>
        <meta name="description" content="A collaborative ASCII editor built for the retro future." />
      </Head>

      <div className="w-full max-w-3xl border-t-2 border-l-2 border-(--os-border-light) border-r-2 border-b-2 border-(--os-border-dark) bg-(--os-bg) shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
        {/* Title Bar */}
        <div className="bg-[var(--os-titlebar)] text-[var(--os-titlebar-text)] px-2 py-1 flex items-center justify-between font-['VT323'] text-sm">
          <div className="flex items-center gap-2">
            <Terminal size={14} />
            <span>ascii_canva_v{process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"}.exe</span>
          </div>
          <div className="flex gap-1">
            <button className="w-4 h-4 bg-(--os-bg) border-t border-l border-(--os-border-light) border-r border-b border-(--os-border-dark) text-black flex items-center justify-center text-[10px]">_</button>
            <button className="w-4 h-4 bg-(--os-bg) border-t border-l border-(--os-border-light) border-r border-b border-(--os-border-dark) text-black flex items-center justify-center text-[10px]">□</button>
            <button className="w-4 h-4 bg-(--os-bg) border-t border-l border-(--os-border-light) border-r border-b border-(--os-border-dark) text-black flex items-center justify-center text-[10px]">✕</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 font-['MS_Sans_Serif'] text-[11px] leading-relaxed">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-['VT323'] mb-2 tracking-tighter uppercase">ascii_canva</h1>
            <p className="text-[var(--os-titlebar)] font-bold italic">Simple Retro ASCII Workspace</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Feature 1 */}
            <div className="p-4 border-t-2 border-l-2 border-(--os-border-dark) border-r-2 border-b-2 border-(--os-border-light) bg-white">
              <div className="flex items-center gap-3 mb-2">
                <Terminal className="text-[var(--os-titlebar)]" size={20} />
                <h3 className="font-bold uppercase">ASCII Canvas</h3>
              </div>
              <p>Manipulate 8x8 character grids with surgical precision. Traditional glyphs meet modern logic.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 border-t-2 border-l-2 border-(--os-border-dark) border-r-2 border-b-2 border-(--os-border-light) bg-white">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-[var(--os-titlebar)]" size={20} />
                <h3 className="font-bold uppercase">Realtime Sync</h3>
              </div>
              <p>Powered by Supabase. Collaborate with your team in the terminal space with zero latency.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 border-t-2 border-l-2 border-(--os-border-dark) border-r-2 border-b-2 border-(--os-border-light) bg-white">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="text-[var(--os-titlebar)]" size={20} />
                <h3 className="font-bold uppercase">Extensible Tools</h3>
              </div>
              <p>Built-in support for Box, Text, and Vector extensions. Modular architecture for the future.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-4 border-t-2 border-l-2 border-(--os-border-dark) border-r-2 border-b-2 border-(--os-border-light) bg-white">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="text-[var(--os-titlebar)]" size={20} />
                <h3 className="font-bold uppercase">Retro UX</h3>
                </div>
              <p>Authentic Win95/MacOS 8 aesthetic. Low-overhead, high-impact visual performance.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link 
              href="/space" 
              className="px-8 py-3 bg-(--os-bg) border-t-2 border-l-2 border-(--os-border-light) border-r-2 border-b-2 border-(--os-border-dark) hover:bg-gray-100 active:border-t-2 active:border-l-2 active:border-(--os-border-dark) active:border-r-2 active:border-b-2 active:border-(--os-border-light) font-['VT323'] text-xl uppercase tracking-widest flex items-center gap-2"
            >
              Initialize Workspace
            </Link>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="w-2 h-2 bg-[var(--os-green)] animate-pulse rounded-full"></span>
              <span>System Ready. v{process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"}</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t-2 border-(--os-border-dark) p-1 px-2 flex justify-between text-[10px] uppercase font-bold text-gray-700 bg-(--os-bg)">
          <span>4 OBJECT(S) LOADED</span>
          <div className="flex gap-4">
            <span>DISK: OK</span>
            <span>MEMORY: 640KB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
