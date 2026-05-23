"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Color, Square } from "chess.js";
import { Chess } from "chess.js";
import Board from "@/components/chess/Board";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  getRoom,
  isRoomFinished,
  joinRoom,
  makeRoomMove,
  playerColorInRoom,
  resignRoom,
  subscribeToRoom,
  type RoomRow,
} from "@/lib/supabase/multiplayer";
import { createClient, hasBrowserSupabaseConfig } from "@/lib/supabase/client";
import {
  createGuestProfile,
  loadGuestProfile,
  recordCompletedMatch,
} from "@/lib/demo/progress";
import type { GameOutcome } from "@/lib/chess/engine";
import { translations } from "@/lib/i18n/translations";
import {
  recordAccountMatch,
} from "@/lib/supabase/matches";
import { loadAccountProfile } from "@/lib/supabase/profiles";

type PromoPending = { from: Square; to: Square };

const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(245,158,11,0.45)",
};
const TARGET_STYLE: React.CSSProperties = {
  background:
    "radial-gradient(circle, rgba(245,158,11,0.55) 28%, transparent 29%)",
};

function roomToGameOutcome(room: RoomRow): GameOutcome {
  if (room.finish === "checkmate") {
    const winner: Color = room.result === "white_won" ? "w" : "b";
    return { state: "checkmate", winner };
  }
  if (room.finish === "stalemate") return { state: "stalemate" };
  if (room.finish === "draw") return { state: "draw", reason: "insufficient" };
  if (room.finish === "resignation") {
    const winner: Color = room.result === "white_won" ? "w" : "b";
    return { state: "resigned", winner };
  }
  return { state: "stalemate" };
}

// ── Multiplayer room save ledger (idempotency) ────────────────────────────
// Prevents duplicate saves on reload of a finished room.
const MP_SAVE_KEY = "checkmate-arena.saved-mp-rooms.v1";

function getLedgerMatchId(roomCode: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MP_SAVE_KEY);
    if (!raw) return null;
    const ledger = JSON.parse(raw) as Record<string, string>;
    return ledger[roomCode] ?? null;
  } catch {
    return null;
  }
}

function setLedgerMatchId(roomCode: string, matchId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(MP_SAVE_KEY);
    const ledger: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    ledger[roomCode] = matchId;
    window.localStorage.setItem(MP_SAVE_KEY, JSON.stringify(ledger));
  } catch {}
}

