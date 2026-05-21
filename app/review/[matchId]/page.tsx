"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import { buildDemoCoachReview } from "@/lib/demo/coach";
import { loadMatches, type LocalMatch } from "@/lib/demo/progress";

function getMatchId(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ReviewPage() {
  const { locale, t } = usePreferences();
  const params = useParams<{ matchId?: string | string[] }>();
  const matchId = getMatchId(params.matchId);
  const [loaded, setLoaded] = useState(false);
  const [match, setMatch] = useState<LocalMatch | null>(null);

  useEffect(() => {
    setMatch(loadMatches().find((savedMatch) => savedMatch.id === matchId) ?? null);
    setLoaded(true);
  }, [matchId]);

  if (!loaded) {
    return <p className="py-10 text-sm text-arena-muted">{t.review.loading}</p>;
  }

  if (!match) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-6">
        <p className="text-sm font-medium text-arena-gold">{t.review.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold">{t.review.missingTitle}</h1>
        <p className="mt-2 max-w-xl text-sm text-arena-muted">
          {t.review.missingBody}
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
        >
          {t.review.backToProfile}
        </Link>
      </section>
    );
  }

  const review = buildDemoCoachReview(match, locale);
  const lastSequence = match.sanMoves.slice(-6);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-arena-border bg-arena-elevated px-3 py-1 text-arena-gold">
              {t.review.eyebrow}
            </span>
            <span className="rounded-full border border-arena-border bg-arena-elevated px-3 py-1 text-arena-muted">
              {t.review.heuristic}
            </span>
          </div>
          <div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              {review.headline}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-arena-muted">
              {review.summary}
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-lg border border-arena-border bg-arena-panel p-5">
          <div>
            <p className="text-arena-muted">{t.review.result}</p>
            <p className="mt-2 text-3xl font-semibold">
              {t.match.result[match.result]}{" "}
              <span
                className={match.ratingDelta >= 0 ? "text-arena-win" : "text-arena-loss"}
              >
                {match.ratingDelta > 0 ? "+" : ""}
                {match.ratingDelta}
              </span>
            </p>
            <p className="mt-2 text-sm text-arena-muted">
              {t.common.vs} {match.opponentNickname}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/play"
              className="rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
            >
              {t.common.playAgain}
            </Link>
            <Link
              href="/profile"
              className="rounded-md border border-arena-border px-4 py-2 font-medium hover:border-arena-gold"
            >
              {t.common.profile}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="text-xs text-arena-muted">{t.review.finish}</p>
          <p className="mt-1 font-semibold">{t.match.finish[match.finish]}</p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="text-xs text-arena-muted">{t.review.ratingPath}</p>
          <p className="mt-1 font-semibold">
            {match.ratingBefore} {t.common.to} {match.ratingAfter}
          </p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="text-xs text-arena-muted">{t.review.moveTrace}</p>
          <p className="mt-1 font-semibold">{t.review.fullMoves(match.moveCount)}</p>
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-arena-gold">{t.review.notesEyebrow}</p>
            <h2 className="mt-1 text-2xl font-semibold">{t.review.signalsTitle}</h2>
          </div>
          <p className="text-sm text-arena-muted">
            {t.review.signalsBody}
          </p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {review.insights.map((insight) => (
            <article
              key={insight.title}
              className="rounded-md border border-arena-border bg-arena-elevated p-4"
            >
              <h3 className="font-medium">{insight.title}</h3>
              <p className="mt-2 text-sm text-arena-muted">{insight.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="text-sm font-medium text-arena-gold">{t.review.moveTrace}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t.review.sequenceTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {lastSequence.length === 0 ? (
              <p className="text-sm text-arena-muted">
                {t.review.noSanMoves}
              </p>
            ) : (
              lastSequence.map((move, index) => (
                <span
                  key={`${move}-${index}`}
                  className="rounded-md bg-arena-elevated px-3 py-1.5 font-mono text-sm"
                >
                  {move}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="text-sm font-medium text-arena-gold">{t.review.trainEyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t.review.habitTitle}</h2>
          <p className="mt-3 text-sm">{review.trainingAdvice}</p>
          <p className="mt-3 text-xs text-arena-muted">
            {t.review.boundary}
          </p>
        </div>
      </section>
    </div>
  );
}
