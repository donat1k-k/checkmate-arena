"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  buildDemoCoachReview,
  type DemoCoachReview,
} from "@/lib/demo/coach";
import {
  getOpponentDisplayName,
  loadMatches,
  type LocalMatch,
  type MatchFinish,
} from "@/lib/demo/progress";
import type { AppTranslations, Locale } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import {
  loadAccountMatch,
  type AccountMatch,
} from "@/lib/supabase/matches";
import {
  loadAccountReview,
  type AccountReview,
} from "@/lib/supabase/reviews";
import type { CoachApiResponse } from "@/app/api/coach/route";

type AiCoachResult = {
  mainMistake: string;
  bestAlternative: string;
  whyImportant: string;
  trainNext: string;
};

function getMatchId(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function accountCoachFinish(match: AccountMatch): MatchFinish {
  if (match.status === "resigned") return "resignation";
  if (match.result === "draw") return "stalemate";
  return "checkmate";
}

function accountCoachSource(match: AccountMatch): LocalMatch {
  return {
    id: match.id,
    guestId: match.playerId ?? "account",
    guestNickname: match.playerNickname,
    opponentNickname: match.opponentNickname,
    playerColor: match.playerColor,
    result: match.result,
    finish: accountCoachFinish(match),
    ratingBefore: 0,
    ratingAfter: match.ratingDelta,
    ratingDelta: match.ratingDelta,
    sanMoves: match.sanMoves,
    moveCount: match.moveCount,
    finalFen: match.finalFen ?? "",
    createdAt: match.createdAt,
    finishedAt: match.finishedAt,
  };
}

function accountReviewView(
  match: AccountMatch,
  review: AccountReview | null,
  locale: Locale,
): DemoCoachReview {
  const fallback = buildDemoCoachReview(accountCoachSource(match), locale);

  return {
    ...fallback,
    headline: review?.headline ?? fallback.headline,
    summary: review?.summary ?? fallback.summary,
    trainingAdvice: review?.trainingAdvice ?? fallback.trainingAdvice,
  };
}

function finishLabel(
  localMatch: LocalMatch | null,
  accountMatch: AccountMatch | null,
  t: AppTranslations,
): string {
  if (localMatch) return t.match.finish[localMatch.finish];
  if (accountMatch?.status === "resigned") return t.match.finish.resignation;
  if (accountMatch?.result === "draw") return t.match.result.draw;
  return t.match.finish.checkmate;
}

export default function ReviewPage() {
  const { locale, t } = usePreferences();
  const params = useParams<{ matchId?: string | string[] }>();
  const matchId = getMatchId(params.matchId);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [localMatch, setLocalMatch] = useState<LocalMatch | null>(null);
  const [accountMatch, setAccountMatch] = useState<AccountMatch | null>(null);
  const [accountReview, setAccountReview] = useState<AccountReview | null>(null);
  const [aiCoach, setAiCoach] = useState<AiCoachResult | null>(null);
  const [aiCoachLoading, setAiCoachLoading] = useState(false);
  const [aiCoachError, setAiCoachError] = useState<"not_configured" | "unavailable" | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReview() {
      const savedLocalMatch =
        loadMatches().find((savedMatch) => savedMatch.id === matchId) ?? null;

      if (savedLocalMatch) {
        if (!active) return;
        setLocalMatch(savedLocalMatch);
        setLoaded(true);
        return;
      }

      const supabase = createClient();
      if (!supabase || !matchId) {
        if (!active) return;
        setLoaded(true);
        return;
      }

      const [savedMatch, savedReview] = await Promise.all([
        loadAccountMatch(supabase, matchId),
        loadAccountReview(supabase, matchId),
      ]);
      if (!active) return;

      setAccountMatch(savedMatch.match);
      setAccountReview(savedReview.review);
      setLoadError(savedMatch.error !== null || savedReview.error !== null);
      setLoaded(true);
    }

    void loadReview();

    return () => {
      active = false;
    };
  }, [matchId]);

  async function handleGenerateAiCoach(
    currentMatch: LocalMatch | AccountMatch,
    currentLocalMatch: LocalMatch | null,
    currentAccountMatch: AccountMatch | null,
  ) {
    setAiCoachLoading(true);
    setAiCoachError(null);
    setAiCoach(null);

    const finish: MatchFinish = currentLocalMatch
      ? currentLocalMatch.finish
      : accountCoachFinish(currentAccountMatch!);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: currentMatch.result,
          finish,
          playerColor: currentMatch.playerColor,
          moves: currentMatch.sanMoves,
          moveCount: currentMatch.moveCount,
          ratingDelta: currentMatch.ratingDelta,
          locale,
        }),
      });

      const data = (await res.json()) as CoachApiResponse;

      if (data.available) {
        setAiCoach({
          mainMistake: data.mainMistake,
          bestAlternative: data.bestAlternative,
          whyImportant: data.whyImportant,
          trainNext: data.trainNext,
        });
      } else {
        setAiCoachError(
          data.reason === "not_configured" ? "not_configured" : "unavailable",
        );
      }
    } catch {
      setAiCoachError("unavailable");
    } finally {
      setAiCoachLoading(false);
    }
  }

  if (!loaded) {
    return <p className="py-10 text-sm text-arena-muted">{t.review.loading}</p>;
  }

  const match = localMatch ?? accountMatch;
  if (!match) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-6">
        <p className="text-sm font-medium text-arena-gold">{t.review.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold">{t.review.missingTitle}</h1>
        <p className="mt-2 max-w-xl text-sm text-arena-muted">
          {loadError ? t.errors.requestFailed : t.review.missingBody}
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

  const review = localMatch
    ? buildDemoCoachReview(localMatch, locale)
    : accountReviewView(accountMatch as AccountMatch, accountReview, locale);
  const lastSequence = match.sanMoves.slice(-6);
  const opponentName = getOpponentDisplayName(
    match.opponentNickname,
    t.match.opponent.localRival,
  );
  const isAccount = accountMatch !== null;

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
              {t.common.vs} {opponentName}
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
          <p className="mt-1 font-semibold">
            {finishLabel(localMatch, accountMatch, t)}
          </p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <p className="text-xs text-arena-muted">
            {isAccount ? t.review.ratingDelta : t.review.ratingPath}
          </p>
          <p className="mt-1 font-semibold">
            {localMatch ? (
              <>
                {localMatch.ratingBefore} {t.common.to} {localMatch.ratingAfter}
              </>
            ) : (
              <>
                {match.ratingDelta > 0 ? "+" : ""}
                {match.ratingDelta} {t.common.rating}
              </>
            )}
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
            {isAccount ? t.review.accountBoundary : t.review.boundary}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-arena-gold">
              {t.review.aiCoach.eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              {t.review.aiCoach.eyebrow}
            </h2>
          </div>
          {!aiCoach && !aiCoachLoading && (
            <button
              onClick={() => void handleGenerateAiCoach(match, localMatch, accountMatch)}
              className="rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
              disabled={aiCoachLoading}
            >
              {t.review.aiCoach.generateBtn}
            </button>
          )}
        </div>

        {aiCoachLoading && (
          <p className="mt-4 text-sm text-arena-muted animate-pulse">
            {t.review.aiCoach.generating}
          </p>
        )}

        {aiCoachError === "not_configured" && (
          <p className="mt-4 text-sm text-arena-muted">
            {t.review.aiCoach.notConfigured}
          </p>
        )}

        {aiCoachError === "unavailable" && (
          <p className="mt-4 text-sm text-arena-muted">
            {t.review.aiCoach.error}
          </p>
        )}

        {aiCoach && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
              <p className="text-xs text-arena-muted">{t.review.aiCoach.mainMistake}</p>
              <p className="mt-1 text-sm">{aiCoach.mainMistake}</p>
            </div>
            <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
              <p className="text-xs text-arena-muted">{t.review.aiCoach.bestAlternative}</p>
              <p className="mt-1 text-sm font-mono">{aiCoach.bestAlternative}</p>
            </div>
            <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
              <p className="text-xs text-arena-muted">{t.review.aiCoach.whyImportant}</p>
              <p className="mt-1 text-sm">{aiCoach.whyImportant}</p>
            </div>
            <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
              <p className="text-xs text-arena-muted">{t.review.aiCoach.trainNext}</p>
              <p className="mt-1 text-sm">{aiCoach.trainNext}</p>
            </div>
            <p className="sm:col-span-2 text-xs text-arena-muted">
              {t.review.aiCoach.note}
            </p>
          </div>
        )}

        {!aiCoach && !aiCoachLoading && !aiCoachError && (
          <p className="mt-3 text-sm text-arena-muted">
            {t.review.boundary}
          </p>
        )}
      </section>
    </div>
  );
}
