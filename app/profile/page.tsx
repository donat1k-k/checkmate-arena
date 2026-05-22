"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ArenaAvatar from "@/components/profile/ArenaAvatar";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  loadProfileCustomization,
  type ProfileCustomization,
} from "@/lib/demo/customization";
import {
  loadEquippedCosmetics,
  type EquippedCosmetics,
} from "@/lib/demo/cosmetics";
import { loadOwnedStoreItems } from "@/lib/demo/economy";
import { loadArenaCoinsBalance } from "@/lib/demo/economy";
import { loadProTrialGamesLeft } from "@/lib/demo/retention";
import { getAccuracy, loadBlitzStats, type BlitzStats } from "@/lib/demo/blitz";
import {
  getGamesPlayed,
  getOpponentDisplayName,
  getRatingLevel,
  getRatingLevelProgress,
  getWinRate,
  loadGuestProfile,
  loadMatches,
  type GuestProfile,
  type LocalMatch,
  type MatchResult,
} from "@/lib/demo/progress";
import type { AppTranslations, Locale } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import {
  loadAccountMatches,
  type AccountMatch,
} from "@/lib/supabase/matches";
import {
  getAccountGamesPlayed,
  getAccountWinRate,
  loadAccountProfile,
  type AccountProfile,
} from "@/lib/supabase/profiles";

type ProfileView = {
  source: "account" | "guest";
  nickname: string;
  rating: number;
  peakRating: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  gamesPlayed: number;
  winRate: number;
  createdAt: string;
};

type ProfileMatch = {
  id: string;
  opponentNickname: string;
  result: MatchResult;
  ratingDelta: number;
  moveCount: number;
  finishedAt: string;
  ratingBefore?: number;
  ratingAfter?: number;
};

type StyleKey = keyof AppTranslations["profile"]["styles"];

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function guestProfileView(profile: GuestProfile): ProfileView {
  return {
    source: "guest",
    nickname: profile.nickname,
    rating: profile.rating,
    peakRating: profile.peakRating,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    streak: profile.streak,
    gamesPlayed: getGamesPlayed(profile),
    winRate: getWinRate(profile),
    createdAt: profile.createdAt,
  };
}

function accountProfileView(profile: AccountProfile): ProfileView {
  return {
    source: "account",
    nickname: profile.nickname,
    rating: profile.rating,
    peakRating: profile.peakRating,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    streak: profile.streak,
    gamesPlayed: getAccountGamesPlayed(profile),
    winRate: getAccountWinRate(profile),
    createdAt: profile.createdAt,
  };
}

function localMatchView(match: LocalMatch): ProfileMatch {
  return {
    id: match.id,
    opponentNickname: match.opponentNickname,
    result: match.result,
    ratingDelta: match.ratingDelta,
    moveCount: match.moveCount,
    finishedAt: match.finishedAt,
    ratingBefore: match.ratingBefore,
    ratingAfter: match.ratingAfter,
  };
}

function accountMatchView(match: AccountMatch): ProfileMatch {
  return {
    id: match.id,
    opponentNickname: match.opponentNickname,
    result: match.result,
    ratingDelta: match.ratingDelta,
    moveCount: match.moveCount,
    finishedAt: match.finishedAt,
  };
}

function ratingSeries(profile: ProfileView, matches: ProfileMatch[]): number[] {
  if (matches.length === 0) return [];

  if (matches.some((match) => match.ratingAfter !== undefined)) {
    return matches
      .slice()
      .reverse()
      .map((match) => match.ratingAfter)
      .filter((rating): rating is number => typeof rating === "number");
  }

  const newestFirst = matches.slice();
  let cursor = profile.rating;
  const reversePoints = [cursor];
  for (const match of newestFirst) {
    cursor -= match.ratingDelta;
    reversePoints.push(cursor);
  }
  return reversePoints.reverse();
}

function playerStyle(matches: ProfileMatch[]): {
  key: StyleKey;
  enoughGames: boolean;
} {
  if (matches.length < 3) return { key: "balanced", enoughGames: false };

  const wins = matches.filter((match) => match.result === "win");
  const draws = matches.filter((match) => match.result === "draw");
  const fastWins = wins.filter((match) => match.moveCount <= 22).length;
  const longGames = matches.filter((match) => match.moveCount >= 36).length;

  if (fastWins >= 2) return { key: "aggressive", enoughGames: true };
  if (longGames >= Math.ceil(matches.length / 2)) {
    return { key: "endgame", enoughGames: true };
  }
  if (wins.length >= Math.ceil(matches.length * 0.6)) {
    return { key: "tactician", enoughGames: true };
  }
  if (draws.length >= 2) return { key: "positional", enoughGames: true };
  return { key: "balanced", enoughGames: true };
}

