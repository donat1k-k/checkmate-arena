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
  const youRow = loaded ? rows.find((r) => r.isYou) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Your Position Banner ── */}
      {youRow && (
        <div
          className="rounded-lg px-5 py-4 flex flex-wrap items-center gap-4"
          style={{ background: "var(--color-arena-amber-bg)", border: "1px solid var(--color-arena-amber-border)" }}
        >
          <div className="font-mono text-3xl font-bold text-arena-blue">#{youRow.rank}</div>
          <div className="flex-1">
            <div className="font-semibold text-arena-text">{youRow.nickname}</div>
            <div className="text-xs text-arena-muted mt-0.5">
              {youRow.streak > 0 ? `🔥 ${youRow.streak}-game streak` : t.leaderboard.streak + " " + youRow.streak}
            </div>
          </div>
          <div className="font-mono text-xl font-bold">{youRow.rating}</div>
          <Link
            href="/play"
            className="rounded-md bg-arena-blue px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            {t.leaderboard.chaseRating}
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-arena-border pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {isAccount ? t.leaderboard.accountEyebrow : t.leaderboard.eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{t.leaderboard.title}</h1>
          <p className="mt-1 text-sm text-arena-muted">
            {isAccount ? t.leaderboard.accountBody : t.leaderboard.body}
          </p>
        </div>
        {!youRow && (
          <Link href="/play" className="rounded-md bg-arena-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            {t.leaderboard.chaseRating}
          </Link>
        )}
      </div>

      {/* ── Podium ── */}
      {topRows.length >= 3 && (
        <div className="flex justify-center items-end gap-4 py-4">
          {/* 2nd place */}
          {topRows[1] && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-arena-muted">{topRows[1].nickname}</div>
              <div className="font-mono text-xs text-arena-muted">{topRows[1].rating}</div>
              <div
                className="w-20 rounded-t-md flex items-center justify-center font-mono text-sm font-bold text-arena-muted"
                style={{ height: "50px", background: "var(--color-arena-elevated)", border: "1px solid var(--color-arena-border)" }}
              >
                #2
              </div>
            </div>
          )}
          {/* 1st place */}
          {topRows[0] && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-arena-text">{topRows[0].nickname}</div>
              <div className="font-mono text-xs text-arena-blue font-semibold">{topRows[0].rating}</div>
              <div
                className="w-20 rounded-t-md flex items-center justify-center font-mono text-sm font-bold text-arena-blue"
                style={{ height: "70px", background: "var(--color-arena-amber-bg)", border: "1px solid var(--color-arena-amber-border)" }}
              >
                #1
              </div>
            </div>
          )}
          {/* 3rd place */}
          {topRows[2] && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-arena-muted">{topRows[2].nickname}</div>
              <div className="font-mono text-xs text-arena-muted">{topRows[2].rating}</div>
              <div
                className="w-20 rounded-t-md flex items-center justify-center font-mono text-sm font-bold text-arena-muted"
                style={{ height: "40px", background: "var(--color-arena-elevated)", border: "1px solid var(--color-arena-border)" }}
              >
                #3
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Full table ── */}
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
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wide">{t.leaderboard.columns.rank}</th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wide">{t.leaderboard.columns.player}</th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wide">{t.leaderboard.columns.rating}</th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wide">{t.leaderboard.columns.level}</th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wide">{t.leaderboard.columns.winrate}</th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wide">{t.leaderboard.columns.streak}</th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wide">{t.leaderboard.columns.city}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena-border">
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={
                      row.isYou
                        ? "bg-arena-amber-bg border-l-2 border-l-arena-blue"
                        : idx % 2 === 1
                        ? "bg-arena-elevated/40"
                        : ""
                    }
                  >
                    <td className="px-3 py-2 font-mono font-semibold text-arena-muted">#{row.rank}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.nickname}</span>
                        {row.isYou && (
                          <span className="rounded bg-arena-blue px-1.5 py-0.5 text-xs font-medium text-white">
                            {t.common.you}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono">{row.rating}</td>
                    <td className="px-3 py-2">{row.level}</td>
                    <td className="px-3 py-2 font-mono">{row.winRate}%</td>
                    <td className="px-3 py-2 font-mono">{row.streak}</td>
                    <td className="px-3 py-2 text-arena-muted">{cityLabel(row, t)}</td>
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