export default function RoomPage() {
  const params = useParams();
  const code = (
    Array.isArray(params.code) ? params.code[0] : params.code ?? ""
  ).toUpperCase();

  const { locale } = usePreferences();
  const t = translations[locale];
  const tm = t.multiplayer;

  const [room, setRoom] = useState<RoomRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorKey, setErrorKey] = useState<
    "not_found" | "db_not_configured" | "request_failed" | "room_full" | null
  >(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [promotion, setPromotion] = useState<PromoPending | null>(null);
  const [movePending, setMovePending] = useState(false);
  const [resignPending, setResignPending] = useState(false);

  // Match save state
  const [savedMatchId, setSavedMatchId] = useState<string | null>(null);
  const matchSavedRef = useRef(false);

  const guestIdRef = useRef("");
  const playerNameRef = useRef("Guest");
  const unsubRef = useRef<(() => void) | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Init: load guest profile ──────────────────────────────────────────────
  useEffect(() => {
    const profile = loadGuestProfile() ?? createGuestProfile("Guest");
    guestIdRef.current = profile.id;
    playerNameRef.current = profile.nickname;
  }, []);

  // ── Load room on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!code) return;

    let cancelled = false;

    async function load() {
      if (!hasBrowserSupabaseConfig()) {
        setErrorKey("db_not_configured");
        setLoading(false);
        return;
      }

      const result = await getRoom(code);
      if (cancelled) return;

      if (!result.ok) {
        setErrorKey(
          result.error === "table_not_found"
            ? "db_not_configured"
            : result.error === "not_found"
              ? "not_found"
              : "request_failed",
        );
        setLoading(false);
        return;
      }

      setRoom(result.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // ── Subscribe to realtime once room is loaded ─────────────────────────────
  useEffect(() => {
    if (!room || !hasBrowserSupabaseConfig()) return;

    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribeToRoom(code, (updated) => {
      setRoom(updated);
    });

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, !!room]);

  // ── Polling fallback while waiting for friend ─────────────────────────────
  useEffect(() => {
    if (!room || !hasBrowserSupabaseConfig()) return;
    if (room.status !== "waiting" || room.black_guest_id) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      const result = await getRoom(code);
      if (result.ok && (result.data.black_guest_id || result.data.status !== "waiting")) {
        setRoom(result.data);
      }
    }, 2500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [code, room?.status, room?.black_guest_id]);

  // ── Auto-join as Black if slot is open ───────────────────────────────────
  useEffect(() => {
    if (!room || !guestIdRef.current) return;
    const myColor = playerColorInRoom(room, guestIdRef.current);
    if (myColor) return;
    if (room.black_guest_id || room.black_name) return;
    if (room.status !== "waiting") return;

    setJoining(true);
    joinRoom(code, {
      playerName: playerNameRef.current,
      guestId: guestIdRef.current,
    }).then((result) => {
      setJoining(false);
      if (result.ok) {
        setRoom(result.data);
      } else {
        if (result.error === "room_full") setErrorKey("room_full");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!room]);

  // ── Save match when game finishes (account → Supabase, guest → localStorage)
  useEffect(() => {
    if (!room) return;
    const finished = isRoomFinished(room);
    const myColor = playerColorInRoom(room, guestIdRef.current);
    if (!finished || !myColor) return;

    // Check ledger first — prevents duplicate saves on reload
    const existingId = getLedgerMatchId(room.room_code);
    if (existingId) {
      setSavedMatchId(existingId);
      matchSavedRef.current = true;
      return;
    }

    if (matchSavedRef.current) return;
    matchSavedRef.current = true;

    const playerColor: "w" | "b" = myColor; // narrowed — null excluded above
    const roomSnapshot = room;
    const opponentName =
      playerColor === "w"
        ? (roomSnapshot.black_name ?? "Guest")
        : (roomSnapshot.white_name ?? "Guest");
    const outcome = roomToGameOutcome(roomSnapshot);

    async function saveMatch() {
      // Try account save via Supabase
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const accountResult = await loadAccountProfile(supabase, user);
          if (accountResult.profile) {
            const saveResult = await recordAccountMatch(supabase, accountResult.profile, {
              createdAt: roomSnapshot.created_at,
              finalFen: roomSnapshot.fen,
              locale,
              outcome,
              sanMoves: roomSnapshot.san_moves,
              playerColor,
              opponentNickname: opponentName,
            });
            if (saveResult.match) {
              setLedgerMatchId(roomSnapshot.room_code, saveResult.match.id);
              setSavedMatchId(saveResult.match.id);
              return;
            }
          }
        }
      }

      // Guest / fallback: save to localStorage
      const localMatchId = `room-${roomSnapshot.room_code}`;
      const guestProfile =
        loadGuestProfile() ?? createGuestProfile(playerNameRef.current);
      recordCompletedMatch(guestProfile, {
        id: localMatchId,
        createdAt: roomSnapshot.created_at,
        finalFen: roomSnapshot.fen,
        outcome,
        sanMoves: roomSnapshot.san_moves,
        playerColor,
        opponentNickname: opponentName,
      });
      setLedgerMatchId(roomSnapshot.room_code, localMatchId);
      setSavedMatchId(localMatchId);
    }

    void saveMatch();
  }, [room?.status, locale]);

  // ── Copy invite link ──────────────────────────────────────────────────────
  function copyLink() {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  // ── Chess board helpers ───────────────────────────────────────────────────
  const myColor = room ? playerColorInRoom(room, guestIdRef.current) : null;

  const canMove = useCallback(
    (r: RoomRow): boolean => {
      if (!myColor) return false;
      if (isRoomFinished(r)) return false;
      if (r.status !== "active") return false;
      if (r.turn !== myColor) return false;
      return true;
    },
    [myColor],
  );

  function getLegalTargets(fen: string, from: Square): Square[] {
    const chess = new Chess(fen);
    const moves = chess.moves({ square: from, verbose: true });
    return moves.map((m) => m.to as Square);
  }

  function isPromotionMove(fen: string, from: Square, to: Square): boolean {
    const chess = new Chess(fen);
    const piece = chess.get(from);
    if (!piece || piece.type !== "p") return false;
    const rank = to[1];
    return rank === "8" || rank === "1";
  }

  function handleSquareClick(square: Square) {
    if (!room || !canMove(room) || movePending) return;
    if (promotion) return;

    if (selected && legalTargets.includes(square)) {
      if (isPromotionMove(room.fen, selected, square)) {
        setPromotion({ from: selected, to: square });
        return;
      }
      applyMove(selected, square);
      return;
    }

    const chess = new Chess(room.fen);
    const piece = chess.get(square);
    if (piece && piece.color === room.turn) {
      setSelected(square);
      setLegalTargets(getLegalTargets(room.fen, square));
    } else {
      setSelected(null);
      setLegalTargets([]);
    }
  }

  function handlePieceDrop(from: Square, to: Square): boolean {
    if (!room || !canMove(room) || movePending) return false;
    if (isPromotionMove(room.fen, from, to)) {
      setSelected(from);
      setPromotion({ from, to });
      return false;
    }
    applyMove(from, to);
    return true;
  }

  async function choosePromotion(piece: "q" | "r" | "b" | "n") {
    if (!promotion || !room) return;
    const { from, to } = promotion;
    setPromotion(null);
    await applyMove(from, to, piece);
  }

  async function applyMove(
    from: Square,
    to: Square,
    promotionPiece?: "q" | "r" | "b" | "n",
  ) {
    if (!room) return;
    setSelected(null);
    setLegalTargets([]);
    setMovePending(true);

    const result = await makeRoomMove(
      code,
      { from, to, promotion: promotionPiece },
      room,
    );

    setMovePending(false);
    if (result.ok) {
      setRoom(result.data);
    }
  }

  async function handleResign() {
    if (!myColor || !room) return;
    if (!window.confirm(tm.resignConfirm)) return;
    setResignPending(true);
    const result = await resignRoom(code, myColor);
    setResignPending(false);
    if (result.ok) {
      setRoom(result.data);
    }
  }

  // ── Square styles ─────────────────────────────────────────────────────────
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selected) squareStyles[selected] = SELECT_STYLE;
  for (const sq of legalTargets) {
    squareStyles[sq] = TARGET_STYLE;
  }

  // ── Derived display values ────────────────────────────────────────────────
  function resultLabel(r: RoomRow): string {
    if (!r.result) return "";
    const res = tm.result[r.result as keyof typeof tm.result] ?? r.result;
    const fin = r.finish
      ? ` ${tm.finish[r.finish as keyof typeof tm.finish] ?? ""}`
      : "";
    return `${res}${fin}`;
  }

  // ── Check detection ───────────────────────────────────────────────────────
  const finished = room ? isRoomFinished(room) : false;
  let isMyKingInCheck = false;
  let isOpponentInCheck = false;

  if (room && !finished) {
    const chess = new Chess(room.fen);
    const check = chess.inCheck();
    if (check && myColor) {
      isMyKingInCheck = room.turn === myColor;
      isOpponentInCheck = room.turn !== myColor;
    }
  }

  // ── Turn indicator ────────────────────────────────────────────────────────
  const isMyTurn = !!myColor && !finished && !!room && room.turn === myColor;
  const isOpponentTurn = !!myColor && !finished && !!room && room.turn !== myColor;
  const isSpectator = !myColor;

  // ── Render: loading ───────────────────────────────────────────────────────
  if (loading || joining) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-sm text-arena-muted">
          {joining ? tm.joining : "Loading room..."}
        </span>
      </div>
    );
  }

  // ── Render: error states ──────────────────────────────────────────────────
  if (errorKey === "db_not_configured") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded border border-yellow-500/40 bg-yellow-500/10 p-5">
          <p className="font-semibold text-yellow-400">{tm.dbNotConfigured}</p>
          <p className="mt-1 text-sm text-arena-muted">{tm.dbNotConfiguredBody}</p>
          <pre className="mt-3 rounded bg-arena-elevated p-2 font-mono text-[10px] text-arena-muted">
            supabase/migrations/0004_multiplayer_rooms.sql
          </pre>
        </div>
        <Link
          href="/multiplayer"
          className="mt-4 inline-block text-xs text-arena-muted underline underline-offset-2"
        >
          ← {tm.backToPlay}
        </Link>
      </div>
    );
  }

  if (errorKey === "not_found") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded border border-arena-border bg-arena-panel p-5">
          <p className="font-semibold">{tm.roomNotFound}</p>
          <p className="mt-1 text-sm text-arena-muted">{tm.roomNotFoundBody}</p>
        </div>
        <Link
          href="/multiplayer"
          className="mt-4 inline-block text-xs text-arena-muted underline underline-offset-2"
        >
          ← {tm.backToPlay}
        </Link>
      </div>
    );
  }

  if (errorKey === "room_full" && !room) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded border border-arena-border bg-arena-panel p-5">
          <p className="font-semibold">{tm.roomFull}</p>
          <p className="mt-1 text-sm text-arena-muted">{tm.roomFullBody}</p>
        </div>
        <Link
          href="/multiplayer"
          className="mt-4 inline-block text-xs text-arena-muted underline underline-offset-2"
        >
          ← {tm.backToPlay}
        </Link>
      </div>
    );
  }

  if (!room) return null;

  const boardOrientation = myColor === "b" ? "b" : "w";

  return (
    <div className="mx-auto max-w-5xl px-2 py-6">
      {/* ── Promotion overlay ───────────────────────────────────────────── */}
      {promotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-xs rounded-xl border border-arena-border bg-arena-panel p-6 shadow-2xl">
            <p className="mb-1 text-center font-mono text-xs uppercase tracking-widest text-arena-muted">
              {tm.promotionTitle}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(["q", "r", "b", "n"] as const).map((piece) => (
                <button
                  key={piece}
                  onClick={() => choosePromotion(piece)}
                  className="flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-arena-border bg-arena-elevated font-bold hover:border-arena-blue hover:bg-arena-blue/10 active:scale-95"
                >
                  <span className="font-mono text-xl uppercase text-arena-text">
                    {piece}
                  </span>
                  <span className="text-[10px] text-arena-muted">
                    {tm.promotionPiece[piece]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Room header ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-arena-muted">
            {tm.roomCode}
          </p>
          <p className="font-mono text-2xl font-bold tracking-[0.2em]">{code}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!finished && (
            <button
              type="button"
              onClick={copyLink}
              className="rounded border border-arena-border bg-arena-panel px-3 py-1.5 text-xs hover:border-arena-blue"
            >
              {linkCopied ? tm.linkCopied : tm.copyInviteLink}
            </button>
          )}
          <Link
            href="/multiplayer"
            className="rounded border border-arena-border bg-arena-panel px-3 py-1.5 text-xs hover:border-arena-blue"
          >
            ← {tm.backToPlay}
          </Link>
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Left: board */}
        <div className="flex flex-col items-center gap-3">
          {/* Black player */}
          <div className="flex w-full max-w-[560px] items-center justify-between rounded border border-arena-border bg-arena-panel px-3 py-2">
            <span className="text-sm font-semibold">
              {room.black_name ?? (
                <span className="text-arena-muted">{tm.waitingForFriend}</span>
              )}
            </span>
            {myColor === "b" && (
              <span className="rounded bg-arena-amber-bg px-1.5 py-0.5 font-mono text-[10px] text-arena-blue">
                {tm.youAreBlack}
              </span>
            )}
          </div>

          {/* Board */}
          <Board
            fen={room.fen}
            orientation={boardOrientation}
            squareStyles={squareStyles}
            allowDragging={canMove(room) && !movePending}
            onSquareClick={handleSquareClick}
            onPieceDrop={handlePieceDrop}
          />

          {/* Check / status banner */}
          {isMyKingInCheck && (
            <div className="flex w-full max-w-[560px] items-center gap-2 rounded border border-red-500/40 bg-red-500/10 px-3 py-2">
              <span className="text-base">⚠</span>
              <span className="text-sm font-semibold text-red-400">{tm.inCheck}</span>
            </div>
          )}
          {isOpponentInCheck && !isMyKingInCheck && (
            <div className="flex w-full max-w-[560px] items-center gap-2 rounded border border-arena-amber-border bg-arena-amber-bg px-3 py-2">
              <span className="text-sm text-arena-muted">{tm.opponentInCheck}</span>
            </div>
          )}

          {/* White player */}
          <div className="flex w-full max-w-[560px] items-center justify-between rounded border border-arena-border bg-arena-panel px-3 py-2">
            <span className="text-sm font-semibold">
              {room.white_name ?? <span className="text-arena-muted">—</span>}
            </span>
            {myColor === "w" && (
              <span className="rounded bg-arena-amber-bg px-1.5 py-0.5 font-mono text-[10px] text-arena-blue">
                {tm.youAreWhite}
              </span>
            )}
          </div>

          {/* Resign + Draw offer buttons */}
          {myColor && !finished && room.status === "active" && (
            <div className="flex w-full max-w-[560px] flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResign}
                disabled={resignPending}
                className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resignPending ? "..." : tm.resignBtn}
              </button>
              <button
                type="button"
                disabled
                title={tm.drawOfferComingSoon}
                className="cursor-not-allowed rounded border border-arena-border px-3 py-1.5 text-xs text-arena-muted opacity-40"
              >
                {tm.drawOfferBtn}
              </button>
            </div>
          )}

          {/* Spectator note */}
          {isSpectator && (
            <p className="text-xs text-arena-muted">{tm.spectatorNote}</p>
          )}

          {/* Proto note */}
          <p className="text-[10px] text-arena-muted">{tm.protoNote}</p>
        </div>

        {/* Right: status + moves + AI Coach teaser */}
        <div className="flex flex-col gap-3">
          {/* Status card */}
          <div className="rounded border border-arena-border bg-arena-panel p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-arena-muted">
              {finished ? tm.gameOver : tm.realtimeConnection}
            </p>

            {finished ? (
              <div className="mt-2">
                <p className="text-sm font-bold text-arena-gold">
                  {resultLabel(room)}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {savedMatchId && (
                    <Link
                      href={`/review/${savedMatchId}`}
                      className="rounded border border-arena-blue bg-arena-blue/10 px-3 py-1.5 text-center text-xs font-semibold text-arena-blue hover:bg-arena-blue/20"
                    >
                      {tm.openReview}
                    </Link>
                  )}
                  <Link
                    href="/multiplayer"
                    className="rounded border border-arena-border px-3 py-1.5 text-center text-xs text-arena-muted hover:border-arena-blue"
                  >
                    {tm.newRoom}
                  </Link>
                  <Link
                    href="/play"
                    className="rounded border border-arena-border px-3 py-1.5 text-center text-xs text-arena-muted hover:border-arena-blue"
                  >
                    {t.play.modeLocal}
                  </Link>
                </div>
              </div>
            ) : room.status === "waiting" ? (
              <div className="mt-2">
                <p className="text-sm text-arena-muted">{tm.waitingForFriend}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                  <span className="font-mono text-[10px] text-arena-muted">
                    {code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="mt-2 w-full rounded border border-arena-border px-2 py-1 text-[10px] hover:border-arena-blue"
                >
                  {linkCopied ? tm.linkCopied : tm.copyInviteLink}
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  {isMyTurn ? (
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                  ) : isOpponentTurn ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-arena-muted" />
                  )}
                  <p
                    className={
                      isMyTurn
                        ? "text-sm font-semibold text-green-400"
                        : isOpponentTurn
                          ? "text-sm font-semibold text-amber-400"
                          : "text-sm text-arena-muted"
                    }
                  >
                    {isMyTurn
                      ? tm.yourTurn
                      : isOpponentTurn
                        ? tm.opponentTurn
                        : isSpectator
                          ? tm.spectator
                          : ""}
                  </p>
                </div>
                {movePending && (
                  <p className="mt-1 text-[10px] text-arena-muted">Sending move...</p>
                )}
              </div>
            )}
          </div>

          {/* AI Coach teaser */}
          <div className="rounded border border-arena-amber-border bg-arena-amber-bg p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-arena-blue">
              {tm.aiCoachEyebrow}
            </p>
            {finished && savedMatchId ? (
              <>
                <p className="mt-1 text-xs text-arena-muted">{tm.matchSaved}</p>
                <Link
                  href={`/review/${savedMatchId}`}
                  className="mt-2 block rounded border border-arena-blue bg-arena-blue/10 px-3 py-1.5 text-center text-xs font-semibold text-arena-blue hover:bg-arena-blue/20"
                >
                  {tm.aiCoachAfterGame}
                </Link>
              </>
            ) : (
              <p className="mt-1 text-xs text-arena-muted">{tm.aiCoachFairPlay}</p>
            )}
          </div>

          {/* Move list */}
          {room.san_moves.length > 0 && (
            <div className="rounded border border-arena-border bg-arena-panel p-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-arena-muted">
                {t.chess.moveList}
              </p>
              <div className="max-h-64 overflow-y-auto">
                <ol className="text-sm">
                  {Array.from(
                    { length: Math.ceil(room.san_moves.length / 2) },
                    (_, i) => (
                      <li
                        key={i}
                        className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-1 py-0.5 even:bg-arena-elevated/50"
                      >
                        <span className="text-arena-muted">{i + 1}.</span>
                        <span className="font-mono">{room.san_moves[i * 2]}</span>
                        <span className="font-mono">
                          {room.san_moves[i * 2 + 1] ?? ""}
                        </span>
                      </li>
                    ),
                  )}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
