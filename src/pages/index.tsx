import Head from "next/head";
import AsciiEditor from "@/components/AsciiEditor";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--os-bg)] overflow-hidden">
      <Head>
        <title>Genesis ASCII</title>
        <meta name="description" content="A retro immersive ASCII editor" />
      </Head>

      <main>
        <AsciiEditor />
      </main>
    </div>
  );
}
