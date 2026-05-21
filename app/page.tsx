"use client";

import Link from "next/link";
import ArenaPreviewBoard from "@/components/chess/ArenaPreviewBoard";
import { usePreferences } from "@/components/settings/PreferencesProvider";

export default function HomePage() {
  const { t } = usePreferences();

  return (
    <div className="flex flex-col gap-10 pb-4">
      <section className="relative isolate min-h-[540px] overflow-hidden border-b border-arena-border pb-10 pt-8 sm:min-h-[580px] sm:pt-14">
        <div className="pointer-events-none absolute -right-32 top-32 -z-10 w-[420px] opacity-10 sm:-right-16 sm:top-10 sm:w-[560px] sm:opacity-70 lg:right-0">
          <ArenaPreviewBoard />
        </div>
        <div className="pointer-events-none absolute right-0 top-8 -z-10 hidden w-60 rounded-lg border border-arena-border bg-arena-panel/95 p-4 shadow-2xl shadow-black/30 lg:block">
          <p className="text-xs font-medium text-arena-gold">{t.home.coachReady}</p>
          <p className="mt-2 text-lg font-semibold">{t.home.coachTitle}</p>
          <p className="mt-2 text-sm text-arena-muted">
            {t.home.coachBody}
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-16 right-5 -z-10 hidden rounded-lg border border-arena-border bg-arena-panel/95 px-4 py-3 shadow-2xl shadow-black/30 md:block">
          <p className="text-xs text-arena-muted">{t.home.resultLabel}</p>
          <p className="mt-1 font-semibold text-arena-win">{t.home.winRating}</p>
        </div>

        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex flex-wrap gap-2 text-sm">
            {t.home.badges.map((badge, index) => (
              <span
                key={badge}
                className={
                  index === 0
                    ? "rounded-full border border-arena-border bg-arena-panel/90 px-3 py-1 text-arena-gold"
                    : "rounded-full border border-arena-border bg-arena-panel/90 px-3 py-1 text-arena-muted"
                }
              >
                {badge}
              </span>
            ))}
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-arena-text sm:text-6xl">
              Checkmate Arena
            </h1>
            <p className="mt-4 max-w-lg text-base text-arena-text sm:text-lg">
              {t.home.intro}
            </p>
            <p className="mt-3 max-w-lg text-sm text-arena-muted">
              {t.home.localIntro}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/play"
              className="rounded-md bg-arena-blue px-5 py-3 font-medium text-white hover:opacity-90"
            >
              {t.home.playCta}
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-md border border-arena-border bg-arena-panel/90 px-5 py-3 font-medium hover:border-arena-gold"
            >
              {t.home.leaderboardCta}
            </Link>
          </div>
          <dl className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {t.home.signals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-md border border-arena-border bg-arena-panel/90 px-4 py-3"
              >
                <dt className="text-xs text-arena-muted">{signal.label}</dt>
                <dd className="mt-1 font-semibold">{signal.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {t.home.loopSteps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-lg border border-arena-border bg-arena-panel p-5"
          >
            <p className="text-sm font-medium text-arena-gold">0{index + 1}</p>
            <h2 className="mt-3 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-arena-muted">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 border-t border-arena-border pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <p className="text-sm font-medium text-arena-gold">{t.home.loopEyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold">
            {t.home.loopTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-arena-muted">
            {t.home.loopBody}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Link
            href="/profile"
            className="rounded-lg border border-arena-border bg-arena-panel p-4 hover:border-arena-gold"
          >
            <p className="text-sm text-arena-muted">{t.home.profileLabel}</p>
            <p className="mt-1 font-semibold">{t.home.profileCard}</p>
          </Link>
          <Link
            href="/pro"
            className="rounded-lg border border-arena-border bg-arena-panel p-4 hover:border-arena-gold"
          >
            <p className="text-sm text-arena-muted">{t.home.proLabel}</p>
            <p className="mt-1 font-semibold">{t.home.proCard}</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
