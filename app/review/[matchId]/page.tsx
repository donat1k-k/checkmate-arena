"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import ReplayBoard from "@/components/chess/ReplayBoard";
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
  loadSavedAiAnalysis,
  saveAiAnalysis,
  type AccountReview,
  type AiAnalysis,
  type AiKeyMoment,
} from "@/lib/supabase/reviews";
import type { CoachApiResponse } from "@/app/api/coach/route";
import type { MoveQuestionResponse } from "@/app/api/coach/move/route";

function getMatchId(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Schema has no finish_reason column yet — draws are stored as "draw" status
// without distinguishing stalemate/insufficient/threefold/fifty-move.
// Using "stalemate" as a placeholder for all draws until Schema V2 migration.
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

type TimelineStrings = AppTranslations["review"]["timeline"];
type TrainingStrings = AppTranslations["review"]["training"];
type AskMoveStrings = AppTranslations["review"]["askMove"];

type TrainingMomentState = {
  userAnswer: string;
  revealed: boolean;
  aiResult: { answer: string; betterPlan: string; trainingTip: string } | null;
  aiLoading: boolean;
  aiError: string | null;
};

function momentTypeBadgeClass(type: AiKeyMoment["type"]): string {
  switch (type) {
    case "good": return "border-arena-win/50 bg-arena-win/10 text-arena-win";
    case "inaccuracy": return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    case "mistake": return "border-arena-loss/50 bg-arena-loss/10 text-arena-loss";
    case "critical": return "border-red-500/60 bg-red-500/15 text-red-400";
    case "turning_point": return "border-arena-blue/50 bg-arena-blue/10 text-arena-blue";
  }
}

function KeyMomentCard({
  moment,
  tl,
  onGoToMove,
}: {
  moment: AiKeyMoment;
  tl: TimelineStrings;
  onGoToMove: () => void;
}) {
  const badgeClass = momentTypeBadgeClass(moment.type);
  const typeLabel = tl.types[moment.type] ?? moment.type;

  return (
    <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
            {typeLabel}
          </span>
          {moment.san && (
            <span className="font-mono text-sm font-medium">
              {moment.ply}. {moment.san}
            </span>
          )}
          <span className="font-medium">{moment.title}</span>
        </div>
        <button
          onClick={onGoToMove}
          className="shrink-0 rounded-md border border-arena-border px-3 py-1 text-xs hover:border-arena-blue hover:text-arena-blue"
        >
          {tl.goToMove}
        </button>
      </div>
      <p className="mt-2 text-sm text-arena-muted">{moment.comment}</p>
      {moment.betterPlan && (
        <p className="mt-1 text-xs text-arena-muted">
          <span className="font-medium text-foreground">{tl.betterPlan}:</span>{" "}
          <span className="font-mono">{moment.betterPlan}</span>
        </p>
      )}
      {moment.trainingTip && (
        <p className="mt-1 text-xs text-arena-muted">
          <span className="font-medium text-foreground">{tl.trainingTip}:</span>{" "}
          {moment.trainingTip}
        </p>
      )}
    </div>
  );
}

function TrainingMomentCard({
  moment,
  state,
  tr,
  tl,
  ta,
  onGoToMove,
  onAnswerChange,
  onReveal,
  onAskAi,
}: {
  moment: AiKeyMoment;
  state: TrainingMomentState;
  tr: TrainingStrings;
  tl: TimelineStrings;
  ta: AskMoveStrings;
  onGoToMove: () => void;
  onAnswerChange: (v: string) => void;
  onReveal: () => void;
  onAskAi: () => void;
}) {
  const badgeClass = momentTypeBadgeClass(moment.type);
  const typeLabel = tl.types[moment.type] ?? moment.type;
  const question = moment.practiceQuestion ?? tr.howToImprove;

  return (
    <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {typeLabel}
        </span>
        {moment.san && (
          <span className="font-mono text-sm font-medium">
            {moment.ply}. {moment.san}
          </span>
        )}
        <span className="font-medium">{moment.title}</span>
        <button
          onClick={onGoToMove}
          className="ml-auto rounded-md border border-arena-border px-3 py-1 text-xs hover:border-arena-blue hover:text-arena-blue"
        >
          {tr.practiceThis}
        </button>
      </div>

      <p className="mt-3 text-sm font-medium">{question}</p>

      <div className="mt-2 flex flex-col gap-2">
        <textarea
          value={state.userAnswer}
          onChange={(e) => onAnswerChange(e.target.value.slice(0, 500))}
          placeholder={tr.placeholder}
          disabled={state.aiLoading}
          rows={2}
          className="w-full resize-none rounded-md border border-arena-border bg-arena-panel px-3 py-2 text-sm placeholder:text-arena-muted focus:border-arena-blue focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex flex-wrap gap-2">
          {!state.revealed && (
            <button
              onClick={onReveal}
              className="rounded-md border border-arena-border px-3 py-1.5 text-xs font-medium hover:border-arena-gold hover:text-arena-gold"
            >
              {tr.showCoachAnswer}
            </button>
          )}
          <button
            onClick={onAskAi}
            disabled={!state.userAnswer.trim() || state.aiLoading}
            className="rounded-md bg-arena-blue px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.aiLoading ? tr.checking : tr.askAiAnswer}
          </button>
        </div>
      </div>

      {state.revealed && (
        <div className="mt-3 rounded-md border border-arena-gold/30 bg-arena-gold/5 p-3">
          <p className="text-xs font-medium text-arena-gold">{tr.coachAnswer}</p>
          {moment.expectedAnswer && (
            <p className="mt-1 text-sm">{moment.expectedAnswer}</p>
          )}
          {moment.betterPlan && (
            <p className="mt-1 text-xs text-arena-muted">
              <span className="font-medium text-foreground">{tl.betterPlan}:</span>{" "}
              <span className="font-mono">{moment.betterPlan}</span>
            </p>
          )}
          {moment.trainingTip && (
            <p className="mt-1 text-xs text-arena-muted">
              <span className="font-medium text-foreground">{tl.trainingTip}:</span>{" "}
              {moment.trainingTip}
            </p>
          )}
        </div>
      )}

      {state.aiError && (
        <p className="mt-2 text-xs text-arena-muted">
          {state.aiError === "not_configured"
            ? ta.notConfigured
            : ta.error}
        </p>
      )}

      {state.aiResult && (
        <div className="mt-3 rounded-md border border-arena-border bg-arena-panel p-3">
          <p className="text-xs font-medium text-arena-gold">{tr.aiFeedback}</p>
          <p className="mt-1 text-sm">{state.aiResult.answer}</p>
          {state.aiResult.betterPlan && (
            <p className="mt-1 text-xs text-arena-muted">
              <span className="font-medium text-foreground">{tl.betterPlan}:</span>{" "}
              <span className="font-mono">{state.aiResult.betterPlan}</span>
            </p>
          )}
          {state.aiResult.trainingTip && (
            <p className="mt-1 text-xs text-arena-muted">
              <span className="font-medium text-foreground">{tl.trainingTip}:</span>{" "}
              {state.aiResult.trainingTip}
            </p>
          )}
        </div>
      )}
    </div>
  );
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
  const [aiCoach, setAiCoach] = useState<AiAnalysis | null>(null);
  const [aiCoachLoading, setAiCoachLoading] = useState(false);
  const [aiCoachError, setAiCoachError] = useState<"not_configured" | "unavailable" | null>(null);
  const [aiCoachSaved, setAiCoachSaved] = useState(false);
  const [aiCoachSaveError, setAiCoachSaveError] = useState<"migrationNeeded" | "requestFailed" | null>(null);

  const [selectedPly, setSelectedPly] = useState(0);
  const [selectedSan, setSelectedSan] = useState<string | null>(null);
  const [selectedFen, setSelectedFen] = useState("");
  const [jumpToPly, setJumpToPly] = useState<number | undefined>(undefined);
  const [moveQuestion, setMoveQuestion] = useState("");
  const [moveQLoading, setMoveQLoading] = useState(false);
  const [moveQError, setMoveQError] = useState<string | null>(null);
  const [moveQResult, setMoveQResult] = useState<{
    answer: string;
    betterPlan: string;
    trainingTip: string;
  } | null>(null);
  const [moveQHistory, setMoveQHistory] = useState<
    Array<{
      ply: number;
      san: string | null;
      question: string;
      answer: string;
      betterPlan: string;
      trainingTip: string;
    }>
  >([]);

  const [trainingState, setTrainingState] = useState<Record<number, TrainingMomentState>>({});

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

      const [savedMatch, savedReview, savedAi] = await Promise.all([
        loadAccountMatch(supabase, matchId),
        loadAccountReview(supabase, matchId),
        loadSavedAiAnalysis(supabase, matchId),
      ]);
      if (!active) return;

      setAccountMatch(savedMatch.match);
      setAccountReview(savedReview.review);
      setLoadError(savedMatch.error !== null);
      if (savedAi) {
        setAiCoach(savedAi);
        setAiCoachSaved(true);
      }
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
    setAiCoachSaveError(null);

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
        const result: AiAnalysis = {
          mainMistake: data.mainMistake,
          bestAlternative: data.bestAlternative,
          whyImportant: data.whyImportant,
          trainNext: data.trainNext,
          ...(data.keyMoments ? { keyMoments: data.keyMoments } : {}),
        };
        setAiCoach(result);
        setAiCoachSaved(false);
        setTrainingState({});

        if (currentAccountMatch && matchId) {
          const supabase = createClient();
          if (supabase) {
            const { error } = await saveAiAnalysis(supabase, matchId, result);
            if (error) {
              setAiCoachSaveError(error);
            } else {
              setAiCoachSaved(true);
            }
          }
        }
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

  async function handleAskMoveQuestion(
    currentMatch: LocalMatch | AccountMatch,
  ) {
    const question = moveQuestion.trim();
    if (!question) {
      setMoveQError("empty_question");
      return;
    }
    if (question.length > 500) {
      setMoveQError("question_too_long");
      return;
    }

    setMoveQLoading(true);
    setMoveQError(null);
    setMoveQResult(null);

    try {
      const res = await fetch("/api/coach/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          sanMoves: currentMatch.sanMoves,
          selectedPly,
          selectedSan,
          selectedFen,
          existingAnalysis: aiCoach
            ? { mainMistake: aiCoach.mainMistake, trainNext: aiCoach.trainNext }
            : null,
          question,
          result: currentMatch.result,
          playerColor: currentMatch.playerColor,
          moveCount: currentMatch.moveCount,
        }),
      });

      const data = (await res.json()) as MoveQuestionResponse;

      if (data.available) {
        const result = {
          answer: data.answer,
          betterPlan: data.betterPlan,
          trainingTip: data.trainingTip,
        };
        setMoveQResult(result);
        setMoveQHistory((prev) => [
          {
            ply: selectedPly,
            san: selectedSan,
            question,
            ...result,
          },
          ...prev,
        ]);
        setMoveQuestion("");
      } else {
        setMoveQError(data.reason);
      }
    } catch {
      setMoveQError("unavailable");
    } finally {
      setMoveQLoading(false);
    }
  }

  const handlePlyChange = useCallback(
    (ply: number, san: string | null, fen: string) => {
      setSelectedPly(ply);
      setSelectedSan(san);
      setSelectedFen(fen);
    },
    [],
  );

  const match = localMatch ?? accountMatch;

  const replayPositions = useMemo(() => {
    const chess = new Chess();
    const fens: string[] = [chess.fen()];
    for (const san of match?.sanMoves ?? []) {
      try {
        chess.move(san);
        fens.push(chess.fen());
      } catch {
        break;
      }
    }
    return fens;
  }, [match?.sanMoves]);

  if (!loaded) {
    return <p className="py-10 text-sm text-arena-muted">{t.review.loading}</p>;
  }

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

      {/* Workspace: 2-col on lg — left: board+askAI, right: AI coach+timeline+training */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* LEFT column: Replay board + Ask AI */}
        <div className="flex flex-col gap-5">
          {match.sanMoves.length > 0 && (
            <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
              <p className="mb-4 text-sm font-medium text-arena-gold">
                {t.review.replay.eyebrow}
              </p>
              <ReplayBoard
                sanMoves={match.sanMoves}
                playerColor={match.playerColor}
                keyMovePly={aiCoach?.keyMovePly}
                keyMoveSan={aiCoach?.keyMoveSan}
                keyMoveComment={aiCoach?.keyMoveComment}
                jumpToPly={jumpToPly}
                onJumpApplied={() => setJumpToPly(undefined)}
                onPlyChange={handlePlyChange}
              />
            </section>
          )}

          {match.sanMoves.length > 0 && (
            <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
              <p className="text-sm font-medium text-arena-gold">
                {t.review.askMove.eyebrow}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-arena-muted">
                  {t.review.askMove.selectedMove}:
                </span>
                {selectedSan ? (
                  <span className="rounded bg-arena-elevated px-2 py-0.5 font-mono text-sm font-medium">
                    {selectedPly}. {selectedSan}
                  </span>
                ) : (
                  <span className="text-xs text-arena-muted">
                    {t.review.askMove.noMoveSelected}
                  </span>
                )}
              </div>

              {selectedSan && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.review.askMove.quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setMoveQuestion(q)}
                      className="rounded-full border border-arena-border px-3 py-1 text-xs hover:border-arena-blue hover:text-arena-blue"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={moveQuestion}
                  onChange={(e) => setMoveQuestion(e.target.value.slice(0, 500))}
                  placeholder={t.review.askMove.questionPlaceholder}
                  disabled={!selectedSan || moveQLoading}
                  rows={2}
                  className="w-full resize-none rounded-md border border-arena-border bg-arena-elevated px-3 py-2 text-sm placeholder:text-arena-muted focus:border-arena-blue focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-arena-muted">
                    {moveQuestion.length}/500
                  </span>
                  <button
                    onClick={() => void handleAskMoveQuestion(match)}
                    disabled={!selectedSan || !moveQuestion.trim() || moveQLoading}
                    className="rounded-md bg-arena-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {moveQLoading
                      ? t.review.askMove.askingBtn
                      : t.review.askMove.askBtn}
                  </button>
                </div>
              </div>

              {moveQError === "not_configured" && (
                <p className="mt-3 text-sm text-arena-muted">
                  {t.review.askMove.notConfigured}
                </p>
              )}
              {moveQError === "empty_question" && (
                <p className="mt-3 text-sm text-arena-muted">
                  {t.review.askMove.emptyQuestion}
                </p>
              )}
              {moveQError === "question_too_long" && (
                <p className="mt-3 text-sm text-arena-muted">
                  {t.review.askMove.questionTooLong}
                </p>
              )}
              {moveQError &&
                moveQError !== "not_configured" &&
                moveQError !== "empty_question" &&
                moveQError !== "question_too_long" && (
                  <p className="mt-3 text-sm text-arena-muted">
                    {t.review.askMove.error}
                  </p>
                )}

              {moveQResult && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
                    <p className="text-xs text-arena-muted">
                      {t.review.askMove.answer}
                    </p>
                    <p className="mt-1 text-sm">{moveQResult.answer}</p>
                  </div>
                  <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
                    <p className="text-xs text-arena-muted">
                      {t.review.askMove.betterPlan}
                    </p>
                    <p className="mt-1 font-mono text-sm">
                      {moveQResult.betterPlan}
                    </p>
                  </div>
                  <div className="rounded-md border border-arena-border bg-arena-elevated p-4">
                    <p className="text-xs text-arena-muted">
                      {t.review.askMove.trainingTip}
                    </p>
                    <p className="mt-1 text-sm">{moveQResult.trainingTip}</p>
                  </div>
                </div>
              )}

              {moveQHistory.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium text-arena-muted">
                    {t.review.askMove.history}
                  </p>
                  <div className="flex flex-col gap-3">
                    {moveQHistory.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-md border border-arena-border bg-arena-elevated p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {item.san && (
                            <span className="rounded bg-arena-panel px-1.5 py-0.5 font-mono text-xs">
                              {item.ply}. {item.san}
                            </span>
                          )}
                          <span className="text-xs text-arena-muted italic">
                            {item.question}
                          </span>
                        </div>
                        <p className="text-sm">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* RIGHT column: AI Coach summary + Key moments + Training */}
        <div className="flex flex-col gap-5">
          <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-arena-gold">
                  {t.review.aiCoach.eyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {t.review.aiCoach.title}
                </h2>
              </div>
              {!aiCoachLoading && (
                <button
                  onClick={() => void handleGenerateAiCoach(match, localMatch, accountMatch)}
                  className="rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
                >
                  {aiCoach ? t.review.aiCoach.regenerateBtn : t.review.aiCoach.generateBtn}
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
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-arena-muted">
                    {t.review.aiCoach.note}
                  </p>
                  {isAccount && aiCoachSaved && (
                    <span className="rounded-full border border-arena-win/40 bg-arena-win/10 px-3 py-0.5 text-xs text-arena-win">
                      {t.review.aiCoach.saved}
                    </span>
                  )}
                  {!isAccount && (
                    <p className="text-xs text-arena-muted">
                      {t.review.aiCoach.guestNote}
                    </p>
                  )}
                </div>
                {aiCoachSaveError && (
                  <p className="sm:col-span-2 text-xs text-arena-muted">
                    {t.review.aiCoach.saveError}
                  </p>
                )}
              </div>
            )}

            {!aiCoach && !aiCoachLoading && !aiCoachError && (
              <p className="mt-3 text-sm text-arena-muted">
                {isAccount ? t.review.accountBoundary : t.review.boundary}
              </p>
            )}
          </section>

          {match.sanMoves.length > 0 && (
            <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
              <p className="text-sm font-medium text-arena-gold">
                {t.review.timeline.eyebrow}
              </p>
              {!aiCoach?.keyMoments?.length ? (
                <p className="mt-3 text-sm text-arena-muted">
                  {t.review.timeline.noKeyMoments}
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {aiCoach.keyMoments.map((moment, idx) => (
                    <KeyMomentCard
                      key={idx}
                      moment={moment}
                      tl={t.review.timeline}
                      onGoToMove={() => setJumpToPly(moment.ply)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {match.sanMoves.length > 0 && (
            <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
              <p className="text-sm font-medium text-arena-gold">
                {t.review.training.eyebrow}
              </p>
              {(() => {
                const trainingMoments = aiCoach?.keyMoments?.filter((m) =>
                  ["mistake", "critical", "inaccuracy", "turning_point"].includes(m.type),
                ) ?? [];
                if (trainingMoments.length === 0) {
                  return (
                    <p className="mt-3 text-sm text-arena-muted">
                      {t.review.training.noTrainingMoments}
                    </p>
                  );
                }
                return (
                  <div className="mt-4 flex flex-col gap-5">
                    {trainingMoments.map((moment, idx) => {
                      const state: TrainingMomentState = trainingState[moment.ply] ?? {
                        userAnswer: "",
                        revealed: false,
                        aiResult: null,
                        aiLoading: false,
                        aiError: null,
                      };
                      const patchState = (patch: Partial<TrainingMomentState>) =>
                        setTrainingState((prev) => ({
                          ...prev,
                          [moment.ply]: { ...state, ...patch },
                        }));
                      return (
                        <TrainingMomentCard
                          key={idx}
                          moment={moment}
                          state={state}
                          tr={t.review.training}
                          tl={t.review.timeline}
                          ta={t.review.askMove}
                          onGoToMove={() => setJumpToPly(moment.ply)}
                          onAnswerChange={(v) => patchState({ userAnswer: v })}
                          onReveal={() => patchState({ revealed: true })}
                          onAskAi={async () => {
                            const q = state.userAnswer.trim();
                            if (!q) return;
                            patchState({ aiLoading: true, aiError: null, aiResult: null });
                            try {
                              const fen = replayPositions[moment.ply] ?? replayPositions[replayPositions.length - 1] ?? "";
                              const res = await fetch("/api/coach/move", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  locale,
                                  sanMoves: match.sanMoves,
                                  selectedPly: moment.ply,
                                  selectedSan: moment.san ?? null,
                                  selectedFen: fen,
                                  existingAnalysis: aiCoach
                                    ? { mainMistake: aiCoach.mainMistake, trainNext: aiCoach.trainNext }
                                    : null,
                                  question: q,
                                  result: match.result,
                                  playerColor: match.playerColor,
                                  moveCount: match.moveCount,
                                }),
                              });
                              const data = (await res.json()) as MoveQuestionResponse;
                              if (data.available) {
                                patchState({
                                  aiResult: {
                                    answer: data.answer,
                                    betterPlan: data.betterPlan,
                                    trainingTip: data.trainingTip,
                                  },
                                  aiLoading: false,
                                });
                              } else {
                                patchState({ aiError: data.reason, aiLoading: false });
                              }
                            } catch {
                              patchState({ aiError: "unavailable", aiLoading: false });
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </section>
          )}
        </div>
      </div>

      {/* Reference section: demo coach signals + last sequence + habit */}
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
    </div>
  );
}
