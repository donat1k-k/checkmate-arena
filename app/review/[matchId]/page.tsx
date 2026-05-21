"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buildDemoCoachReview } from "@/lib/demo/coach";
import {
  formatFinish,
  formatResult,
  loadMatches,
  type LocalMatch,
} from "@/lib/demo/progress";

function getMatchId(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ReviewPage() {
  const params = useParams<{ matchId?: string | string[] }>();
  const matchId = getMatchId(params.matchId);
  const [loaded, setLoaded] = useState(false);
  const [match, setMatch] = useState<LocalMatch | null>(null);

  useEffect(() => {
    setMatch(loadMatches().find((savedMatch) => savedMatch.id === matchId) ?? null);
    setLoaded(true);
  }, [matchId]);

  if (!loaded) {
    return <p className="py-10 text-sm text-arena-muted">Loading review...</p>;
  }

  if (!match) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-6">
        <p className="text-sm font-medium text-arena-gold">Match Review</p>
        <h1 className="mt-1 text-2xl font-bold">Review not found locally</h1>
        <p className="mt-2 max-w-xl text-sm text-arena-muted">
          This demo review is stored with local match history in the same browser
          that finished the game.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Back to profile
        </Link>
      </section>
    );
  }

  const review = buildDemoCoachReview(match);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <p className="text-sm font-medium text-arena-gold">Demo heuristic AI Coach</p>
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">{review.headline}</h1>
            <p className="mt-2 max-w-2xl text-sm text-arena-muted">{review.summary}</p>
          </div>
          <div className="rounded-md bg-arena-elevated px-4 py-3 text-sm">
            <p className="text-arena-muted">Result</p>
            <p className="mt-1 text-lg font-semibold">
              {formatResult(match.result)}{" "}
              <span
                className={match.ratingDelta >= 0 ? "text-arena-win" : "text-arena-loss"}
              >
                {match.ratingDelta > 0 ? "+" : ""}
                {match.ratingDelta}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="text-xs text-arena-muted">Finish</p>
          <p className="mt-1 font-semibold">{formatFinish(match.finish)}</p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="text-xs text-arena-muted">Rating path</p>
          <p className="mt-1 font-semibold">
            {match.ratingBefore} to {match.ratingAfter}
          </p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="text-xs text-arena-muted">Move trace</p>
          <p className="mt-1 font-semibold">{match.moveCount} full moves</p>
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <h2 className="font-semibold">Coach notes</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {review.insights.map((insight) => (
            <article key={insight.title} className="rounded-md bg-arena-elevated p-4">
              <h3 className="font-medium">{insight.title}</h3>
              <p className="mt-2 text-sm text-arena-muted">{insight.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <p className="text-sm font-medium text-arena-gold">Train next</p>
        <p className="mt-2 text-sm">{review.trainingAdvice}</p>
        <p className="mt-2 text-xs text-arena-muted">
          This Stage 2 coach uses result and SAN-history heuristics only. No
          engine evaluation or API analysis runs here.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/play"
            className="rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
          >
            Play again
          </Link>
          <Link
            href="/profile"
            className="rounded-md border border-arena-border px-4 py-2 font-medium hover:border-arena-gold"
          >
            Profile
          </Link>
        </div>
      </section>
    </div>
  );
}
