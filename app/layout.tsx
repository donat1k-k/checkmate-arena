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
      <body className="min-h-dvh">
        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-20 border-b border-arena-border bg-arena-bg/90 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
                <span className="grid h-9 w-9 grid-cols-2 overflow-hidden rounded-md border border-arena-border bg-arena-panel">
                  <span className="bg-arena-gold" />
                  <span className="bg-arena-elevated" />
                  <span className="bg-arena-elevated" />
                  <span className="bg-arena-blue" />
                </span>
                <span>
                  <span className="text-arena-text">Checkmate</span>{" "}
                  <span className="text-arena-gold">Arena</span>
                </span>
              </Link>
              <div className="flex flex-wrap items-center justify-end gap-1 text-sm">
                <Link href="/" className="rounded-md px-3 py-1.5 hover:bg-arena-elevated">
                  Home
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
                <Link
                  href="/pro"
                  className="rounded-md px-3 py-1.5 hover:bg-arena-elevated"
                >
                  Pro
                </Link>
                <Link
                  href="/play"
                  className="rounded-md bg-arena-blue px-3 py-1.5 font-medium text-white hover:opacity-90"
                >
                  Play
                </Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-arena-border">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-arena-muted sm:flex-row sm:items-center sm:justify-between">
              <p>Local demo loop: play, rate, review, progress.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/play" className="hover:text-arena-text">
                  Ranked demo
                </Link>
                <Link href="/leaderboard" className="hover:text-arena-text">
                  Leaderboard
                </Link>
                <Link href="/pro" className="hover:text-arena-text">
                  Pro concept
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
