import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased selection:bg-[#000080] selection:text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