function EloGraph({
  empty,
  points,
}: {
  empty: string;
  points: number[];
}) {
  if (points.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-arena-border bg-arena-elevated/60 px-4 text-center text-sm text-arena-muted">
        {empty}
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = Math.max(50, max - min);
  const chartPoints = points
    .map((rating, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 92 - ((rating - min) / spread) * 72;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-md border border-arena-border bg-arena-elevated/60 p-3">
      <svg
        viewBox="0 0 100 100"
        role="img"
        className="h-24 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <path d="M0 20H100 M0 56H100 M0 92H100" stroke="var(--color-arena-border)" strokeWidth="0.6" />
        <polyline
          points={chartPoints}
          fill="none"
          stroke="var(--color-arena-blue)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        {points.map((rating, index) => {
          const x = (index / (points.length - 1)) * 100;
          const y = 92 - ((rating - min) / spread) * 72;
          return (
            <circle
              key={`${rating}-${index}`}
              cx={x}
              cy={y}
              r="1.2"
              fill="var(--color-arena-panel)"
              stroke="var(--color-arena-blue)"
              strokeWidth="0.8"
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-arena-muted">
        <span>{points[0]}</span>
        <span>{points[points.length - 1]}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { locale, t } = usePreferences();
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [matches, setMatches] = useState<ProfileMatch[]>([]);
  const [accountError, setAccountError] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [arenaCoins, setArenaCoins] = useState(0);
  const [trialGamesLeft, setTrialGamesLeft] = useState(3);
  const [customization, setCustomization] = useState<ProfileCustomization>(
    loadProfileCustomization(),
  );
  const [blitzStats, setBlitzStats] = useState<BlitzStats | null>(null);
  const [equippedCosmetics, setEquippedCosmetics] = useState<EquippedCosmetics>({ frame: null, board: null, coach: null, title: null });
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setArenaCoins(loadArenaCoinsBalance());
    setTrialGamesLeft(loadProTrialGamesLeft());
    setCustomization(loadProfileCustomization());
    setBlitzStats(loadBlitzStats());
    setEquippedCosmetics(loadEquippedCosmetics());
    setOwnedItemIds(loadOwnedStoreItems());

    async function loadProfilePage() {
      const supabase = createClient();

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const accountProfile = await loadAccountProfile(supabase, user);
          if (!active) return;

          if (!accountProfile.profile) {
            setAccountError(true);
            setLoaded(true);
            return;
          }

          const accountMatches = await loadAccountMatches(
            supabase,
            accountProfile.profile.id,
          );
          if (!active) return;

          setProfile(accountProfileView(accountProfile.profile));
          setMatches(accountMatches.matches.map(accountMatchView));
          setHistoryError(accountMatches.error !== null);
          setLoaded(true);
          return;
        }
      }

      const guestProfile = loadGuestProfile();
      if (!active) return;

      setProfile(guestProfile ? guestProfileView(guestProfile) : null);
      setMatches(loadMatches().map(localMatchView));
      setLoaded(true);
    }

    void loadProfilePage();

    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return <p className="py-10 text-sm text-arena-muted">{t.profile.loading}</p>;
  }

  if (accountError) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.profile.accountEyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold">{t.profile.accountErrorTitle}</h1>
        <p className="mt-2 max-w-xl text-sm text-arena-muted">
          {t.profile.accountErrorBody}
        </p>
        <Link
          href="/play"
          className="mt-4 inline-flex rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
        >
          {t.profile.startMatchShort}
        </Link>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.profile.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold">{t.profile.emptyTitle}</h1>
        <p className="mt-2 max-w-xl text-sm text-arena-muted">
          {t.profile.emptyBody}
        </p>
        <Link
          href="/play"
          className="mt-4 inline-flex rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
        >
          {t.profile.startMatch}
        </Link>
      </section>
    );
  }

  const isAccount = profile.source === "account";
  const statItems = [
    { label: t.profile.stats.rating, value: profile.rating },
    { label: t.profile.stats.level, value: getRatingLevel(profile.rating) },
    { label: t.profile.stats.peak, value: profile.peakRating },
    { label: t.profile.stats.games, value: profile.gamesPlayed },
    { label: t.profile.stats.winrate, value: `${profile.winRate}%` },
    { label: t.profile.stats.wins, value: profile.wins },
    { label: t.profile.stats.losses, value: profile.losses },
    { label: t.profile.stats.draws, value: profile.draws },
    { label: t.profile.stats.streak, value: profile.streak },
  ];
  const badgeItems = [
    {
      label: isAccount ? t.profile.badges.account : t.profile.badges.founding,
      detail: isAccount
        ? t.profile.badges.accountDetail
        : t.profile.badges.foundingDetail,
      active: true,
    },
    {
      label: t.profile.badges.firstWin,
      detail: profile.wins > 0 ? t.profile.badges.unlocked : t.profile.badges.winOne,
      active: profile.wins > 0,
    },
    {
      label: t.profile.badges.streak,
      detail:
        profile.streak >= 3 ? t.profile.badges.unlocked : t.profile.badges.buildStreak,
      active: profile.streak >= 3,
    },
  ];
  const recentMatch = matches[0];
  const recentOpponent = recentMatch
    ? getOpponentDisplayName(
        recentMatch.opponentNickname,
        t.match.opponent,
      )
    : null;
  const progress = getRatingLevelProgress(profile.rating);
  const graphPoints = ratingSeries(profile, matches);
  const style = playerStyle(matches);
  const clanTag = customization.clanTag || t.profile.clanOpen;

  return (
    <div className="flex flex-col gap-0 -mx-4 -mt-5 sm:-mt-6">
      {/* ── Profile header ── */}
      <div className="border-b border-arena-border bg-arena-panel px-4 py-5">
        <div className="mx-auto max-w-[1280px]">
          {/* Avatar + name row */}
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <ArenaAvatar avatarId={customization.avatarId} className="h-[72px] w-[72px] text-2xl" />
            <div>
              <h1 className="text-2xl font-extrabold">{profile.nickname}</h1>
              <div className="font-mono text-xs text-arena-muted mt-0.5">
                @{profile.nickname.toLowerCase().replace(/\s/g, "_")}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: "var(--color-arena-amber-bg)", border: "1px solid var(--color-arena-amber-border)", color: "var(--color-arena-blue)" }}
                >
                  {isAccount ? t.profile.badges.account : t.profile.badges.founding}
                </span>
                {profile.wins > 0 && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-arena-win/10 border border-arena-win/30 text-arena-win">
                    {t.profile.badges.firstWin}
                  </span>
                )}
                <span className="rounded-full border border-arena-border bg-arena-elevated px-2.5 py-0.5 text-xs font-semibold text-arena-muted">
                  {trialGamesLeft > 0 ? t.profile.trialBadge : t.profile.freeBadge}
                </span>
                {clanTag && clanTag !== t.profile.clanOpen && (
                  <span className="rounded-full border border-arena-border bg-arena-elevated px-2.5 py-0.5 font-mono text-xs font-semibold">
                    [{clanTag}]
                  </span>
                )}
                {equippedCosmetics.title && ownedItemIds.includes(equippedCosmetics.title) && (
                  <span className="rounded-full border border-arena-amber-border bg-arena-amber-bg px-2.5 py-0.5 text-xs font-semibold text-arena-blue">
                    {t.economy.store.items[equippedCosmetics.title as keyof typeof t.economy.store.items]?.name ?? equippedCosmetics.title}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-arena-muted">
                <span>{t.profile.city}: {t.settings.cities[customization.city]}</span>
                <span>{t.profile.visibility}: {t.settings.visibilities[customization.visibility]}</span>
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <Link
                href="/play"
                className="rounded-md bg-arena-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {t.profile.playAgain}
              </Link>
              <Link
                href="/pro"
                className="rounded-md border border-arena-border px-4 py-2 text-sm font-semibold hover:border-arena-gold"
              >
                {t.profile.proCtaLink}
              </Link>
            </div>
          </div>

          {/* Horizontal stat row */}
          <div
            className="grid grid-cols-2 overflow-hidden rounded-lg border border-arena-border sm:flex"
            style={{ background: "var(--color-arena-border)", gap: "1px" }}
          >
            {[
              { label: t.profile.stats.rating, value: profile.rating, mono: true, accent: true },
              { label: t.profile.stats.peak, value: profile.peakRating, mono: true },
              { label: t.profile.stats.games, value: profile.gamesPlayed, mono: true },
              { label: t.profile.stats.winrate, value: `${profile.winRate}%`, mono: true },
              { label: t.profile.stats.wins, value: profile.wins, mono: true },
              { label: t.profile.stats.losses, value: profile.losses, mono: true },
              { label: t.profile.stats.streak, value: profile.streak, mono: true },
              { label: t.economy.abbr, value: arenaCoins, mono: true },
            ].map((stat) => (
              <div
                key={stat.label}
                className="min-w-0 bg-arena-panel px-3 py-3 sm:min-w-[80px] sm:flex-1"
              >
                <div className={`font-mono text-lg font-bold ${stat.accent ? "text-arena-blue" : ""}`}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-arena-muted mt-0.5 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="mx-auto max-w-[1280px] flex flex-col gap-5">

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]" style={{ contain: "none" }}>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.profile.badgesEyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t.profile.statusTitle}</h2>
          <div className="mt-4 grid gap-2">
            {badgeItems.map((badge) => (
              <div
                key={badge.label}
                className={
                  badge.active
                    ? "rounded-md border border-arena-blue/30 bg-arena-amber-bg px-4 py-3"
                    : "rounded-md border border-arena-border bg-arena-elevated/60 px-4 py-3 text-arena-muted"
                }
              >
                <p className="font-medium">{badge.label}</p>
                <p className="mt-1 text-sm">{badge.detail}</p>
              </div>
            ))}
          </div>
          <Link
            href="/pro"
            className="mt-3 block rounded-md border border-arena-amber-border bg-arena-amber-bg px-4 py-3 hover:border-arena-gold"
          >
            <p className="text-sm font-semibold">{t.profile.proCtaTitle}</p>
            <p className="mt-1 text-xs text-arena-muted">{t.profile.proCtaBody}</p>
          </Link>
        </div>

        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.profile.latestSignal}</p>
          {recentMatch ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold">
                {t.match.result[recentMatch.result]} {t.common.vs} {recentOpponent}
              </h2>
              <p className="mt-3 text-sm text-arena-muted">
                {formatDate(recentMatch.finishedAt, locale)} | {recentMatch.moveCount}{" "}
                {t.common.moves}
                {recentMatch.ratingBefore !== undefined &&
                  recentMatch.ratingAfter !== undefined && (
                    <>
                      {" "}
                      | {recentMatch.ratingBefore} {t.common.to}{" "}
                      {recentMatch.ratingAfter}
                    </>
                  )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={
                    recentMatch.ratingDelta >= 0
                      ? "rounded-md bg-arena-elevated px-3 py-1.5 font-medium text-arena-win"
                      : "rounded-md bg-arena-elevated px-3 py-1.5 font-medium text-arena-loss"
                  }
                >
                  {recentMatch.ratingDelta > 0 ? "+" : ""}
                  {recentMatch.ratingDelta} {t.common.rating}
                </span>
                <Link
                  href={`/review/${recentMatch.id}`}
                  className="rounded-md border border-arena-border px-3 py-1.5 font-medium hover:border-arena-gold"
                >
                  {t.profile.reviewLatest}
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-semibold">
                {t.profile.noResultTitle}
              </h2>
              <p className="mt-3 text-sm text-arena-muted">
                {isAccount ? t.profile.accountNoResultBody : t.profile.noResultBody}
              </p>
              <Link
                href="/play"
                className="mt-4 inline-flex rounded-md border border-arena-border px-3 py-1.5 font-medium hover:border-arena-gold"
              >
                {t.profile.startMatchShort}
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.profile.progressEyebrow}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-3xl font-bold text-arena-blue">
                LVL {progress.level}
              </p>
              <p className="mt-1 text-sm text-arena-muted">
                {progress.nextFloor === null
                  ? t.profile.maxLevel
                  : t.profile.nextLevel(Math.max(0, progress.nextFloor - profile.rating))}
              </p>
            </div>
            <p className="font-mono text-sm font-semibold">{profile.rating}</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded bg-arena-elevated">
            <div
              className="h-full rounded bg-arena-blue"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-arena-muted">
            <span>{progress.currentFloor}</span>
            <span>{progress.nextFloor ?? `${progress.currentFloor}+`}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statItems.slice(3).slice(0, 4).map((stat) => (
              <div key={stat.label} className="rounded bg-arena-elevated px-3 py-2">
                <p className="font-mono text-sm font-bold">{stat.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-arena-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
                {t.profile.eloGraph}
              </p>
              <p className="mt-1 text-sm text-arena-muted">{t.profile.graphBody}</p>
            </div>
            <p className="font-mono text-xs text-arena-muted">{graphPoints.length}</p>
          </div>
          <div className="mt-4">
            <EloGraph empty={t.profile.graphEmpty} points={graphPoints} />
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.profile.playerStyle}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {style.enoughGames ? t.profile.styles[style.key] : t.profile.notEnoughGames}
          </h2>
          <p className="mt-2 text-sm text-arena-muted">
            {style.enoughGames ? t.profile.styleBody : t.profile.styles.balanced}
          </p>
          <div className="mt-4 rounded-md border border-arena-amber-border bg-arena-amber-bg px-3 py-2 text-xs font-semibold text-arena-muted">
            {t.profile.styleLocked}
          </div>
        </article>
        <article className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.profile.premiumFrames}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-arena-border bg-arena-elevated p-3">
              <ArenaAvatar avatarId={customization.avatarId} frame="pro" className="h-11 w-11 text-sm" />
              <p className="mt-3 text-sm font-semibold">{t.profile.framePro}</p>
              <p className="mt-1 text-xs text-arena-muted">{t.economy.store.lockedPro}</p>
            </div>
            <div className="rounded-md border border-arena-border bg-arena-elevated p-3">
              <ArenaAvatar avatarId={customization.avatarId} frame="ultra" className="h-11 w-11 text-sm" />
              <p className="mt-3 text-sm font-semibold">{t.profile.frameUltra}</p>
              <p className="mt-1 text-xs text-arena-muted">{t.economy.store.lockedUltra}</p>
            </div>
          </div>
        </article>
        <article className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.profile.clanTitle}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-arena-blue">
            [{clanTag}]
          </p>
          <p className="mt-2 text-sm text-arena-muted">{t.profile.clanBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled className="rounded border border-arena-border px-3 py-1.5 text-xs font-semibold text-arena-muted disabled:cursor-not-allowed">
              {t.profile.joinClan}
            </button>
            <button disabled className="rounded border border-arena-border px-3 py-1.5 text-xs font-semibold text-arena-muted disabled:cursor-not-allowed">
              {t.profile.createClan}
            </button>
          </div>
        </article>
      </section>

      {/* ── Active cosmetics summary ── */}
      {(equippedCosmetics.frame || equippedCosmetics.board || equippedCosmetics.coach || equippedCosmetics.title) && (
        <section className="rounded-lg border border-arena-amber-border bg-arena-amber-bg p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.profile.activeCosmetics}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["frame", "board", "coach", "title"] as const).map((cat) => {
              const equipped = equippedCosmetics[cat];
              if (!equipped) return null;
              const copy = t.economy.store.items[equipped as keyof typeof t.economy.store.items];
              return (
                <span key={cat} className="rounded border border-arena-blue/30 bg-arena-panel px-2.5 py-1 text-xs">
                  <span className="text-arena-muted">{t.profile[`equipped${cat.charAt(0).toUpperCase()}${cat.slice(1)}` as "equippedFrame" | "equippedBoard" | "equippedCoach" | "equippedTitle"]}: </span>
                  <span className="font-semibold text-arena-blue">{copy?.name ?? equipped}</span>
                </span>
              );
            })}
          </div>
          <Link href="/settings#cosmetics" className="mt-2 block text-xs text-arena-muted hover:text-arena-blue">
            {t.profile.activeCosmeticsBody}
          </Link>
        </section>
      )}

      {/* ── Premium analytics shell ── */}
      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.profile.premiumAnalyticsEyebrow}</p>
        <p className="mt-1 text-sm text-arena-muted">{t.profile.premiumAnalyticsBody}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {([
            { key: "detailedStats", body: "detailedStatsBody", tier: "pro" as const },
            { key: "openingTendencies", body: "openingTendenciesBody", tier: "pro" as const },
            { key: "blunderHeatmap", body: "blunderHeatmapBody", tier: "pro" as const },
            { key: "endgameConversion", body: "endgameConversionBody", tier: "pro" as const },
            { key: "playerEvolution", body: "playerEvolutionBody", tier: "pro" as const },
            { key: "patternAnalysis", body: "patternAnalysisBody", tier: "ultra" as const },
          ] as { key: keyof typeof t.profile; body: keyof typeof t.profile; tier: "pro" | "ultra" }[]).map(({ key, body, tier }) => (
            <div key={key as string} className="relative overflow-hidden rounded-md border border-arena-border bg-arena-elevated p-4">
              <div className="select-none blur-[2px]">
                <p className="font-semibold text-arena-text">{t.profile[key] as string}</p>
                <p className="mt-1 text-xs text-arena-muted">{t.profile[body] as string}</p>
                <div className="mt-3 h-8 rounded bg-arena-border/40" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-arena-panel/80 backdrop-blur-[1px]">
                <Link href="/pro" className="rounded-md border border-arena-border bg-arena-panel px-3 py-1.5 text-xs font-semibold text-arena-muted hover:border-arena-blue hover:text-arena-text">
                  {tier === "ultra" ? t.profile.premiumLockedUltra : t.profile.premiumLocked}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scouting shell ── */}
      <section className="grid gap-4 rounded-lg border border-arena-border bg-arena-panel p-5 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.common.pro}</p>
          <h2 className="mt-1 text-lg font-semibold">{t.profile.scoutingTitle}</h2>
          <p className="mt-1 text-sm text-arena-muted">{t.profile.scoutingBody}</p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            disabled
            className="rounded-md border border-arena-border px-4 py-2 text-sm font-semibold text-arena-muted disabled:cursor-not-allowed"
          >
            {t.profile.scoutingLocked}
          </button>
        </div>
      </section>

      {blitzStats && blitzStats.attempts > 0 && (
        <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
              {t.blitz.eyebrow}
            </p>
            <Link href="/blitz" className="text-xs text-arena-blue hover:underline">
              {t.blitz.title} →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { label: t.blitz.statSolved, value: blitzStats.solved },
              { label: t.blitz.statStreak, value: blitzStats.streak },
              { label: t.blitz.statBestStreak, value: blitzStats.bestStreak },
              { label: t.blitz.statCoins, value: `${blitzStats.coinsEarned} AC` },
              { label: t.blitz.statAccuracy, value: `${getAccuracy(blitzStats)}%` },
            ].map((s) => (
              <div key={s.label} className="rounded bg-arena-elevated px-3 py-2">
                <p className="font-mono text-sm font-bold">{s.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-arena-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-arena-border bg-arena-panel">
        <div className="flex flex-col gap-1 border-b border-arena-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">{t.profile.history}</h2>
          <p className="text-sm text-arena-muted">
            {isAccount ? t.profile.accountNewestFirst : t.profile.newestFirst}
          </p>
        </div>
        {historyError ? (
          <p className="px-4 py-6 text-sm text-arena-loss">
            {t.errors.requestFailed}
          </p>
        ) : matches.length === 0 ? (
          <p className="px-4 py-6 text-sm text-arena-muted">
            {isAccount ? t.profile.accountNoMatches : t.profile.noMatches}
          </p>
        ) : (
          <div className="divide-y divide-arena-border">
            {matches.map((match) => (
              <article
                key={match.id}
                className="flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-arena-elevated px-2 py-1 font-medium">
                      {t.match.result[match.result]}
                    </span>
                    <span
                      className={
                        match.ratingDelta >= 0 ? "text-arena-win" : "text-arena-loss"
                      }
                    >
                      {match.ratingDelta > 0 ? "+" : ""}
                      {match.ratingDelta}
                    </span>
                    <span className="text-sm text-arena-muted">
                      {t.common.vs}{" "}
                      {getOpponentDisplayName(
                        match.opponentNickname,
                        t.match.opponent,
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-arena-muted">
                    {formatDate(match.finishedAt, locale)} | {match.moveCount}{" "}
                    {t.common.moves}
                    {match.ratingBefore !== undefined &&
                      match.ratingAfter !== undefined && (
                        <>
                          {" "}
                          | {match.ratingBefore} {t.common.to} {match.ratingAfter}
                        </>
                      )}
                  </p>
                </div>
                <Link
                  href={`/review/${match.id}`}
                  className="rounded-md border border-arena-border px-3 py-1.5 text-center text-sm font-medium hover:border-arena-gold"
                >
                  {t.profile.review}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
        </div>
      </div>
    </div>
  );
}
