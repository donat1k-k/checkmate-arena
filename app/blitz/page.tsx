"use client";

import type React from "react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import type { Color, Square } from "chess.js";
import Board from "@/components/chess/Board";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  BLITZ_PUZZLES_BY_DIFFICULTY,
  getAccuracy,
  loadBlitzStats,
  markHintUsed,
  recordBlitzFail,
  recordBlitzSolve,
  resetBlitzStats,
  type BlitzDifficulty,
  type BlitzPuzzle,
  type BlitzStats,
} from "@/lib/demo/blitz";
import { addArenaCoins } from "@/lib/demo/economy";

type PuzzleState = "idle" | "playing" | "correct" | "wrong" | "timeout";

const SELECT_STYLE = { backgroundColor: "rgba(245,158,11,0.45)" };
const TARGET_STYLE = {
  background: "radial-gradient(circle, rgba(245,158,11,0.55) 25%, transparent 60%)",
};
const WRONG_STYLE = { backgroundColor: "rgba(239,68,68,0.35)" };

function difficultyBadgeClass(d: BlitzDifficulty): string {
  if (d === "easy") return "bg-arena-win/15 text-arena-win border border-arena-win/30";
  if (d === "medium") return "bg-arena-blue/15 text-arena-blue border border-arena-blue/30";
  return "bg-arena-loss/15 text-arena-loss border border-arena-loss/30";
}

