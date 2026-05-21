"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatResult,
  getGamesPlayed,
  getRatingLevel,
  getWinRate,
  loadGuestProfile,
  loadMatches,
  type GuestProfile,
  type LocalMatch,
} from "@/lib/demo/progress";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ProfilePage() {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [matches, setMatches] = useState<LocalMatch[]>([]);

  useEffect(() => {
    setProfile(loadGuestProfile());
    setMatches(loadMatches());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <p className="py-10 text-sm text-arena-muted">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-6">
        <p className="text-sm font-medium text-arena-gold">Guest profile</p>
        <h1 className="mt-1 text-2xl font-bold">No local player yet</h1>
        <p className="mt-2 max-w-xl text-sm text-arena-muted">
          Choose a nickname on the play screen to start a browser-local rating,
          match history, and review trail.
        </p>
        <Link
          href="/play"
          className="mt-4 inline-flex rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Start local match
        </Link>
      </section>
    );
  }

  const statItems = [
    { label: "Rating", value: profile.rating },
    { label: "Level", value: getRatingLevel(profile.rating) },
    { label: "Peak", value: profile.peakRating },
    { label: "Winrate", value: `${getWinRate(profile)}%` },
    { label: "Wins", value: profile.wins },
    { label: "Losses", value: profile.losses },
    { label: "Draws", value: profile.draws },
    { label: "Streak", value: profile.streak },
  ];
  const badgeItems = [
    {
      label: "Founding Guest",
      detail: "Local profile active",
      active: true,
    },
    {
      label: "First Win",
      detail: profile.wins > 0 ? "Unlocked" : "Win one match",
      active: profile.wins > 0,
    },
    {
      label: "3 Win Streak",
      detail: profile.streak >= 3 ? "Unlocked" : "Build streak",
      active: profile.streak >= 3,
    },
  ];
  const recentMatch = matches[0];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 rounded-lg border border-arena-border bg-arena-panel p-5 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm font-medium text-arena-gold">Guest profile</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-arena-border bg-arena-elevated text-2xl font-semibold text-arena-gold">
              {profile.nickname.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                {profile.nickname}
              </h1>
              <p className="mt-2 text-sm text-arena-muted">
                Level {getRatingLevel(profile.rating)} guest with{" "}
                {getGamesPlayed(profile)} local ranked demo matches saved in
                this browser.
              </p>
              <p className="mt-1 text-xs text-arena-muted">
                Joined {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-lg border border-arena-border bg-arena-elevated p-4">
          <div>
            <p className="text-xs text-arena-muted">Peak rating</p>
            <p className="mt-1 text-4xl font-semibold">{profile.peakRating}</p>
            <p className="mt-2 text-sm text-arena-muted">
              Current loop rating: {profile.rating}
            </p>
          </div>
          <Link
            href="/play"
            className="mt-5 rounded-md bg-arena-blue px-4 py-2 text-center font-medium text-white hover:opacity-90"
          >
            Play again
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-2">
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
          <p className="text-sm font-medium text-arena-gold">Progress badges</p>
          <h2 className="mt-2 text-2xl font-semibold">Arena status</h2>
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
          <p className="text-sm font-medium text-arena-gold">Latest signal</p>
          {recentMatch ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold">
                {formatResult(recentMatch.result)} vs {recentMatch.opponentNickname}
              </h2>
              <p className="mt-3 text-sm text-arena-muted">
                {formatDate(recentMatch.finishedAt)} | {recentMatch.moveCount} moves |{" "}
                {recentMatch.ratingBefore} to {recentMatch.ratingAfter}
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
                  {recentMatch.ratingDelta} rating
                </span>
                <Link
                  href={`/review/${recentMatch.id}`}
                  className="rounded-md border border-arena-border px-3 py-1.5 font-medium hover:border-arena-gold"
                >
                  Review latest
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-semibold">
                No match result yet
              </h2>
              <p className="mt-3 text-sm text-arena-muted">
                Finish the first local ranked demo to light up history and coach
                review.
              </p>
              <Link
                href="/play"
                className="mt-4 inline-flex rounded-md border border-arena-border px-3 py-1.5 font-medium hover:border-arena-gold"
              >
                Start match
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel">
        <div className="flex flex-col gap-1 border-b border-arena-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">Match history</h2>
          <p className="text-sm text-arena-muted">Newest local results first</p>
        </div>
        {matches.length === 0 ? (
          <p className="px-4 py-6 text-sm text-arena-muted">
            No matches yet. Finish your first local ranked demo game.
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
                      {formatResult(match.result)}
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
                      vs {match.opponentNickname}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-arena-muted">
                    {formatDate(match.finishedAt)} | {match.moveCount} moves |{" "}
                    {match.ratingBefore} to {match.ratingAfter}
                  </p>
                </div>
                <Link
                  href={`/review/${match.id}`}
                  className="rounded-md border border-arena-border px-3 py-1.5 text-center text-sm font-medium hover:border-arena-gold"
                >
                  Review
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
