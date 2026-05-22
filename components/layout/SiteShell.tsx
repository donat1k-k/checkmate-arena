"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AuthStatus from "@/components/auth/AuthStatus";
import { usePreferences } from "@/components/settings/PreferencesProvider";

function navLinkClass(pathname: string, href: string): string {
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");
  return isActive
    ? "rounded-md bg-arena-amber-bg px-3 py-1.5 text-sm font-medium text-arena-blue"
    : "rounded-md px-3 py-1.5 text-sm font-medium text-arena-muted hover:bg-arena-elevated hover:text-arena-text";
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = usePreferences();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className="sticky top-0 z-20 border-b border-arena-border bg-arena-bg/95 backdrop-blur"
        style={{ height: "52px" }}
      >
        <nav className="mx-auto flex h-full max-w-[1520px] items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-arena-border bg-arena-elevated text-lg text-arena-blue">♟</span>
            <span className="text-arena-text">Checkmate</span>
            <span className="text-arena-blue">Arena</span>
          </Link>
          <div className="hidden items-center gap-0.5 md:flex">
            <Link href="/" className={navLinkClass(pathname, "/")}>
              {t.common.home}
            </Link>
            <Link href="/profile" className={navLinkClass(pathname, "/profile")}>
              {t.common.profile}
            </Link>
            <Link href="/leaderboard" className={navLinkClass(pathname, "/leaderboard")}>
              {t.common.leaderboard}
            </Link>
            <Link href="/pro" className={navLinkClass(pathname, "/pro")}>
              {t.common.pro}
            </Link>
            <Link href="/settings" className={navLinkClass(pathname, "/settings")}>
              {t.common.settings}
            </Link>
            <AuthStatus />
            <Link
              href="/play"
              className="ml-1 rounded-md bg-arena-blue px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {t.common.play}
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <Link
              href="/play"
              className="rounded-md bg-arena-blue px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {t.common.play}
            </Link>
            <button
              type="button"
              aria-controls="mobile-site-menu"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t.shell.closeMenu : t.shell.openMenu}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-arena-border bg-arena-panel text-lg font-semibold text-arena-text hover:border-arena-blue"
            >
              ...
            </button>
          </div>
        </nav>
        {mobileMenuOpen && (
          <div
            id="mobile-site-menu"
            className="absolute inset-x-0 top-full border-b border-arena-border bg-arena-bg shadow-xl md:hidden"
          >
            <div className="mx-auto max-w-[1520px] px-4 py-3">
              <div className="grid gap-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${navLinkClass(pathname, "/")} block py-2`}
                >
                  {t.common.home}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${navLinkClass(pathname, "/profile")} block py-2`}
                >
                  {t.common.profile}
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${navLinkClass(pathname, "/leaderboard")} block py-2`}
                >
                  {t.common.leaderboard}
                </Link>
                <Link
                  href="/pro"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${navLinkClass(pathname, "/pro")} block py-2`}
                >
                  {t.common.pro}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${navLinkClass(pathname, "/settings")} block py-2`}
                >
                  {t.common.settings}
                </Link>
              </div>
              <div className="mt-2 border-t border-arena-border pt-2">
                <AuthStatus variant="mobileMenu" />
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-5 sm:py-6">
        {children}
      </main>
      <footer className="border-t border-arena-border">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-2 px-4 py-4 text-xs text-arena-muted sm:flex-row sm:items-center sm:justify-between">
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
