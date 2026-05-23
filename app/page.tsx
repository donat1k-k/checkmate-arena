"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ArenaPreviewBoard from "@/components/chess/ArenaPreviewBoard";
import ArenaAvatar from "@/components/profile/ArenaAvatar";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  loadProfileCustomization,
  type ProfileCustomization,
} from "@/lib/demo/customization";
import { loadArenaCoinsBalance } from "@/lib/demo/economy";
import {
  getOpponentDisplayName,
  loadMatches,
  loadGuestProfile,
  type LocalMatch,
} from "@/lib/demo/progress";
import { createClient } from "@/lib/supabase/client";
import { loadAccountProfile } from "@/lib/supabase/profiles";

function PlayModeModal({ onClose }: { onClose: () => void }) {
  const { t } = usePreferences();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const modes = [
    {
      icon: "♟",
      label: t.home.modeQuick,
      body: t.home.modeQuickBody,
      href: "/play",
      accent: false,
    },
    {
      icon: "🤖",
      label: t.home.modeAiMode,
      body: t.home.modeAiModeBody,
      href: "/play?mode=ai",
      accent: false,
    },
    {
      icon: "🔗",
      label: t.home.modeMultiplayer,
      body: t.home.modeMultiplayerBody,
      href: "/multiplayer",
      accent: false,
    },
    {
      icon: "⚡",
      label: t.home.modeBlitzMode,
      body: t.home.modeBlitzModeBody,
      href: "/blitz",
      accent: false,
    },
  ] as const;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-arena-border bg-arena-panel shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-sm font-bold">{t.home.pickModeTitle}</p>
          <button
            onClick={onClose}
            className="text-arena-muted hover:text-arena-text text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex flex-col gap-1 px-3 pb-4">
          {modes.map((m) => (
            <button
              key={m.href}
              onClick={() => { router.push(m.href); onClose(); }}
              className="flex items-center gap-3 rounded-lg border border-arena-border bg-arena-elevated px-4 py-3 text-left hover:border-arena-blue hover:bg-arena-blue/5 active:scale-[0.98] transition-all"
            >
              <span className="text-xl w-7 text-center shrink-0">{m.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{m.label}</div>
                <div className="text-[11px] text-arena-muted leading-snug truncate">{m.body}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = usePreferences();
  const [showModeModal, setShowModeModal] = useState(false);
  const [matches, setMatches] = useState<LocalMatch[]>([]);
  const [guestRating, setGuestRating] = useState<number | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);
  const [arenaCoins, setArenaCoins] = useState(0);
  const [customization, setCustomization] = useState<ProfileCustomization>(
    loadProfileCustomization(),
  );

  useEffect(() => {
    setArenaCoins(loadArenaCoinsBalance());
    setCustomization(loadProfileCustomization());
    const saved = loadMatches();
    setMatches(saved.slice().reverse().slice(0, 5));

    // Load local guest profile as initial values
    const guestProfile = loadGuestProfile();
    if (guestProfile) {
      setGuestRating(guestProfile.rating);
      setWins(guestProfile.wins);
      setLosses(guestProfile.losses);
      setDraws(guestProfile.draws);
    }

    // Override with account profile if authenticated (so Home matches Profile)
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        loadAccountProfile(supabase, user).then((result) => {
          if (result.profile) {
            setGuestRating(result.profile.rating);
            setWins(result.profile.wins);
            setLosses(result.profile.losses);
            setDraws(result.profile.draws);
          }
        });
      });
    }
  }, []);

  return (
    <>
    <div className="flex flex-col gap-0 -mx-4 -mt-5 sm:-mt-6">
      {/* ── HERO ── */}
      <div className="border-b border-arena-border bg-arena-panel px-4 py-9">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-center gap-8 flex-wrap">
            {/* Hero text */}
            <div className="flex-1 min-w-[280px]">
              <div className="font-mono text-xs font-semibold text-arena-blue uppercase tracking-widest mb-3">
                ◈ {t.home.badges[0]}
              </div>
              <h1 className="text-[2.4rem] font-extrabold leading-[1.12] text-arena-text mb-3">
                Your Arena.<br />
                <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-arena-blue)" }}>
                  Play sharper.
                </em>
              </h1>
              <p className="text-base text-arena-muted max-w-[480px] leading-relaxed mb-6">
                {t.home.intro}
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowModeModal(true)}
                  className="rounded-md bg-arena-blue px-5 py-2.5 font-semibold text-white hover:opacity-90"
                >
                  ♟ {t.home.playCta}
                </button>
                <Link
                  href="/leaderboard"
                  className="rounded-md border border-arena-border bg-arena-elevated px-5 py-2.5 font-medium hover:border-arena-gold"
                >
                  ◈ {t.home.leaderboardCta}
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div className="w-full min-w-0 rounded-xl border border-arena-border bg-arena-bg px-5 py-4 sm:w-auto sm:min-w-[220px] sm:shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <ArenaAvatar avatarId={customization.avatarId} className="h-9 w-9 text-xs" />
                <div className="text-xs font-semibold text-arena-muted">
                  {t.home.profileLabel}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-[2.2rem] font-bold leading-none">{guestRating ?? 1000}</span>
                {wins > 0 && (
                  <span className="font-mono text-sm font-semibold text-arena-win">▲ +{wins * 12}</span>
                )}
              </div>
              <div className="text-xs text-arena-muted mb-3">ELO Rating · Blitz</div>
              <div className="mb-3 flex items-center justify-between rounded border border-arena-amber-border bg-arena-amber-bg px-2.5 py-2">
                <span className="text-xs font-semibold text-arena-muted">{t.economy.label}</span>
                <span className="font-mono text-sm font-bold text-arena-gold">
                  {arenaCoins} {t.economy.abbr}
                </span>
              </div>
              <div
                className="grid grid-cols-3 overflow-hidden rounded border border-arena-border mb-3"
                style={{ gap: "1px", background: "var(--color-arena-border)" }}
              >
                <div className="bg-arena-panel px-2 py-2 text-center">
                  <div className="font-mono text-base font-semibold text-arena-win">{wins}</div>
                  <div className="text-[10px] uppercase tracking-wide text-arena-muted">{t.profile.stats.wins}</div>
                </div>
                <div className="bg-arena-panel px-2 py-2 text-center">
                  <div className="font-mono text-base font-semibold text-arena-loss">{losses}</div>
                  <div className="text-[10px] uppercase tracking-wide text-arena-muted">{t.profile.stats.losses}</div>
                </div>
                <div className="bg-arena-panel px-2 py-2 text-center">
                  <div className="font-mono text-base font-semibold text-arena-muted">{draws}</div>
                  <div className="text-[10px] uppercase tracking-wide text-arena-muted">{t.profile.stats.draws}</div>
                </div>
              </div>
              <div className="text-xs text-arena-muted">
                {t.home.localIntro}
              </div>
            </div>

            {/* Board preview (decorative, hidden on small) */}
            <div className="hidden xl:block w-[220px] opacity-60 shrink-0">
              <ArenaPreviewBoard />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-4 py-7">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">

            {/* Left: Recent games + loop steps */}
            <div className="flex flex-col gap-6">
              {/* Recent games */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-arena-muted">
                    {matches.length > 0 ? t.home.recentGames : t.home.loopTitle}
                  </span>
                  <Link href="/profile" className="text-xs text-arena-blue hover:opacity-80">
                    {t.home.viewAll}
                  </Link>
                </div>

                {matches.length > 0 ? (
                  <div className="panel overflow-hidden">
                    {matches.map((match, idx) => (
                      <Link
                        key={match.id}
                        href={`/review/${match.id}`}
                        className="flex items-center gap-3 px-3.5 py-2.5 border-b border-arena-border last:border-b-0 hover:bg-arena-elevated transition-colors"
                      >
                        {/* Result dot */}
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{
                            background: match.result === "win"
                              ? "var(--color-arena-win)"
                              : match.result === "loss"
                              ? "var(--color-arena-loss)"
                              : "var(--color-arena-muted)"
                          }}
                        />
                        {/* Result badge */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          match.result === "win"
                            ? "bg-arena-win/10 text-arena-win"
                            : match.result === "loss"
                            ? "bg-arena-loss/10 text-arena-loss"
                            : "bg-arena-elevated text-arena-muted"
                        }`}>
                          {t.match.result[match.result]}
                        </span>
                        {/* Opponent */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {getOpponentDisplayName(match.opponentNickname, t.match.opponent)}
                          </div>
                          <div className="text-[10px] text-arena-muted">
                            {match.finish} · {match.moveCount} moves
                          </div>
                        </div>
                        {/* Delta */}
                        <span className={`font-mono text-xs font-semibold ${match.ratingDelta >= 0 ? "text-arena-win" : "text-arena-loss"}`}>
                          {match.ratingDelta > 0 ? "+" : ""}{match.ratingDelta}
                        </span>
                        {/* Review btn */}
                        <span className="text-[10px] font-semibold text-arena-blue bg-arena-amber-bg border border-arena-amber-border rounded px-2 py-0.5">
                          ◈ Review
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  /* Loop steps when no games yet */
                  <div className="grid gap-3 sm:grid-cols-3">
                    {t.home.loopSteps.map((step, index) => (
                      <article
                        key={step.title}
                        className="panel p-4"
                      >
                        <p className="font-mono text-xs font-semibold text-arena-blue">0{index + 1}</p>
                        <h2 className="mt-2 text-base font-semibold">{step.title}</h2>
                        <p className="mt-1 text-xs text-arena-muted">{step.body}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* AI insight card */}
              <div
                className="rounded-xl border p-4"
                style={{ background: "var(--color-arena-amber-bg)", borderColor: "var(--color-arena-amber-border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-arena-blue text-sm">◈</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-arena-blue">{t.home.coachInsight}</span>
                </div>
                <p className="text-sm text-arena-muted leading-relaxed mb-3">
                  {t.home.loopBody}
                </p>
                <div className="flex flex-wrap gap-2">
                  {t.home.signals.map((signal) => (
                    <span key={signal.label} className="rounded-full bg-arena-panel border border-arena-border px-3 py-1 text-xs font-semibold">
                      <span className="font-mono text-arena-text">{signal.value}</span>
                      <span className="text-arena-muted ml-1.5">{signal.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-4">
              {/* Quick actions */}
              <div className="panel">
                <div className="panel-hd">
                  <span className="panel-ttl">{t.home.quickActions}</span>
                </div>
                <div className="p-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowModeModal(true)}
                    className="flex w-full items-center gap-3 rounded-lg border border-arena-blue bg-arena-blue px-4 py-3 text-white hover:opacity-90 transition-opacity"
                  >
                    <span className="text-lg">♟</span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">{t.home.playCta}</div>
                      <div className="text-[10px] opacity-75">{t.play.localRanked}</div>
                    </div>
                  </button>
                  <Link
                    href="/blitz"
                    className="flex items-center gap-3 rounded-lg border border-arena-border bg-arena-panel px-4 py-3 hover:bg-arena-elevated transition-colors"
                  >
                    <span className="text-lg">⚡</span>
                    <div>
                      <div className="text-sm font-semibold">{t.blitz.title}</div>
                      <div className="text-[10px] text-arena-muted">{t.blitz.eyebrow}</div>
                    </div>
                  </Link>
                  {matches.length > 0 && (
                    <Link
                      href={`/review/${matches[0]?.id}`}
                      className="flex items-center gap-3 rounded-lg border border-arena-border bg-arena-panel px-4 py-3 hover:bg-arena-elevated transition-colors"
                    >
                      <span className="text-lg text-arena-blue">◈</span>
                      <div>
                        <div className="text-sm font-semibold">{t.home.reviewLast}</div>
                        <div className="text-[10px] text-arena-muted">{t.review.eyebrow}</div>
                      </div>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-lg border border-arena-border bg-arena-panel px-4 py-3 hover:bg-arena-elevated transition-colors"
                  >
                    <span className="text-lg">📊</span>
                    <div>
                      <div className="text-sm font-semibold">{t.home.profileCard}</div>
                      <div className="text-[10px] text-arena-muted">{t.home.profileLabel}</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* This week stats */}
              <div className="panel">
                <div className="panel-hd">
                  <span className="panel-ttl">{t.home.session}</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {t.home.signals.map((signal) => (
                    <div key={signal.label} className="rounded bg-arena-elevated p-2.5">
                      <div className="font-mono text-sm font-bold">{signal.value}</div>
                      <div className="text-[10px] text-arena-muted mt-0.5">{signal.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro card */}
              <Link
                href="/pro"
                className="panel p-4 hover:border-arena-gold transition-colors block"
              >
                <p className="text-xs text-arena-muted">{t.home.proLabel}</p>
                <p className="mt-1 font-semibold text-sm">{t.home.proCard}</p>
                <p className="mt-2 text-xs font-semibold text-arena-blue">{t.home.proCta}</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    {showModeModal && <PlayModeModal onClose={() => setShowModeModal(false)} />}
    </>
  );
}
