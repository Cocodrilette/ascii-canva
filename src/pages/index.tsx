import Head from "next/head";
import AsciiEditor from "@/components/AsciiEditor";

export default function Home() {
	return (
		<div className="min-h-screen bg-white dark:bg-black overflow-hidden">
			<Head>
				<title>Genesis ASCII | Immersive Editor</title>
				<meta name="description" content="A high-performance immersive ASCII editor" />
			</Head>

			<main>
				<AsciiEditor />
			</main>
		</div>
	);
}
