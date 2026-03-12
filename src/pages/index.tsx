import Head from "next/head";
import Link from "next/link";
import { Terminal, Users, Layers, Zap, ArrowRight, Github, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <Head>
        <title>ascii_canva | Collaborative ASCII Canvas</title>
        <meta name="description" content="A collaborative ASCII editor built for the retro future." />
      </Head>

      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />

      <main className="w-full max-w-5xl z-10 space-y-16">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-7xl md:text-9xl font-bold tracking-tight text-zinc-900">
            ascii_canva
          </h1>
          
          <p className="max-w-xl text-xl text-zinc-500 font-medium leading-relaxed">
            A collaborative canvas for character-based art. 
            Build, share, and evolve grids with precision.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            <Link 
              href="/space" 
              className="genesis-button genesis-button-primary px-10 py-4 rounded-full text-lg font-semibold shadow-2xl shadow-blue-500/20 group"
            >
              Get Started
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/docs" 
              className="genesis-button px-10 py-4 rounded-full text-lg font-semibold border-zinc-200"
            >
              Learn more
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="p-2 group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 group-hover:bg-zinc-100 transition-colors">
              <Terminal className="text-zinc-900" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-zinc-900">Precision</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Manipulate character grids with surgical detail.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-2 group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 group-hover:bg-zinc-100 transition-colors">
              <Users className="text-zinc-900" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-zinc-900">Collaboration</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Real-time synchronization for seamless teamwork.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-2 group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 group-hover:bg-zinc-100 transition-colors">
              <Layers className="text-zinc-900" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-zinc-900">Extensions</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Modular architecture built for flexibility.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-2 group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 group-hover:bg-zinc-100 transition-colors">
              <Zap className="text-zinc-900" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-zinc-900">Offline First</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              No login required. Your work is yours, even without an internet connection.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-16 border-t border-zinc-100">
          <span className="text-sm text-zinc-400 font-medium tracking-tight">
            © 2026 ascii_canva
          </span>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/cocodrilette/ascii-canva" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </main>

      {/* Global Style Override for Background */}
      <style jsx global>{`
        body {
          overflow: auto !important;
        }
      `}</style>
    </div>
  );
}
