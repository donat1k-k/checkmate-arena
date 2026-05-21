"use client";

import { useReducer, useRef, useState } from "react";
import type { Color, Square } from "chess.js";
import { ChessGame, type GameStatus, type PromotionPiece } from "@/lib/chess/engine";
import Board from "@/components/chess/Board";
import MoveList from "@/components/chess/MoveList";

const COLOR_NAME: Record<Color, string> = { w: "White", b: "Black" };

function resultText(status: GameStatus): string {
  switch (status.state) {
    case "checkmate":
      return `Checkmate — ${COLOR_NAME[status.winner]} wins`;
    case "resigned":
      return `${COLOR_NAME[status.winner]} wins by resignation`;
    case "stalemate":
      return "Draw — stalemate";
    case "draw":
      return status.reason === "insufficient"
        ? "Draw — insufficient material"
        : status.reason === "threefold"
          ? "Draw — threefold repetition"
          : "Draw — fifty-move rule";
    default:
      return "";
  }
}

const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(59, 130, 246, 0.45)",
};
const CHECK_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(248, 81, 73, 0.55)",
};
const TARGET_STYLE: React.CSSProperties = {
  background:
    "radial-gradient(circle, rgba(59,130,246,0.55) 22%, transparent 24%)",
};

export default function PlayPage() {
  const gameRef = useRef<ChessGame>(new ChessGame());
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(
    null,
  );

  const game = gameRef.current;
  const status = game.status();
  const gameOver = game.isGameOver();

  function reset() {
    gameRef.current = new ChessGame();
    setSelected(null);
    setPromotion(null);
    forceUpdate();
  }

  /** Apply a move; returns true when the board position changed. */
  function applyMove(from: Square, to: Square): boolean {
    if (game.isPromotion(from, to)) {
      setPromotion({ from, to });
      setSelected(null);
      return false;
    }
    const result = game.move(from, to);
    if (result.ok) {
      setSelected(null);
      forceUpdate();
      return true;
    }
    return false;
  }

  function handleSquareClick(square: Square) {
    if (gameOver) return;
    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      if (game.legalTargets(selected).includes(square)) {
        applyMove(selected, square);
        return;
      }
    }
    // Select the square only if its piece has a legal move.
    setSelected(game.legalTargets(square).length > 0 ? square : null);
  }

  function choosePromotion(piece: PromotionPiece) {
    if (!promotion) return;
    const result = game.move(promotion.from, promotion.to, piece);
    setPromotion(null);
    if (result.ok) forceUpdate();
  }

  function resign() {
    if (gameOver) return;
    game.resign(game.turn);
    setSelected(null);
    forceUpdate();
  }

  const squareStyles: Record<string, React.CSSProperties> = {};
  const checkedKing = game.checkedKingSquare();
  if (checkedKing) squareStyles[checkedKing] = CHECK_STYLE;
  if (selected) {
    squareStyles[selected] = SELECT_STYLE;
    for (const target of game.legalTargets(selected)) {
      squareStyles[target] = TARGET_STYLE;
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-col items-center gap-3">
        <Board
          fen={game.fen}
          orientation="w"
          squareStyles={squareStyles}
          allowDragging={!gameOver}
          onSquareClick={handleSquareClick}
          onPieceDrop={applyMove}
        />
        {promotion && (
          <div className="flex items-center gap-2 rounded-lg border border-arena-border bg-arena-panel px-3 py-2">
            <span className="text-sm text-arena-muted">Promote to:</span>
            {(["q", "r", "b", "n"] as PromotionPiece[]).map((piece) => (
              <button
                key={piece}
                onClick={() => choosePromotion(piece)}
                className="h-9 w-9 rounded-md bg-arena-elevated font-bold uppercase hover:bg-arena-blue hover:text-white"
              >
                {piece}
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="flex w-full flex-col gap-4 lg:w-72">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <h1 className="text-lg font-bold">
            Arena <span className="text-arena-muted">— offline hot-seat</span>
          </h1>
          {status.state === "playing" ? (
            <p className="mt-2 text-sm">
              <span className="text-arena-muted">Turn: </span>
              <span className="font-medium">{COLOR_NAME[status.turn]}</span>
              {status.inCheck && (
                <span className="ml-2 font-medium text-arena-loss">Check!</span>
              )}
            </p>
          ) : (
            <p className="mt-2 font-medium text-arena-gold">
              {resultText(status)}
            </p>
          )}
        </div>

        <MoveList moves={game.history()} />

        <div className="flex gap-2">
          <button
            onClick={resign}
            disabled={gameOver}
            className="flex-1 rounded-md border border-arena-border bg-arena-elevated px-3 py-2 text-sm font-medium hover:border-arena-loss hover:text-arena-loss disabled:opacity-40"
          >
            Resign
          </button>
          <button
            onClick={reset}
            className="flex-1 rounded-md bg-arena-blue px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            New Game
          </button>
        </div>
      </aside>
    </div>
  );
}
