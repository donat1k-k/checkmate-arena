import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checkmate Arena",
  description:
    "Competitive chess platform with AI-powered post-game coaching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <header className="border-b border-arena-border">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold tracking-tight">
              <span className="text-arena-text">Checkmate</span>{" "}
              <span className="text-arena-gold">Arena</span>
            </Link>
            <Link
              href="/play"
              className="rounded-md bg-arena-blue px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Play
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
