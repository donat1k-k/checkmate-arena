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
const RIVAL_RATING = 1035;

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
  const matchStatus =
    status.state === "playing"
      ? status.inCheck
        ? `${COLOR_NAME[status.turn]} is in check`
        : `${COLOR_NAME[status.turn]} to move`
      : resultText(status);

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
      <div className="grid gap-5 py-4 lg:grid-cols-[1fr_420px] lg:items-center">
        <section>
          <p className="text-sm font-medium text-arena-gold">Arena entry</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Start ranked as a guest.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-arena-muted">
            Your first nickname opens the local loop: match result, rating
            change, profile history, leaderboard row, and coach review.
          </p>
          <div className="mt-5 grid max-w-xl gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
              <p className="text-xs text-arena-muted">Start rating</p>
              <p className="mt-1 text-2xl font-semibold">1000</p>
            </div>
            <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
              <p className="text-xs text-arena-muted">Opponent</p>
              <p className="mt-1 font-semibold">Local Rival</p>
            </div>
            <div className="rounded-lg border border-arena-border bg-arena-panel p-4">
              <p className="text-xs text-arena-muted">Review</p>
              <p className="mt-1 font-semibold">After finish</p>
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="text-sm font-medium text-arena-gold">Guest profile</p>
          <h2 className="mt-2 text-2xl font-bold">Choose a nickname</h2>
          <p className="mt-2 text-sm text-arena-muted">
            Demo progress stays in this browser for the current MVP.
          </p>
          <form onSubmit={startGuestProfile} className="mt-5 flex flex-col gap-3">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col justify-between gap-4 border-b border-arena-border pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-arena-border bg-arena-panel px-3 py-1 text-arena-gold">
              Local Ranked
            </span>
            <span className="rounded-full border border-arena-border bg-arena-panel px-3 py-1 text-arena-muted">
              Untimed hot-seat
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {profile.nickname} vs Local Rival
          </h1>
          <p className="mt-2 text-sm text-arena-muted">
            Guest progress follows White through rating, review, and match
            history.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <div className="rounded-lg border border-arena-border bg-arena-panel px-4 py-3">
            <p className="text-xs text-arena-muted">Your rating</p>
            <p className="mt-1 text-2xl font-semibold">{profile.rating}</p>
          </div>
          <div className="rounded-lg border border-arena-border bg-arena-panel px-4 py-3">
            <p className="text-xs text-arena-muted">Level</p>
            <p className="mt-1 text-2xl font-semibold">
              {getRatingLevel(profile.rating)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-arena-border bg-arena-panel px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-arena-elevated font-semibold text-arena-gold">
                LR
              </span>
              <div>
                <p className="font-semibold">Local Rival</p>
                <p className="text-sm text-arena-muted">Black pieces</p>
              </div>
            </div>
            <p className="text-sm text-arena-muted">{RIVAL_RATING}</p>
          </div>

          <div className="flex justify-center rounded-lg border border-arena-border bg-arena-panel/75 p-3 sm:p-4">
            <Board
              fen={game.fen}
              orientation="w"
              squareStyles={squareStyles}
              allowDragging={!gameOver}
              onSquareClick={handleSquareClick}
              onPieceDrop={applyMove}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-arena-border bg-arena-panel px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-arena-blue font-semibold text-white">
                {profile.nickname.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="font-semibold">{profile.nickname}</p>
                <p className="text-sm text-arena-muted">White pieces</p>
              </div>
            </div>
            <p className="text-sm text-arena-muted">{profile.rating}</p>
          </div>

          {promotion && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-arena-border bg-arena-panel px-3 py-2">
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
        </section>

        <aside className="flex w-full flex-col gap-4">
          <section className="rounded-lg border border-arena-border bg-arena-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-arena-muted">Match status</p>
                <p
                  className={
                    status.state === "playing"
                      ? "mt-1 text-xl font-semibold"
                      : "mt-1 text-xl font-semibold text-arena-gold"
                  }
                >
                  {matchStatus}
                </p>
              </div>
              <span
                className={
                  status.state === "playing"
                    ? "rounded-full bg-arena-blue px-2.5 py-1 text-xs font-medium text-white"
                    : "rounded-full bg-arena-gold px-2.5 py-1 text-xs font-medium text-arena-bg"
                }
              >
                {status.state === "playing" ? "Live" : "Final"}
              </span>
            </div>
            <p className="mt-3 text-sm text-arena-muted">
              {status.state === "playing"
                ? "Finish the board state to lock the local rating update."
                : "The finished result feeds review, profile history, and leaderboard rank."}
            </p>
          </section>

          {completedMatch && (
            <section className="rounded-lg border border-arena-border bg-arena-panel p-4">
              <p className="text-sm font-medium text-arena-gold">Result saved locally</p>
              <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-2xl font-semibold">
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
                  <p className="mt-1 text-sm text-arena-muted">
                    {completedMatch.ratingBefore} to {completedMatch.ratingAfter}
                  </p>
                </div>
                <Link
                  href={`/review/${completedMatch.id}`}
                  className="rounded-md bg-arena-gold px-4 py-2 text-center font-medium text-arena-bg hover:opacity-90"
                >
                  Open review
                </Link>
              </div>
            </section>
          )}

          <MoveList moves={game.history()} />

          <section className="rounded-lg border border-arena-border bg-arena-panel p-3">
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
            {completedMatch && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-arena-border pt-3 text-sm">
                <Link
                  href="/profile"
                  className="rounded-md border border-arena-border px-3 py-1.5 font-medium hover:border-arena-gold"
                >
                  Profile
                </Link>
                <Link
                  href="/leaderboard"
                  className="rounded-md border border-arena-border px-3 py-1.5 font-medium hover:border-arena-gold"
                >
                  Leaderboard
                </Link>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
