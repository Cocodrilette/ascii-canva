import { Sparkles } from "lucide-react";
import Head from "next/head";
import AsciiEditor from "@/components/AsciiEditor";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-x-hidden">
      <Head>
        <title>Genesis ASCII | Canvas to ASCII Editor</title>
        <meta
          name="description"
          content="A high-performance glassmorphism ASCII editor"
        />
      </Head>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white dark:text-black" />
          </div>
          GENESIS ASCII
        </div>

        <div className="flex gap-4 items-center">
          <a
            href="https://github.com"
            className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </nav>

      <main className="relative z-10 pt-12 pb-24">
        <div className="max-w-4xl mx-auto px-6 mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 animate-in slide-in-from-bottom-4 duration-700">
            ASCII <span className="opacity-40 italic">Manifesto</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto animate-in slide-in-from-bottom-6 duration-700 delay-100">
            Translate your thoughts into the primitive aesthetic of ASCII. Step
            one: Text translation.
          </p>
        </div>

        <section className="animate-in fade-in duration-1000 delay-200">
          <AsciiEditor />
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-black/5 dark:border-white/5 text-center opacity-40 text-sm">
        <p>© 2026 Genesis ASCII Stack. Built for the terminal aesthetic.</p>
      </footer>
    </div>
  );
}
