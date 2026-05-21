"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  getGamesPlayed,
  getOpponentDisplayName,
  getRatingLevel,
  getWinRate,
  loadGuestProfile,
  loadMatches,
  type GuestProfile,
  type LocalMatch,
  type MatchResult,
} from "@/lib/demo/progress";
import type { Locale } from "@/lib/i18n/translations";
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

export default function ProfilePage() {
  const { locale, t } = usePreferences();
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [matches, setMatches] = useState<ProfileMatch[]>([]);
  const [accountError, setAccountError] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  useEffect(() => {
    let active = true;

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
        <p className="text-sm font-medium text-arena-gold">{t.profile.accountEyebrow}</p>
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
        <p className="text-sm font-medium text-arena-gold">{t.profile.eyebrow}</p>
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
        t.match.opponent.localRival,
      )
    : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 rounded-lg border border-arena-border bg-arena-panel p-5 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm font-medium text-arena-gold">
            {isAccount ? t.profile.accountEyebrow : t.profile.eyebrow}
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-arena-border bg-arena-elevated text-2xl font-semibold text-arena-gold">
              {profile.nickname.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                {profile.nickname}
              </h1>
              <p className="mt-2 text-sm text-arena-muted">
                {isAccount
                  ? t.profile.accountLevelSummary(
                      getRatingLevel(profile.rating),
                      profile.gamesPlayed,
                    )
                  : t.profile.levelSummary(
                      getRatingLevel(profile.rating),
                      profile.gamesPlayed,
                    )}
              </p>
              <p className="mt-1 text-xs text-arena-muted">
                {t.profile.joined} {formatDate(profile.createdAt, locale)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-lg border border-arena-border bg-arena-elevated p-4">
          <div>
            <p className="text-xs text-arena-muted">{t.profile.peakRating}</p>
            <p className="mt-1 text-4xl font-semibold">{profile.peakRating}</p>
            <p className="mt-2 text-sm text-arena-muted">
              {t.profile.currentRating}: {profile.rating}
            </p>
          </div>
          <Link
            href="/play"
            className="mt-5 rounded-md bg-arena-blue px-4 py-2 text-center font-medium text-white hover:opacity-90"
          >
            {t.profile.playAgain}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-2 xl:grid-cols-5">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-arena-border bg-arena-elevated p-3"
            >
              <p className="text-xs text-arena-muted">{item.label}</p>
              <p className="mt-1 text-xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="text-sm font-medium text-arena-gold">{t.profile.badgesEyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t.profile.statusTitle}</h2>
          <div className="mt-4 grid gap-2">
            {badgeItems.map((badge) => (
              <div
                key={badge.label}
                className={
                  badge.active
                    ? "rounded-md border border-arena-gold/40 bg-arena-elevated px-4 py-3"
                    : "rounded-md border border-arena-border bg-arena-elevated/60 px-4 py-3 text-arena-muted"
                }
              >
                <p className="font-medium">{badge.label}</p>
                <p className="mt-1 text-sm">{badge.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="text-sm font-medium text-arena-gold">{t.profile.latestSignal}</p>
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
                        t.match.opponent.localRival,
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
  );
}
