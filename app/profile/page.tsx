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

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <p className="text-sm font-medium text-arena-gold">Guest profile</p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold">{profile.nickname}</h1>
            <p className="mt-1 text-sm text-arena-muted">
              {getGamesPlayed(profile)} local ranked demo matches saved in this browser.
            </p>
          </div>
          <Link
            href="/play"
            className="rounded-md bg-arena-blue px-4 py-2 text-center font-medium text-white hover:opacity-90"
          >
            Play again
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statItems.map((item) => (
            <div key={item.label} className="rounded-md bg-arena-elevated p-3">
              <p className="text-xs text-arena-muted">{item.label}</p>
              <p className="mt-1 text-xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel">
        <div className="border-b border-arena-border px-4 py-3">
          <h2 className="font-semibold">Match history</h2>
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
                    <span className="font-medium">{formatResult(match.result)}</span>
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
