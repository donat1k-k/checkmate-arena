"use client";

import Link from "next/link";
import { usePreferences } from "@/components/settings/PreferencesProvider";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = usePreferences();

  return (
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
              {t.common.home}
            </Link>
            <Link
              href="/profile"
              className="rounded-md px-3 py-1.5 hover:bg-arena-elevated"
            >
              {t.common.profile}
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-md px-3 py-1.5 hover:bg-arena-elevated"
            >
              {t.common.leaderboard}
            </Link>
            <Link
              href="/pro"
              className="rounded-md px-3 py-1.5 hover:bg-arena-elevated"
            >
              {t.common.pro}
            </Link>
            <Link
              href="/settings"
              className="rounded-md px-3 py-1.5 hover:bg-arena-elevated"
            >
              {t.common.settings}
            </Link>
            <Link
              href="/play"
              className="rounded-md bg-arena-blue px-3 py-1.5 font-medium text-white hover:opacity-90"
            >
              {t.common.play}
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-arena-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-arena-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t.shell.footerLoop}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/play" className="hover:text-arena-text">
              {t.shell.rankedDemo}
            </Link>
            <Link href="/leaderboard" className="hover:text-arena-text">
              {t.common.leaderboard}
            </Link>
            <Link href="/pro" className="hover:text-arena-text">
              {t.shell.proConcept}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
