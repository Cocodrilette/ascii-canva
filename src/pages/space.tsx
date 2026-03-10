import Head from "next/head";
import AsciiEditor from "@/components/AsciiEditor";

export default function Space() {
  return (
    <div className="min-h-screen bg-[var(--os-bg)] overflow-hidden">
      <Head>
        <title>Canvas | ascii_canva</title>
        <meta name="description" content="Simple ASCII Canvas" />
      </Head>

      <main>
        <AsciiEditor />
      </main>
    </div>
  );
}
