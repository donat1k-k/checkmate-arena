"use client";

import { Fragment, useMemo, useState } from "react";
import { Chess, type Color } from "chess.js";
import Board from "@/components/chess/Board";
import { usePreferences } from "@/components/settings/PreferencesProvider";

type MovePair = {
  moveNumber: number;
  white: string;
  whitePly: number;
  black: string | undefined;
  blackPly: number | undefined;
};

type ReplayBoardProps = {
  sanMoves: string[];
  playerColor: Color;
  keyMovePly?: number;
  keyMoveSan?: string;
  keyMoveComment?: string;
};

export default function ReplayBoard({
  sanMoves,
  playerColor,
  keyMovePly,
  keyMoveSan,
  keyMoveComment,
}: ReplayBoardProps) {
  const { t } = usePreferences();
  const tr = t.review.replay;

  const positions = useMemo(() => {
    const chess = new Chess();
    const fens: string[] = [chess.fen()];
    for (const san of sanMoves) {
      try {
        chess.move(san);
        fens.push(chess.fen());
      } catch {
        break;
      }
    }
    return fens;
  }, [sanMoves]);

  const [currentPly, setCurrentPly] = useState(0);

  const total = positions.length - 1;
  const atStart = currentPly === 0;
  const atEnd = currentPly === total;
  const currentSan = currentPly > 0 ? sanMoves[currentPly - 1] : null;
  const fen = positions[currentPly] ?? positions[positions.length - 1]!;

  const movePairs = useMemo<MovePair[]>(() => {
    const pairs: MovePair[] = [];
    for (let i = 0; i < total; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: sanMoves[i]!,
        whitePly: i + 1,
        black: i + 1 < total ? sanMoves[i + 1] : undefined,
        blackPly: i + 1 < total ? i + 2 : undefined,
      });
    }
    return pairs;
  }, [sanMoves, total]);

  if (total === 0) {
    return <p className="text-sm text-arena-muted">{tr.noMoves}</p>;
  }

  const showKeyMoveBtn =
    keyMovePly !== undefined &&
    keyMovePly > 0 &&
    keyMovePly <= total &&
    currentPly !== keyMovePly;

  const showKeyMoveComment =
    keyMovePly !== undefined &&
    currentPly === keyMovePly &&
    !!keyMoveComment;

  const navBtnClass =
    "rounded border border-arena-border px-2.5 py-1 text-sm hover:border-arena-blue disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
      {/* Board + controls */}
      <div className="flex flex-col gap-3">
        <Board
          fen={fen}
          orientation={playerColor}
          squareStyles={{}}
          allowDragging={false}
          onSquareClick={() => {}}
          onPieceDrop={() => false}
        />

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            aria-label={tr.btnStart}
            disabled={atStart}
            onClick={() => setCurrentPly(0)}
            className={navBtnClass}
          >
            ⏮
          </button>
          <button
            aria-label={tr.btnPrev}
            disabled={atStart}
            onClick={() => setCurrentPly((p) => Math.max(0, p - 1))}
            className={navBtnClass}
          >
            ◀
          </button>
          <button
            aria-label={tr.btnNext}
            disabled={atEnd}
            onClick={() => setCurrentPly((p) => Math.min(total, p + 1))}
            className={navBtnClass}
          >
            ▶
          </button>
          <button
            aria-label={tr.btnEnd}
            disabled={atEnd}
            onClick={() => setCurrentPly(total)}
            className={navBtnClass}
          >
            ⏭
          </button>
          <span className="ml-2 text-xs text-arena-muted">
            {tr.moveOf(currentPly, total)}
          </span>
        </div>

        {/* Current move label */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-arena-muted">{tr.currentMove}:</span>
          <span className="font-mono text-sm font-medium">
            {currentSan ?? tr.startPosition}
          </span>
        </div>

        {/* Key move comment */}
        {showKeyMoveComment && (
          <div className="rounded-md border border-arena-gold/30 bg-arena-gold/10 p-3">
            <p className="text-xs font-medium text-arena-gold">{tr.keyMoment}</p>
            <p className="mt-1 text-sm">{keyMoveComment}</p>
          </div>
        )}

        {/* Go to key move */}
        {showKeyMoveBtn && (
          <button
            onClick={() => setCurrentPly(keyMovePly)}
            className="self-start rounded-md border border-arena-gold/50 px-3 py-1.5 text-xs font-medium text-arena-gold hover:border-arena-gold"
          >
            ✦ {tr.goToKeyMove}
            {keyMoveSan ? ` (${keyMoveSan})` : ""}
          </button>
        )}
      </div>

      {/* Move list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-arena-muted">{tr.eyebrow}</p>
        <div className="max-h-[420px] overflow-y-auto rounded-md border border-arena-border bg-arena-elevated p-2">
          <div className="grid grid-cols-[2rem_1fr_1fr] gap-x-1 gap-y-0.5">
            {movePairs.map(({ moveNumber, white, whitePly, black, blackPly }) => (
              <Fragment key={moveNumber}>
                <span className="self-center pr-1 text-right text-xs text-arena-muted">
                  {moveNumber}.
                </span>
                <button
                  onClick={() => setCurrentPly(whitePly)}
                  className={`rounded px-1.5 py-0.5 text-left font-mono text-sm transition-colors ${
                    currentPly === whitePly
                      ? "bg-arena-blue text-white"
                      : "hover:bg-arena-panel"
                  }`}
                >
                  {white}
                </button>
                {black !== undefined && blackPly !== undefined ? (
                  <button
                    onClick={() => setCurrentPly(blackPly)}
                    className={`rounded px-1.5 py-0.5 text-left font-mono text-sm transition-colors ${
                      currentPly === blackPly
                        ? "bg-arena-blue text-white"
                        : "hover:bg-arena-panel"
                    }`}
                  >
                    {black}
                  </button>
                ) : (
                  <span />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