function normalizeSan(san: string): string {
  return san.replace(/[+#!?]/g, "").trim();
}

function getMoveSan(from: string, to: string, fen: string): string | null {
  try {
    const chess = new Chess(fen);
    const result = chess.move({ from, to, promotion: "q" });
    return result ? result.san : null;
  } catch {
    return null;
  }
}

function getHintForPuzzle(puzzle: BlitzPuzzle, locale: string): string {
  try {
    const chess = new Chess(puzzle.fen);
    const moves = chess.moves({ verbose: true });
    const solutionNorm = normalizeSan(puzzle.solution);
    const matchedMove = moves.find((m) => normalizeSan(m.san) === solutionNorm);
    if (!matchedMove) return "";
    const pieceNames: Record<string, Record<string, string>> = {
      en: { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" },
      ru: { p: "пешку", n: "коня", b: "слона", r: "ладью", q: "ферзя", k: "короля" },
    };
    const lang = locale === "ru" ? "ru" : "en";
    const pieceName = pieceNames[lang][matchedMove.piece] ?? matchedMove.piece;
    const fromSquare = matchedMove.from.toUpperCase();
    if (locale === "ru") return `Посмотрите на ${pieceName} на ${fromSquare}`;
    return `Look at the ${pieceName} on ${fromSquare}`;
  } catch {
    return "";
  }
}

export default function BlitzPage() {
  const { locale, t } = usePreferences();
  const tb = t.blitz;

  const [selectedDifficulty, setSelectedDifficulty] = useState<BlitzDifficulty>("easy");
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>("idle");
  const [timeLeft, setTimeLeft] = useState(20);
  const [stats, setStats] = useState<BlitzStats>(loadBlitzStats);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState("");
  const [coinsJustEarned, setCoinsJustEarned] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Set<Square>>(new Set());
  const [currentFen, setCurrentFen] = useState<string>("");
  const [wrongSquares, setWrongSquares] = useState<{ from: Square; to: Square } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPuzzles = BLITZ_PUZZLES_BY_DIFFICULTY[selectedDifficulty];
  const puzzle: BlitzPuzzle | undefined = currentPuzzles[puzzleIndex];

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (puzzleState !== "playing" || !puzzle) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setPuzzleState("timeout");
          setStats(recordBlitzFail());
          setShowAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [puzzleState, puzzle, stopTimer]);

  function startPuzzle() {
    stopTimer();
    setShowHint(false);
    setHintText("");
    setShowAnswer(false);
    setCoinsJustEarned(0);
    setSelectedSquare(null);
    setLegalTargets(new Set());
    setWrongSquares(null);
    if (!puzzle) return;
    setCurrentFen(puzzle.fen);
    setTimeLeft(puzzle.timeLimitSeconds);
    setPuzzleState("playing");
  }

  function selectSquare(square: Square, fen: string) {
    try {
      const chess = new Chess(fen);
      const piece = chess.get(square);
      if (!piece) {
        setSelectedSquare(null);
        setLegalTargets(new Set());
        return;
      }
      const sideToMove: "w" | "b" = puzzle?.sideToMove ?? "w";
      if (piece.color !== sideToMove) {
        setSelectedSquare(null);
        setLegalTargets(new Set());
        return;
      }
      const moves = chess.moves({ square, verbose: true });
      setSelectedSquare(square);
      setLegalTargets(new Set(moves.map((m) => m.to as Square)));
    } catch {
      setSelectedSquare(null);
      setLegalTargets(new Set());
    }
  }

  function applyMove(from: Square, to: Square, fen: string): { success: boolean; resultFen: string; moveSan: string | null } {
    try {
      const chess = new Chess(fen);
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return { success: false, resultFen: fen, moveSan: null };
      return { success: true, resultFen: chess.fen(), moveSan: result.san };
    } catch {
      return { success: false, resultFen: fen, moveSan: null };
    }
  }

  function resolveMove(from: Square, to: Square) {
    if (!puzzle || puzzleState !== "playing") return;
    const fen = currentFen || puzzle.fen;
    const { success, resultFen, moveSan } = applyMove(from, to, fen);
    if (!success || !moveSan) {
      setSelectedSquare(null);
      setLegalTargets(new Set());
      return;
    }

    stopTimer();
    setSelectedSquare(null);
    setLegalTargets(new Set());

    if (normalizeSan(moveSan) === normalizeSan(puzzle.solution)) {
      setCurrentFen(resultFen);
      setWrongSquares(null);
      const newStats = recordBlitzSolve(puzzle.id, puzzle.rewardCoins);
      addArenaCoins(puzzle.rewardCoins);
      setStats(newStats);
      setCoinsJustEarned(puzzle.rewardCoins);
      setPuzzleState("correct");
    } else {
      setCurrentFen(resultFen);
      setWrongSquares({ from, to });
      setStats(recordBlitzFail());
      setPuzzleState("wrong");
    }
  }

  function handlePieceDrop(from: Square, to: Square): boolean {
    if (!puzzle || puzzleState !== "playing") return false;
    resolveMove(from, to);
    return true;
  }

  function handleSquareClick(square: Square) {
    if (!puzzle || puzzleState !== "playing") return;
    const fen = currentFen || puzzle.fen;

    if (selectedSquare === null) {
      selectSquare(square, fen);
      return;
    }

    if (legalTargets.has(square)) {
      resolveMove(selectedSquare, square);
      return;
    }

    selectSquare(square, fen);
  }

  function handleNextPuzzle() {
    const nextIndex = puzzleIndex + 1;
    setPuzzleIndex(nextIndex >= currentPuzzles.length ? 0 : nextIndex);
    setPuzzleState("idle");
    setShowHint(false);
    setHintText("");
    setShowAnswer(false);
    setCoinsJustEarned(0);
    setSelectedSquare(null);
    setLegalTargets(new Set());
    setCurrentFen("");
    setWrongSquares(null);
  }

  function handleResetPosition() {
    if (!puzzle) return;
    setCurrentFen(puzzle.fen);
    setSelectedSquare(null);
    setLegalTargets(new Set());
    setWrongSquares(null);
    setPuzzleState("idle");
  }

  function handleHint() {
    if (!puzzle) return;
    const fresh = loadBlitzStats();
    if (fresh.hintUsedThisSession) return;
    const text = getHintForPuzzle(puzzle, locale);
    setHintText(text);
    setShowHint(true);
    setStats(markHintUsed());
  }

  function handleSelectDifficulty(d: BlitzDifficulty) {
    setSelectedDifficulty(d);
    setPuzzleIndex(0);
    setPuzzleState("idle");
    setShowHint(false);
    setHintText("");
    setShowAnswer(false);
    setCoinsJustEarned(0);
    setSelectedSquare(null);
    setLegalTargets(new Set());
    setCurrentFen("");
    setWrongSquares(null);
    stopTimer();
  }

  function handleResetStats() {
    if (!window.confirm(locale === "ru" ? "Сбросить всю статистику Blitz Mate Rush?" : "Reset all Blitz Mate Rush stats?")) return;
    resetBlitzStats();
    setStats(loadBlitzStats());
  }

  const accuracy = getAccuracy(stats);
  const orientation: Color = puzzle?.sideToMove === "b" ? "b" : "w";
  const sideLabel = puzzle ? (puzzle.sideToMove === "w" ? tb.white : tb.black) : "";
  const allDone = puzzleIndex + 1 >= currentPuzzles.length && puzzleState !== "playing" && puzzleState !== "idle";

  const boardFen = currentFen || puzzle?.fen || "";

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selectedSquare) squareStyles[selectedSquare] = SELECT_STYLE;
  legalTargets.forEach((sq) => {
    squareStyles[sq] = TARGET_STYLE;
  });
  if (wrongSquares) {
    squareStyles[wrongSquares.from] = WRONG_STYLE;
    squareStyles[wrongSquares.to] = WRONG_STYLE;
  }

  const DIFFICULTIES: Array<{ key: BlitzDifficulty; locked: boolean }> = [
    { key: "easy", locked: false },
    { key: "medium", locked: false },
    { key: "hard", locked: false },
    { key: "proRush" as BlitzDifficulty, locked: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <section className="border-b border-arena-border pb-5 pt-2">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{tb.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{tb.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-arena-muted">{tb.intro}</p>
      </section>

      {/* ── Difficulty selector ── */}
      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-arena-muted">{tb.difficultyLabel}</p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(({ key, locked }) => {
            const isSelected = !locked && key === selectedDifficulty;
            const label = key === ("proRush" as string) ? tb.difficulties.proRush : tb.difficulties[key as BlitzDifficulty];
            const note = key === ("proRush" as string) ? tb.difficultyNotes.proRush : tb.difficultyNotes[key as BlitzDifficulty];
            return (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => !locked && handleSelectDifficulty(key)}
                className={
                  locked
                    ? "flex cursor-not-allowed flex-col items-start rounded-lg border border-arena-border bg-arena-panel px-4 py-3 opacity-50"
                    : isSelected
                    ? "flex flex-col items-start rounded-lg border border-arena-blue/40 bg-arena-amber-bg px-4 py-3"
                    : "flex flex-col items-start rounded-lg border border-arena-border bg-arena-panel px-4 py-3 hover:border-arena-blue"
                }
              >
                <span className={`mb-1 text-sm font-semibold ${locked ? "text-arena-muted" : isSelected ? "text-arena-blue" : "text-arena-text"}`}>
                  {label}
                  {locked && <span className="ml-2 rounded bg-arena-elevated px-1.5 py-0.5 text-[10px] text-arena-muted">Pro</span>}
                </span>
                <span className="text-xs text-arena-muted">{note}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Puzzle area ── */}
      {puzzle ? (
        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          {/* Left: Board */}
          <div className="flex flex-col gap-4">
            {/* Puzzle meta */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${difficultyBadgeClass(puzzle.difficulty)}`}>
                {tb.difficulties[puzzle.difficulty]}
              </span>
              <span className="font-mono text-xs text-arena-muted">
                {tb.puzzleOf(puzzleIndex + 1, currentPuzzles.length)}
              </span>
              {puzzleState === "playing" && (
                <span className={`font-mono text-sm font-bold ${timeLeft <= 5 ? "text-arena-loss" : "text-arena-blue"}`}>
                  {tb.timeLeft(timeLeft)}
                </span>
              )}
            </div>

            <div>
              <p className="text-base font-bold">{locale === "ru" ? puzzle.titleRu : puzzle.title}</p>
              <p className="text-xs text-arena-muted">{tb.toMove(sideLabel)}</p>
            </div>

            {/* Board */}
            <div className="overflow-hidden rounded-lg border border-arena-border" style={{ maxWidth: 380 }}>
              <Board
                fen={boardFen}
                orientation={orientation}
                squareStyles={squareStyles}
                allowDragging={puzzleState === "playing"}
                onSquareClick={handleSquareClick}
                onPieceDrop={handlePieceDrop}
              />
            </div>

            {/* Controls */}
            {puzzleState === "idle" && (
              <button
                type="button"
                onClick={startPuzzle}
                className="rounded-md bg-arena-blue px-5 py-2.5 font-semibold text-white hover:opacity-90"
              >
                {tb.startPuzzle}
              </button>
            )}

            {puzzleState === "playing" && (
              <div className="flex flex-wrap items-center gap-2">
                {!stats.hintUsedThisSession ? (
                  <button
                    type="button"
                    onClick={handleHint}
                    className="rounded-md border border-arena-border bg-arena-panel px-3 py-1.5 text-sm font-medium hover:border-arena-blue"
                  >
                    {tb.hintBtn}
                  </button>
                ) : (
                  <span className="text-xs text-arena-muted">{tb.hintLimitReached}</span>
                )}
                {showHint && hintText && (
                  <span className="rounded border border-arena-amber-border bg-arena-amber-bg px-2.5 py-1 text-xs font-medium text-arena-blue">
                    {hintText}
                  </span>
                )}
              </div>
            )}

            {puzzleState === "correct" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-arena-win/30 bg-arena-win/10 px-4 py-2.5">
                  <span className="text-base font-bold text-arena-win">{tb.correct}</span>
                  {coinsJustEarned > 0 && (
                    <span className="font-mono text-sm font-bold text-arena-gold">
                      {tb.coinsEarned(coinsJustEarned)}
                    </span>
                  )}
                </div>
                <div className="rounded-md border border-arena-border bg-arena-panel px-4 py-3 text-sm">
                  <p className="font-semibold text-arena-muted">{tb.explanation}</p>
                  <p className="mt-1 text-arena-muted">{locale === "ru" ? puzzle.explanationRu : puzzle.explanation}</p>
                </div>
                <button
                  type="button"
                  onClick={handleNextPuzzle}
                  className="rounded-md bg-arena-blue px-5 py-2.5 font-semibold text-white hover:opacity-90"
                >
                  {tb.nextPuzzle}
                </button>
              </div>
            )}

            {(puzzleState === "wrong" || puzzleState === "timeout") && (
              <div className="flex flex-col gap-3">
                <div className={`rounded-md px-4 py-2.5 ${puzzleState === "timeout" ? "border border-arena-loss/30 bg-arena-loss/10" : "border border-arena-loss/30 bg-arena-loss/10"}`}>
                  <span className="text-base font-bold text-arena-loss">
                    {puzzleState === "timeout" ? tb.timeUp : tb.wrong}
                  </span>
                </div>
                {showAnswer && (
                  <div className="rounded-md border border-arena-border bg-arena-panel px-4 py-3 text-sm">
                    <p className="font-semibold text-arena-muted">{tb.answer}</p>
                    <p className="mt-1 font-mono font-bold text-arena-text">{puzzle.solution}</p>
                    <p className="mt-2 text-arena-muted">{locale === "ru" ? puzzle.explanationRu : puzzle.explanation}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {puzzleState === "wrong" && (
                    <button type="button" onClick={handleResetPosition} className="rounded-md border border-arena-border bg-arena-panel px-4 py-2 text-sm font-medium hover:border-arena-blue">
                      {tb.tryAgain}
                    </button>
                  )}
                  {!showAnswer && (
                    <button type="button" onClick={() => setShowAnswer(true)} className="rounded-md border border-arena-border bg-arena-panel px-4 py-2 text-sm font-medium hover:border-arena-blue">
                      {tb.showAnswer}
                    </button>
                  )}
                  <button type="button" onClick={handleNextPuzzle} className="rounded-md border border-arena-border bg-arena-panel px-4 py-2 text-sm font-medium hover:border-arena-blue">
                    {tb.nextPuzzle}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats + teasers */}
          <div className="flex flex-col gap-4 lg:max-w-[280px]">
            {/* Stats */}
            <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-arena-muted">{tb.stats}</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: tb.statSolved, value: String(stats.solved) },
                  { label: tb.statStreak, value: String(stats.streak) },
                  { label: tb.statBestStreak, value: String(stats.bestStreak) },
                  { label: tb.statAccuracy, value: `${accuracy}%` },
                  { label: tb.statCoins, value: `${stats.coinsEarned} AC` },
                ] as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label} className="rounded border border-arena-border bg-arena-elevated px-3 py-2">
                    <p className="font-mono text-base font-bold">{value}</p>
                    <p className="text-[10px] uppercase tracking-wide text-arena-muted">{label}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleResetStats}
                className="mt-3 text-xs text-arena-muted hover:text-arena-loss"
              >
                {locale === "ru" ? "Сбросить статистику" : "Reset stats"}
              </button>
            </div>

            {/* Pro teaser */}
            <div className="rounded-lg border border-arena-amber-border bg-arena-amber-bg p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">Pro</p>
              <p className="mt-1 text-sm font-semibold">{tb.proTeaser}</p>
              <Link
                href="/pro"
                className="mt-3 inline-flex rounded-md border border-arena-border bg-arena-panel px-3 py-1.5 text-xs font-medium hover:border-arena-blue"
              >
                {locale === "ru" ? "Смотреть Pro" : "View Pro"}
              </Link>
            </div>

            {/* All puzzles done */}
            {allDone && (
              <div className="rounded-lg border border-arena-border bg-arena-panel p-4 text-sm text-arena-muted">
                {tb.noMorePuzzles}
              </div>
            )}

            {/* Pro Rush locked */}
            <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">Pro Rush</p>
              <p className="mt-1 text-sm text-arena-muted">{tb.proRushLocked}</p>
              <Link
                href="/pro"
                className="mt-3 inline-flex rounded-md border border-arena-border bg-arena-elevated px-3 py-1.5 text-xs font-medium hover:border-arena-blue"
              >
                {locale === "ru" ? "Смотреть планы" : "View plans"}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-arena-muted">{tb.noMorePuzzles}</p>
      )}
    </div>
  );
}
