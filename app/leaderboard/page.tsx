"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import { loadGuestProfile } from "@/lib/demo/progress";
import type { AppTranslations } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import {
  buildDemoLeaderboard,
  loadAccountLeaderboard,
  type LeaderboardRow,
} from "@/lib/supabase/leaderboard";

function cityLabel(row: LeaderboardRow, t: AppTranslations): string {
  if (row.cityKey) return t.leaderboard.cities[row.cityKey];
  return row.city ?? "—";
}

export default function LeaderboardPage() {
  const { t } = usePreferences();
  const [loaded, setLoaded] = useState(false);
  const [isAccount, setIsAccount] = useState(false);
  const [hasGuestProfile, setHasGuestProfile] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    let active = true;

    async function loadBoard() {
      const supabase = createClient();

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const result = await loadAccountLeaderboard(supabase, user?.id ?? null);
        if (!active) return;

        if (!result.error) {
          setIsAccount(true);
          setRows(result.rows);
          setLoaded(true);
          return;
        }
      }

      const guestProfile = loadGuestProfile();
      if (!active) return;

      setIsAccount(false);
      setHasGuestProfile(guestProfile !== null);
      setRows(buildDemoLeaderboard(guestProfile));
      setLoaded(true);
    }

    void loadBoard();

    return () => {
      active = false;
    };
  }, []);

  const topRows = loaded ? rows.slice(0, 3) : [];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 border-b border-arena-border pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-arena-gold">
            {isAccount ? t.leaderboard.accountEyebrow : t.leaderboard.eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            {t.leaderboard.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-arena-muted">
            {isAccount ? t.leaderboard.accountBody : t.leaderboard.body}
          </p>
        </div>
        <Link
          href="/play"
          className="rounded-md bg-arena-blue px-4 py-2 text-center font-medium text-white hover:opacity-90"
        >
          {t.leaderboard.chaseRating}
        </Link>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {topRows.map((row) => (
          <article
            key={row.id}
            className={
              row.rank === 1
                ? "rounded-lg border border-arena-gold/40 bg-arena-panel p-5"
                : "rounded-lg border border-arena-border bg-arena-panel p-5"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-arena-gold">#{row.rank}</p>
                <h2 className="mt-2 text-2xl font-semibold">{row.nickname}</h2>
              </div>
              {row.isYou && (
                <span className="rounded-full bg-arena-blue px-2.5 py-1 text-xs font-medium text-white">
                  {t.common.you}
                </span>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-arena-elevated px-3 py-2">
                <p className="text-xs text-arena-muted">{t.leaderboard.columns.rating}</p>
                <p className="mt-1 font-semibold">{row.rating}</p>
              </div>
              <div className="rounded-md bg-arena-elevated px-3 py-2">
                <p className="text-xs text-arena-muted">{t.leaderboard.columns.level}</p>
                <p className="mt-1 font-semibold">{row.level}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-arena-muted">
              {cityLabel(row, t)} | {row.winRate}%{" "}
              {t.leaderboard.columns.winrate.toLocaleLowerCase()} | {t.leaderboard.streak}{" "}
              {row.streak}
            </p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-arena-border bg-arena-panel">
        {!loaded ? (
          <p className="px-4 py-6 text-sm text-arena-muted">
            {t.leaderboard.loading}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-arena-elevated text-arena-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.leaderboard.columns.rank}</th>
                  <th className="px-4 py-3 font-medium">{t.leaderboard.columns.player}</th>
                  <th className="px-4 py-3 font-medium">{t.leaderboard.columns.rating}</th>
                  <th className="px-4 py-3 font-medium">{t.leaderboard.columns.level}</th>
                  <th className="px-4 py-3 font-medium">{t.leaderboard.columns.winrate}</th>
                  <th className="px-4 py-3 font-medium">{t.leaderboard.columns.streak}</th>
                  <th className="px-4 py-3 font-medium">{t.leaderboard.columns.city}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena-border">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={row.isYou ? "bg-arena-elevated/60" : ""}
                  >
                    <td className="px-4 py-3 font-semibold">#{row.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.nickname}</span>
                        {row.isYou && (
                          <span className="rounded bg-arena-blue px-1.5 py-0.5 text-xs text-white">
                            {t.common.you}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.rating}</td>
                    <td className="px-4 py-3">{row.level}</td>
                    <td className="px-4 py-3">{row.winRate}%</td>
                    <td className="px-4 py-3">{row.streak}</td>
                    <td className="px-4 py-3 text-arena-muted">{cityLabel(row, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {loaded && !isAccount && !hasGuestProfile && (
        <section className="rounded-lg border border-arena-border bg-arena-panel p-4 text-sm text-arena-muted">
          {t.leaderboard.guestHintStart}{" "}
          <Link href="/play" className="text-arena-text underline decoration-arena-gold">
            {t.leaderboard.guestHintLink}
          </Link>
          .
        </section>
      )}
    </div>
  );
}
