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
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="font-bold tracking-tight">
              <span className="text-arena-text">Checkmate</span>{" "}
              <span className="text-arena-gold">Arena</span>
            </Link>
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <Link href="/" className="rounded-md px-3 py-1.5 hover:bg-arena-elevated">
                Home
              </Link>
              <Link
                href="/play"
                className="rounded-md bg-arena-blue px-3 py-1.5 font-medium text-white hover:opacity-90"
              >
                Play
              </Link>
              <Link
                href="/profile"
                className="rounded-md px-3 py-1.5 hover:bg-arena-elevated"
              >
                Profile
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-md px-3 py-1.5 hover:bg-arena-elevated"
              >
                Leaderboard
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
