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

function momentQBadgeClass(type: AiKeyMoment["type"]): string {
  switch (type) {
    case "good": return "good";
    case "inaccuracy": return "inaccuracy";
    case "mistake": return "mistake";
    case "critical": return "blunder";
    case "turning_point": return "strong";
  }
}

function momentBorderColor(type: AiKeyMoment["type"]): string {
  switch (type) {
    case "good": return "var(--color-arena-win)";
    case "inaccuracy": return "#d97706";
    case "mistake": return "#ea580c";
    case "critical": return "var(--color-arena-loss)";
    case "turning_point": return "var(--color-arena-blue)";
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
  const typeLabel = tl.types[moment.type] ?? moment.type;
  return (
    <div
      className="min-w-0 rounded border border-arena-border bg-arena-elevated p-3 break-words"
      style={{ borderLeftWidth: 2, borderLeftColor: momentBorderColor(moment.type) }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`qbadge ${momentQBadgeClass(moment.type)}`}>{typeLabel}</span>
          {moment.san && (
            <span className="font-mono text-xs font-semibold">{moment.ply}. {moment.san}</span>
          )}
          <span className="text-xs font-medium text-arena-text">{moment.title}</span>
        </div>
        <button
          onClick={onGoToMove}
          className="shrink-0 rounded border border-arena-border px-2 py-0.5 text-xs text-arena-muted hover:border-arena-blue hover:text-arena-blue"
        >
          {tl.goToMove}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-arena-muted leading-relaxed">{moment.comment}</p>
      {moment.betterPlan && (
        <p className="mt-1 text-xs text-arena-muted">
          <span className="font-medium text-arena-text">{tl.betterPlan}:</span>{" "}
          <span className="font-mono">{moment.betterPlan}</span>
        </p>
      )}
    </div>
  );
}

function KeyMomentsPanel({
  className = "",
  keyMoments,
  moveMeta,
  tl,
  onGoToMove,
}: {
  className?: string;
  keyMoments: AiKeyMoment[] | undefined;
  moveMeta: string;
  tl: TimelineStrings;
  onGoToMove: (ply: number) => void;
}) {
  return (
    <div className={`panel min-w-0 ${className}`}>
      <div className="panel-hd">
        <span className="panel-ttl">{tl.eyebrow}</span>
        <span className="font-mono text-[10px] text-arena-muted">{moveMeta}</span>
      </div>
      <div className="p-3">
        {!keyMoments?.length ? (
          <p className="py-1 text-xs text-arena-muted">{tl.noKeyMoments}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {keyMoments.map((moment, index) => (
              <KeyMomentCard
                key={index}
                moment={moment}
                tl={tl}
                onGoToMove={() => onGoToMove(moment.ply)}
              />
            ))}
          </div>
        )}
      </div>
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
  const typeLabel = tl.types[moment.type] ?? moment.type;
  const question = moment.practiceQuestion ?? tr.howToImprove;

  return (
    <div
      className="min-w-0 rounded border border-arena-border bg-arena-elevated p-3 break-words"
      style={{ borderLeftWidth: 2, borderLeftColor: momentBorderColor(moment.type) }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`qbadge ${momentQBadgeClass(moment.type)}`}>{typeLabel}</span>
        {moment.san && (
          <span className="font-mono text-xs font-semibold">{moment.ply}. {moment.san}</span>
        )}
        <span className="text-xs font-medium text-arena-text">{moment.title}</span>
        <button
          onClick={onGoToMove}
          className="ml-auto rounded border border-arena-border px-2 py-0.5 text-xs text-arena-muted hover:border-arena-blue hover:text-arena-blue"
        >
          {tr.practiceThis}
        </button>
      </div>

      <p className="text-xs font-medium text-arena-text mb-2">{question}</p>

      <div className="flex flex-col gap-2">
        <textarea
          value={state.userAnswer}
          onChange={(e) => onAnswerChange(e.target.value.slice(0, 500))}
          placeholder={tr.placeholder}
          disabled={state.aiLoading}
          rows={2}
          className="w-full resize-none rounded border border-arena-border bg-arena-panel px-2.5 py-1.5 text-xs placeholder:text-arena-muted focus:border-arena-blue focus:outline-none disabled:opacity-50"
        />
        <div className="flex flex-wrap gap-2">
          {!state.revealed && (
            <button
              onClick={onReveal}
              className="rounded border border-arena-border px-2.5 py-1 text-xs font-medium hover:border-arena-gold hover:text-arena-gold"
            >
              {tr.showCoachAnswer}
            </button>
          )}
          <button
            onClick={onAskAi}
            disabled={!state.userAnswer.trim() || state.aiLoading}
            className="rounded bg-arena-blue px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {state.aiLoading ? tr.checking : tr.askAiAnswer}
          </button>
        </div>
      </div>

      {state.revealed && (
        <div className="mt-2 rounded border border-arena-gold/30 bg-arena-gold/5 p-2.5">
          <p className="text-xs font-semibold text-arena-gold">{tr.coachAnswer}</p>
          {moment.expectedAnswer && <p className="mt-1 text-xs">{moment.expectedAnswer}</p>}
          {moment.betterPlan && (
            <p className="mt-1 text-xs text-arena-muted">
              <span className="font-medium text-arena-text">{tl.betterPlan}:</span>{" "}
              <span className="font-mono">{moment.betterPlan}</span>
            </p>
          )}
        </div>
      )}

      {state.aiError && (
        <p className="mt-2 text-xs text-arena-muted">
          {state.aiError === "not_configured" ? ta.notConfigured : ta.error}
        </p>
      )}

      {state.aiResult && (
        <div className="mt-2 rounded border border-arena-border bg-arena-panel p-2.5">
          <p className="text-xs font-semibold text-arena-gold">{tr.aiFeedback}</p>
          <p className="mt-1 text-xs">{state.aiResult.answer}</p>
          {state.aiResult.betterPlan && (
            <p className="mt-1 text-xs text-arena-muted">
              <span className="font-medium text-arena-text">{tl.betterPlan}:</span>{" "}
              <span className="font-mono">{state.aiResult.betterPlan}</span>
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
    answer: string; betterPlan: string; trainingTip: string;
  } | null>(null);
  const [moveQHistory, setMoveQHistory] = useState<Array<{
    ply: number; san: string | null; question: string;
    answer: string; betterPlan: string; trainingTip: string;
  }>>([]);

  const [trainingState, setTrainingState] = useState<Record<number, TrainingMomentState>>({});

  useEffect(() => {
    let active = true;
    async function loadReview() {
      const savedLocalMatch = loadMatches().find((m) => m.id === matchId) ?? null;
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
      if (savedAi) { setAiCoach(savedAi); setAiCoachSaved(true); }
      setLoaded(true);
    }
    void loadReview();
    return () => { active = false; };
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
          result: currentMatch.result, finish,
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
            if (error) setAiCoachSaveError(error);
            else setAiCoachSaved(true);
          }
        }
      } else {
        setAiCoachError(data.reason === "not_configured" ? "not_configured" : "unavailable");
      }
    } catch {
      setAiCoachError("unavailable");
    } finally {
      setAiCoachLoading(false);
    }
  }

  async function handleAskMoveQuestion(currentMatch: LocalMatch | AccountMatch) {
    const question = moveQuestion.trim();
    if (!question) { setMoveQError("empty_question"); return; }
    if (question.length > 500) { setMoveQError("question_too_long"); return; }
    setMoveQLoading(true);
    setMoveQError(null);
    setMoveQResult(null);
    try {
      const res = await fetch("/api/coach/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale, sanMoves: currentMatch.sanMoves,
          selectedPly, selectedSan, selectedFen,
          existingAnalysis: aiCoach
            ? { mainMistake: aiCoach.mainMistake, trainNext: aiCoach.trainNext }
            : null,
          question, result: currentMatch.result,
          playerColor: currentMatch.playerColor,
          moveCount: currentMatch.moveCount,
        }),
      });
      const data = (await res.json()) as MoveQuestionResponse;
      if (data.available) {
        const result = { answer: data.answer, betterPlan: data.betterPlan, trainingTip: data.trainingTip };
        setMoveQResult(result);
        setMoveQHistory((prev) => [{ ply: selectedPly, san: selectedSan, question, ...result }, ...prev]);
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
      try { chess.move(san); fens.push(chess.fen()); } catch { break; }
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
        <Link href="/profile" className="mt-4 inline-flex rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90">
          {t.review.backToProfile}
        </Link>
      </section>
    );
  }

  const review = localMatch
    ? buildDemoCoachReview(localMatch, locale)
    : accountReviewView(accountMatch as AccountMatch, accountReview, locale);
  const opponentName = getOpponentDisplayName(match.opponentNickname, t.match.opponent.localRival);
  const isAccount = accountMatch !== null;

  const playerNickname = localMatch?.guestNickname ?? accountMatch?.playerNickname ?? "Player";
  const opponentInitial = opponentName[0]?.toUpperCase() ?? "O";
  const playerInitial = playerNickname[0]?.toUpperCase() ?? "P";

  const resultStr = match.result === "win" ? "1 – 0" : match.result === "loss" ? "0 – 1" : "½ – ½";
  const resultBadgeClass = match.result === "win"
    ? "bg-arena-win/10 border border-arena-win/30 text-arena-win"
    : match.result === "loss"
    ? "bg-arena-loss/10 border border-arena-loss/30 text-arena-loss"
    : "bg-arena-elevated border border-arena-border text-arena-muted";

  const trainingMoments = aiCoach?.keyMoments?.filter((m) =>
    ["mistake", "critical", "inaccuracy", "turning_point"].includes(m.type)
  ) ?? [];

  return (
    <div className="flex flex-col gap-0 -mx-4 -mt-5 sm:-mt-6">
      {/* ── Game Header ── */}
      <div className="border-b border-arena-border bg-arena-panel px-4 py-3">
        <div className="mx-auto max-w-[1520px]">
          <div className="flex flex-wrap items-center gap-4">
            {/* Opening + subtitle */}
            <div className="min-w-0">
              <div
                className="text-base font-semibold text-arena-text"
                style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
              >
                {review.headline}
              </div>
              <div className="font-mono text-xs text-arena-muted mt-0.5">
                {t.review.eyebrow} · {finishLabel(localMatch, accountMatch, t)} · {match.moveCount} {t.review.fullMoves(match.moveCount).replace(/\d+\s*/, "")}
              </div>
            </div>

            {/* Players */}
            <div className="ml-auto flex items-center gap-2.5 flex-wrap">
              {/* White / player */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold bg-arena-elevated border border-arena-border text-arena-text">
                  {match.playerColor === "w" ? playerInitial : opponentInitial}
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight">
                    {match.playerColor === "w" ? playerNickname : opponentName}
                  </div>
                  <div className="font-mono text-[10px] text-arena-muted">
                    {match.playerColor === "w" ? (localMatch?.ratingBefore ?? match.ratingDelta) : "—"}
                  </div>
                </div>
              </div>

              {/* Result separator */}
              <div className="font-mono text-sm font-bold bg-arena-elevated border border-arena-border px-2.5 py-1 rounded">
                {resultStr}
              </div>

              {/* Black / opponent */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold bg-arena-text text-arena-bg">
                  {match.playerColor === "b" ? playerInitial : opponentInitial}
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight">
                    {match.playerColor === "b" ? playerNickname : opponentName}
                  </div>
                  <div className="font-mono text-[10px] text-arena-muted">—</div>
                </div>
              </div>
            </div>

            {/* Result badge + nav */}
            <div className="flex items-center gap-2">
              <span className={`rounded px-2.5 py-1 text-xs font-semibold ${resultBadgeClass}`}>
                {t.match.result[match.result]}
                {" "}
                <span className={match.ratingDelta >= 0 ? "text-arena-win" : "text-arena-loss"}>
                  {match.ratingDelta > 0 ? "+" : ""}{match.ratingDelta}
                </span>
              </span>
              <Link href="/play" className="rounded bg-arena-blue px-3 py-1 text-xs font-semibold text-white hover:opacity-90">
                {t.common.playAgain}
              </Link>
              <Link href="/profile" className="rounded border border-arena-border px-3 py-1 text-xs font-medium hover:border-arena-gold">
                {t.common.profile}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-col workspace ── */}
      <div className="px-4 pt-3.5 pb-6">
        <div className="grid items-start gap-3 md:grid-cols-[minmax(320px,42%)_minmax(180px,24%)_minmax(0,1fr)]">
          {/* ══ COL 1: BOARD ══ */}
          <div className="order-1 min-w-0 md:sticky md:top-[60px]">
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
          </div>

          {/* ══ COL 2: KEY MOMENTS + NOTATION ══ */}
          <div className="order-3 flex min-w-0 flex-col gap-3 md:order-none">
            {/* Key Moments */}
            <KeyMomentsPanel
              className="hidden md:block"
              keyMoments={aiCoach?.keyMoments}
              moveMeta={`${match.moveCount} ${t.review.fullMoves(match.moveCount).replace(/\d+\s*/, "")}`}
              tl={t.review.timeline}
              onGoToMove={setJumpToPly}
            />

            {/* Stats mini-panel */}
            <div className="panel">
              <div className="panel-hd">
                <span className="panel-ttl">{t.review.finish}</span>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-arena-muted">{t.review.finish}</span>
                  <span className="font-mono text-xs font-semibold">{finishLabel(localMatch, accountMatch, t)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-arena-muted">
                    {isAccount ? t.review.ratingDelta : t.review.ratingPath}
                  </span>
                  <span className={`font-mono text-xs font-semibold ${match.ratingDelta >= 0 ? "text-arena-win" : "text-arena-loss"}`}>
                    {localMatch ? `${localMatch.ratingBefore} → ${localMatch.ratingAfter}` : `${match.ratingDelta > 0 ? "+" : ""}${match.ratingDelta}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-arena-muted">{t.review.moveTrace}</span>
                  <span className="font-mono text-xs font-semibold">{t.review.fullMoves(match.moveCount)}</span>
                </div>
              </div>
            </div>

            {/* Last sequence */}
            {match.sanMoves.length > 0 && (
              <div className="panel">
                <div className="panel-hd">
                  <span className="panel-ttl">{t.review.sequenceTitle}</span>
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {match.sanMoves.slice(-6).map((move, i) => (
                    <span key={i} className="rounded bg-arena-elevated px-2 py-0.5 font-mono text-xs">{move}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ COL 3: AI PANEL ══ */}
          <div className="order-2 flex min-w-0 flex-col gap-3 md:order-none">
            <div className="ai-panel">
              {/* Coach Summary */}
              <div className="ai-sec order-2 md:order-1">
                <div className="ai-head">
                  <div className="ai-icon">◈</div>
                  <div>
                    <div className="ai-name">{t.review.aiCoach.title}</div>
                    <div className="text-[10px] text-arena-muted">{t.review.aiCoach.eyebrow}</div>
                  </div>
                  {aiCoach && (
                    <div className="acc-chip">
                      {match.result === "win" ? "✓ Win" : match.result === "loss" ? "✗ Loss" : "½ Draw"}
                    </div>
                  )}
                </div>

                {aiCoach && (
                  <div className="coach-stats">
                    <div>
                      <div className="cstat-val" style={{ color: "var(--color-arena-loss)" }}>
                        {aiCoach.keyMoments?.filter(m => m.type === "critical").length ?? 0}
                      </div>
                      <div className="cstat-lbl">Blunders</div>
                    </div>
                    <div>
                      <div className="cstat-val" style={{ color: "#ea580c" }}>
                        {aiCoach.keyMoments?.filter(m => m.type === "mistake").length ?? 0}
                      </div>
                      <div className="cstat-lbl">Mistakes</div>
                    </div>
                    <div>
                      <div className="cstat-val" style={{ color: "#d97706" }}>
                        {aiCoach.keyMoments?.filter(m => m.type === "inaccuracy").length ?? 0}
                      </div>
                      <div className="cstat-lbl">Inaccur.</div>
                    </div>
                    <div>
                      <div className="cstat-val" style={{ color: "var(--color-arena-win)" }}>
                        {aiCoach.keyMoments?.filter(m => m.type === "good").length ?? 0}
                      </div>
                      <div className="cstat-lbl">Good</div>
                    </div>
                  </div>
                )}

                {aiCoach && (
                  <div className="flex flex-col gap-2">
                    <div className="rounded border border-arena-border p-2.5" style={{ borderLeftWidth: 2, borderLeftColor: "var(--color-arena-blue)" }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-arena-muted mb-1">{t.review.aiCoach.mainMistake}</div>
                      <p className="coach-text mt-0">{aiCoach.mainMistake}</p>
                    </div>
                    <div className="rounded border border-arena-border p-2.5" style={{ borderLeftWidth: 2, borderLeftColor: "var(--color-arena-gold)" }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-arena-muted mb-1">{t.review.aiCoach.bestAlternative}</div>
                      <p className="coach-text mt-0 font-mono">{aiCoach.bestAlternative}</p>
                    </div>
                    <div className="rounded border border-arena-border p-2.5" style={{ borderLeftWidth: 2, borderLeftColor: "var(--color-arena-win)" }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-arena-muted mb-1">{t.review.aiCoach.trainNext}</div>
                      <p className="coach-text mt-0">{aiCoach.trainNext}</p>
                    </div>
                  </div>
                )}

                {!aiCoach && !aiCoachLoading && !aiCoachError && (
                  <p className="text-xs text-arena-muted mb-2">
                    {isAccount ? t.review.accountBoundary : t.review.boundary}
                  </p>
                )}
                {aiCoachLoading && (
                  <p className="text-xs text-arena-muted animate-pulse mb-2">{t.review.aiCoach.generating}</p>
                )}
                {aiCoachError === "not_configured" && (
                  <p className="text-xs text-arena-muted mb-2">{t.review.aiCoach.notConfigured}</p>
                )}
                {aiCoachError === "unavailable" && (
                  <p className="text-xs text-arena-muted mb-2">{t.review.aiCoach.error}</p>
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-arena-border">
                  {!aiCoachLoading && (
                    <button
                      onClick={() => void handleGenerateAiCoach(match, localMatch, accountMatch)}
                      className="rounded bg-arena-blue px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      {aiCoach ? t.review.aiCoach.regenerateBtn : t.review.aiCoach.generateBtn}
                    </button>
                  )}
                  {isAccount && aiCoachSaved && (
                    <span className="rounded-full border border-arena-win/40 bg-arena-win/10 px-2 py-0.5 text-xs text-arena-win">
                      {t.review.aiCoach.saved}
                    </span>
                  )}
                  {!isAccount && (
                    <p className="text-[10px] text-arena-muted">{t.review.aiCoach.guestNote}</p>
                  )}
                </div>
                {aiCoachSaveError && (
                  <p className="text-xs text-arena-muted mt-1">{t.review.aiCoach.saveError}</p>
                )}
              </div>

              {/* Ask AI section */}
              {match.sanMoves.length > 0 && (
                <div className="ai-sec order-1 md:order-2">
                  <div className="ai-sec-label">
                    {t.review.askMove.eyebrow}
                    {selectedSan && (
                      <span className="font-mono text-[10px] text-arena-muted font-normal normal-case">
                        {selectedPly}. {selectedSan}
                      </span>
                    )}
                  </div>

                  {/* Chat history */}
                  {moveQHistory.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3 max-h-[240px] overflow-y-auto">
                      {[...moveQHistory].reverse().map((item, i) => (
                        <div key={i} className="flex flex-col gap-1.5">
                          <div className="ai-msg-user">{item.question}</div>
                          <div className="ai-msg-ai">{item.answer}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current result */}
                  {moveQResult && moveQHistory.length === 0 && (
                    <div className="ai-msg-ai mb-3">{moveQResult.answer}</div>
                  )}

                  {/* Quick questions */}
                  {selectedSan && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {t.review.askMove.quickQuestions.slice(0, 3).map((q) => (
                        <button
                          key={q}
                          onClick={() => setMoveQuestion(q)}
                          className="rounded-full border border-arena-border px-2 py-0.5 text-[10px] hover:border-arena-blue hover:text-arena-blue"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input row */}
                  <div className="ask-row">
                    <input
                      value={moveQuestion}
                      onChange={(e) => setMoveQuestion(e.target.value.slice(0, 500))}
                      placeholder={selectedSan ? t.review.askMove.questionPlaceholder : t.review.askMove.noMoveSelected}
                      disabled={!selectedSan || moveQLoading}
                      className="ask-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleAskMoveQuestion(match);
                        }
                      }}
                    />
                    <button
                      onClick={() => void handleAskMoveQuestion(match)}
                      disabled={!selectedSan || !moveQuestion.trim() || moveQLoading}
                      className="ask-btn"
                    >
                      {moveQLoading ? "…" : "→"}
                    </button>
                  </div>

                  {moveQError === "not_configured" && (
                    <p className="mt-2 text-[10px] text-arena-muted">{t.review.askMove.notConfigured}</p>
                  )}
                  {moveQError && moveQError !== "not_configured" && moveQError !== "empty_question" && moveQError !== "question_too_long" && (
                    <p className="mt-2 text-[10px] text-arena-muted">{t.review.askMove.error}</p>
                  )}
                </div>
              )}

              <KeyMomentsPanel
                className="order-3 md:hidden"
                keyMoments={aiCoach?.keyMoments}
                moveMeta={`${match.moveCount} ${t.review.fullMoves(match.moveCount).replace(/\d+\s*/, "")}`}
                tl={t.review.timeline}
                onGoToMove={setJumpToPly}
              />

              {/* Training from Mistakes */}
              {match.sanMoves.length > 0 && (
                <div className="ai-sec order-4">
                  <div className="ai-sec-label">{t.review.training.eyebrow}</div>
                  {trainingMoments.length === 0 ? (
                    <p className="text-xs text-arena-muted">{t.review.training.noTrainingMoments}</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {trainingMoments.map((moment, idx) => {
                        const state: TrainingMomentState = trainingState[moment.ply] ?? {
                          userAnswer: "", revealed: false, aiResult: null, aiLoading: false, aiError: null,
                        };
                        const patchState = (patch: Partial<TrainingMomentState>) =>
                          setTrainingState((prev) => ({ ...prev, [moment.ply]: { ...state, ...patch } }));
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
                                    locale, sanMoves: match.sanMoves,
                                    selectedPly: moment.ply, selectedSan: moment.san ?? null,
                                    selectedFen: fen,
                                    existingAnalysis: aiCoach
                                      ? { mainMistake: aiCoach.mainMistake, trainNext: aiCoach.trainNext }
                                      : null,
                                    question: q, result: match.result,
                                    playerColor: match.playerColor, moveCount: match.moveCount,
                                  }),
                                });
                                const data = (await res.json()) as MoveQuestionResponse;
                                if (data.available) {
                                  patchState({ aiResult: { answer: data.answer, betterPlan: data.betterPlan, trainingTip: data.trainingTip }, aiLoading: false });
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
                  )}
                </div>
              )}

              {/* Training advice */}
              <div className="ai-sec order-5">
                <div className="ai-sec-label">{t.review.trainEyebrow}</div>
                <p className="coach-text">{review.trainingAdvice}</p>
                <p className="text-[10px] text-arena-muted mt-2">
                  {isAccount ? t.review.accountBoundary : t.review.boundary}
                </p>
              </div>
            </div>

            {/* Coach insights */}
            {review.insights.length > 0 && (
              <div className="panel">
                <div className="panel-hd">
                  <span className="panel-ttl">{t.review.signalsTitle}</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {review.insights.map((insight) => (
                    <div key={insight.title} className="rounded border border-arena-border bg-arena-elevated p-2.5">
                      <div className="text-xs font-semibold">{insight.title}</div>
                      <p className="mt-1 text-xs text-arena-muted">{insight.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
