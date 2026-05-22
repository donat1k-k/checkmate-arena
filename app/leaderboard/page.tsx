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

type CityFilter = "global" | "novosibirsk" | "almaty" | "moscow" | "astana";

const CITY_FILTERS: CityFilter[] = [
  "global",
  "novosibirsk",
  "almaty",
  "moscow",
  "astana",
];

function cityLabel(row: LeaderboardRow, t: AppTranslations): string {
  if (row.cityKey) return t.leaderboard.cities[row.cityKey];
  return row.city ?? "—";
}

function rowMatchesCity(row: LeaderboardRow, city: CityFilter): boolean {
  if (city === "global") return true;
  if (row.cityKey) return row.cityKey === city;
  return row.city?.trim().toLowerCase() === city;
}

function filterLabel(city: CityFilter, t: AppTranslations): string {
  return city === "global" ? t.leaderboard.globalCity : t.leaderboard.cities[city];
}

export default function LeaderboardPage() {
  const { t } = usePreferences();
  const [loaded, setLoaded] = useState(false);
  const [isAccount, setIsAccount] = useState(false);
  const [hasGuestProfile, setHasGuestProfile] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityFilter>("global");

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

  const filteredRows = loaded
    ? rows.filter((row) => rowMatchesCity(row, selectedCity))
    : [];
  const spotlightCity = selectedCity === "global" ? "novosibirsk" : selectedCity;
  const citySpotlightRows = loaded
    ? rows.filter((row) => rowMatchesCity(row, spotlightCity)).slice(0, 3)
    : [];
  const topRows = filteredRows.slice(0, 3);
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

      <section className="rounded-lg border border-arena-border bg-arena-panel p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
          {t.leaderboard.cityFilter}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CITY_FILTERS.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={
                city === selectedCity
                  ? "rounded-md border border-arena-amber-border bg-arena-amber-bg px-3 py-1.5 text-sm font-semibold text-arena-blue"
                  : "rounded-md border border-arena-border px-3 py-1.5 text-sm text-arena-muted hover:border-arena-blue hover:text-arena-text"
              }
            >
              {filterLabel(city, t)}
            </button>
          ))}
        </div>
      </section>

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

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr_0.8fr]">
        <article className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {filterLabel(spotlightCity, t)}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{t.leaderboard.citySpotlight}</h2>
          <p className="mt-1 text-xs text-arena-muted">{t.leaderboard.citySpotlightBody}</p>
          <div className="mt-3 grid gap-2">
            {!loaded ? (
              <p className="rounded bg-arena-elevated px-3 py-2 text-sm text-arena-muted">
                {t.leaderboard.loading}
              </p>
            ) : citySpotlightRows.length === 0 ? (
              <p className="rounded bg-arena-elevated px-3 py-2 text-sm text-arena-muted">
                {t.leaderboard.noCityPlayers}
              </p>
            ) : (
              citySpotlightRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-2 rounded bg-arena-elevated px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.nickname}</p>
                    {row.clanTag && (
                      <p className="font-mono text-[10px] text-arena-muted">[{row.clanTag}]</p>
                    )}
                  </div>
                  <span className="font-mono text-sm font-bold">{row.rating}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.leaderboard.clans}
          </p>
          <p className="mt-2 text-sm text-arena-muted">{t.leaderboard.clanBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded border border-arena-border px-3 py-1.5 text-xs font-semibold text-arena-muted disabled:cursor-not-allowed"
            >
              {t.leaderboard.joinClan}
            </button>
            <button
              type="button"
              disabled
              className="rounded border border-arena-border px-3 py-1.5 text-xs font-semibold text-arena-muted disabled:cursor-not-allowed"
            >
              {t.leaderboard.createClan}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-arena-muted">{t.leaderboard.comingSoon}</p>
        </article>

        <Link
          href="/pro"
          className="rounded-lg border border-arena-amber-border bg-arena-amber-bg p-4 hover:border-arena-gold"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.common.pro}
          </p>
          <p className="mt-2 text-sm font-semibold">{t.leaderboard.proCtaTitle}</p>
          <p className="mt-1 text-xs text-arena-muted">{t.leaderboard.proCtaBody}</p>
          <p className="mt-3 text-xs font-semibold text-arena-blue">
            {t.leaderboard.proCtaLink}
          </p>
        </Link>
      </section>

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
                {filteredRows.map((row, idx) => (
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
                        {row.clanTag && (
                          <span className="rounded bg-arena-elevated px-1.5 py-0.5 font-mono text-[10px] text-arena-muted">
                            [{row.clanTag}]
                          </span>
                        )}
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
