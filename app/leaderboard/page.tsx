"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildLeaderboard } from "@/lib/demo/leaderboard";
import { loadGuestProfile, type GuestProfile } from "@/lib/demo/progress";

export default function LeaderboardPage() {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<GuestProfile | null>(null);

  useEffect(() => {
    setProfile(loadGuestProfile());
    setLoaded(true);
  }, []);

  const rows = buildLeaderboard(profile);

  return (
    <div className="flex flex-col gap-5">
      <section>
        <p className="text-sm font-medium text-arena-gold">Demo leaderboard</p>
        <h1 className="mt-1 text-3xl font-bold">Global local loop board</h1>
        <p className="mt-2 max-w-2xl text-sm text-arena-muted">
          Demo players keep the arena populated while your guest rating is read
          from this browser.
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-arena-border bg-arena-panel">
        {!loaded ? (
          <p className="px-4 py-6 text-sm text-arena-muted">
            Loading leaderboard...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-arena-elevated text-arena-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Winrate</th>
                  <th className="px-4 py-3 font-medium">Streak</th>
                  <th className="px-4 py-3 font-medium">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena-border">
                {rows.map((row) => (
                  <tr key={row.id} className={row.isGuest ? "bg-arena-elevated/60" : ""}>
                    <td className="px-4 py-3 font-semibold">#{row.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.nickname}</span>
                        {row.isGuest && (
                          <span className="rounded bg-arena-blue px-1.5 py-0.5 text-xs text-white">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.rating}</td>
                    <td className="px-4 py-3">{row.level}</td>
                    <td className="px-4 py-3">{row.winRate}%</td>
                    <td className="px-4 py-3">{row.streak}</td>
                    <td className="px-4 py-3 text-arena-muted">{row.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!profile && (
        <p className="text-sm text-arena-muted">
          Your guest row appears after you{" "}
          <Link href="/play" className="text-arena-text underline decoration-arena-gold">
            choose a nickname
          </Link>
          .
        </p>
      )}
    </div>
  );
}
