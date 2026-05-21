"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import type { Color, Square } from "chess.js";
import Board from "@/components/chess/Board";
import MoveList from "@/components/chess/MoveList";
import { ChessGame, type GameStatus, type PromotionPiece } from "@/lib/chess/engine";
import {
  createGuestProfile,
  createLocalId,
  formatResult,
  getRatingLevel,
  loadGuestProfile,
  recordCompletedMatch,
  sanitizeNickname,
  saveGuestProfile,
  type GuestProfile,
  type LocalMatch,
} from "@/lib/demo/progress";

const COLOR_NAME: Record<Color, string> = { w: "White", b: "Black" };

function resultText(status: GameStatus): string {
  switch (status.state) {
    case "checkmate":
      return `Checkmate - ${COLOR_NAME[status.winner]} wins`;
    case "resigned":
      return `${COLOR_NAME[status.winner]} wins by resignation`;
    case "stalemate":
      return "Draw - stalemate";
    case "draw":
      return status.reason === "insufficient"
        ? "Draw - insufficient material"
        : status.reason === "threefold"
          ? "Draw - threefold repetition"
          : "Draw - fifty-move rule";
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
  const matchIdRef = useRef(createLocalId("match"));
  const matchCreatedAtRef = useRef(new Date().toISOString());
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [completedMatch, setCompletedMatch] = useState<LocalMatch | null>(null);

  const game = gameRef.current;
  const status = game.status();
  const gameOver = game.isGameOver();

  useEffect(() => {
    const savedProfile = loadGuestProfile();
    setProfile(savedProfile);
    setNickname(savedProfile?.nickname ?? "");
    setProfileLoaded(true);
  }, []);

  useEffect(() => {
    if (!profile || !gameOver || completedMatch) return;

    const outcome = game.status();
    if (outcome.state === "playing") return;

    const saved = recordCompletedMatch(profile, {
      id: matchIdRef.current,
      createdAt: matchCreatedAtRef.current,
      finalFen: game.fen,
      outcome,
      sanMoves: game.history().map((move) => move.san),
    });

    setProfile(saved.profile);
    setCompletedMatch(saved.match);
  }, [completedMatch, game, gameOver, profile]);

  function reset() {
    gameRef.current = new ChessGame();
    matchIdRef.current = createLocalId("match");
    matchCreatedAtRef.current = new Date().toISOString();
    setSelected(null);
    setPromotion(null);
    setCompletedMatch(null);
    forceUpdate();
  }

  function startGuestProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanNickname = sanitizeNickname(nickname);
    if (!cleanNickname) {
      setNicknameError("Enter a nickname to start the local ranked demo.");
      return;
    }

    const nextProfile = createGuestProfile(cleanNickname);
    saveGuestProfile(nextProfile);
    setProfile(nextProfile);
    setNickname(cleanNickname);
    setNicknameError("");
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

  if (!profileLoaded) {
    return <p className="py-10 text-sm text-arena-muted">Loading local arena...</p>;
  }

  if (!profile) {
    return (
      <section className="mx-auto flex max-w-lg flex-col gap-4 rounded-lg border border-arena-border bg-arena-panel p-5">
        <div>
          <p className="text-sm font-medium text-arena-gold">Guest entry</p>
          <h1 className="mt-1 text-2xl font-bold">Choose a nickname</h1>
          <p className="mt-2 text-sm text-arena-muted">
            Your demo rating, match history, and reviews stay in this browser.
          </p>
        </div>
        <form onSubmit={startGuestProfile} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-arena-muted">Nickname</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={24}
              autoFocus
              className="rounded-md border border-arena-border bg-arena-elevated px-3 py-2 outline-none focus:border-arena-blue"
              placeholder="ArenaGuest"
            />
          </label>
          {nicknameError && <p className="text-sm text-arena-loss">{nicknameError}</p>}
          <button className="rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90">
            Enter Arena
          </button>
        </form>
      </section>
    );
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

      <aside className="flex w-full flex-col gap-4 lg:w-80">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-arena-muted">{profile.nickname}</p>
              <h1 className="text-lg font-bold">
                Local Ranked <span className="text-arena-muted">hot-seat</span>
              </h1>
            </div>
            <div className="rounded-md bg-arena-elevated px-2 py-1 text-right text-sm">
              <p className="font-semibold">{profile.rating}</p>
              <p className="text-xs text-arena-muted">
                Level {getRatingLevel(profile.rating)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-arena-muted">
            Guest progress follows White. Black is the local demo opponent.
          </p>
          {status.state === "playing" ? (
            <p className="mt-3 text-sm">
              <span className="text-arena-muted">Turn: </span>
              <span className="font-medium">{COLOR_NAME[status.turn]}</span>
              {status.inCheck && (
                <span className="ml-2 font-medium text-arena-loss">Check!</span>
              )}
            </p>
          ) : (
            <p className="mt-3 font-medium text-arena-gold">{resultText(status)}</p>
          )}
        </div>

        {completedMatch && (
          <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
            <p className="text-sm text-arena-muted">Result saved once locally</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-semibold">
                {formatResult(completedMatch.result)}{" "}
                <span
                  className={
                    completedMatch.ratingDelta >= 0
                      ? "text-arena-win"
                      : "text-arena-loss"
                  }
                >
                  {completedMatch.ratingDelta > 0 ? "+" : ""}
                  {completedMatch.ratingDelta}
                </span>
              </p>
              <Link
                href={`/review/${completedMatch.id}`}
                className="rounded-md bg-arena-gold px-3 py-1.5 text-sm font-medium text-arena-bg hover:opacity-90"
              >
                Review
              </Link>
            </div>
          </div>
        )}

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
            disabled={gameOver && !completedMatch}
            className="flex-1 rounded-md bg-arena-blue px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            New Game
          </button>
        </div>
      </aside>
    </div>
  );
}
