"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Square } from "chess.js";
import { Chess } from "chess.js";
import Board from "@/components/chess/Board";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  createRoom,
  getRoom,
  isRoomFinished,
  joinRoom,
  makeRoomMove,
  playerColorInRoom,
  subscribeToRoom,
  type RoomRow,
} from "@/lib/supabase/multiplayer";
import { hasBrowserSupabaseConfig } from "@/lib/supabase/client";
import {
  createGuestProfile,
  loadGuestProfile,
  saveGuestProfile,
} from "@/lib/demo/progress";
import { translations } from "@/lib/i18n/translations";

type PromoPending = { from: Square; to: Square };

const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(245,158,11,0.45)",
};
const TARGET_STYLE: React.CSSProperties = {
  background:
    "radial-gradient(circle, rgba(245,158,11,0.55) 28%, transparent 29%)",
};

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

  const guestIdRef = useRef("");
  const playerNameRef = useRef("Guest");
  const unsubRef = useRef<(() => void) | null>(null);

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
    // only re-subscribe when code changes (room is stable reference-wise)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, !!room]);

  // ── Auto-join as Black if slot is open ───────────────────────────────────
  useEffect(() => {
    if (!room || !guestIdRef.current) return;
    const myColor = playerColorInRoom(room, guestIdRef.current);
    if (myColor) return; // already in room
    if (room.black_guest_id || room.black_name) return; // full
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
    // run once when room first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!room]);

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

    if (promotion) return; // wait for promotion choice

    // If a square is selected and clicked square is a legal target → move
    if (selected && legalTargets.includes(square)) {
      if (isPromotionMove(room.fen, selected, square)) {
        setPromotion({ from: selected, to: square });
        return;
      }
      applyMove(selected, square);
      return;
    }

    // Select piece
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
      return false; // board stays, wait for promotion choice
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

  function turnLabel(r: RoomRow): string {
    if (!myColor) return r.turn === "w" ? "White to move" : "Black to move";
    if (r.turn === myColor) return tm.yourTurn;
    return tm.opponentTurn;
  }

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

  const finished = isRoomFinished(room);
  const boardOrientation = myColor === "b" ? "b" : "w";
  const isSpectator = !myColor;

  return (
    <div className="mx-auto max-w-5xl px-2 py-6">
      {/* ── Room header ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-arena-muted">
            {tm.roomCode}
          </p>
          <p className="font-mono text-2xl font-bold tracking-[0.2em]">{code}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy invite link */}
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

          {/* Promotion dialog */}
          {promotion && (
            <div className="flex w-full max-w-[560px] flex-wrap items-center gap-2 rounded border border-arena-border bg-arena-panel px-3 py-2">
              <span className="text-sm text-arena-muted">{t.chess.promoteTo}</span>
              {(["q", "r", "b", "n"] as const).map((piece) => (
                <button
                  key={piece}
                  onClick={() => choosePromotion(piece)}
                  className="h-9 w-9 rounded bg-arena-elevated font-bold uppercase hover:bg-arena-blue hover:text-white"
                >
                  {piece}
                </button>
              ))}
            </div>
          )}

          {/* White player */}
          <div className="flex w-full max-w-[560px] items-center justify-between rounded border border-arena-border bg-arena-panel px-3 py-2">
            <span className="text-sm font-semibold">
              {room.white_name ?? (
                <span className="text-arena-muted">—</span>
              )}
            </span>
            {myColor === "w" && (
              <span className="rounded bg-arena-amber-bg px-1.5 py-0.5 font-mono text-[10px] text-arena-blue">
                {tm.youAreWhite}
              </span>
            )}
          </div>

          {/* Spectator note */}
          {isSpectator && (
            <p className="text-xs text-arena-muted">{tm.spectatorNote}</p>
          )}

          {/* Proto note */}
          <p className="text-[10px] text-arena-muted">{tm.protoNote}</p>
        </div>

        {/* Right: status + moves */}
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
                  <Link
                    href="/multiplayer"
                    className="rounded border border-arena-blue bg-arena-blue/10 px-3 py-1.5 text-center text-xs font-semibold text-arena-blue hover:bg-arena-blue/20"
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
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                  <p className="text-sm font-semibold">{turnLabel(room)}</p>
                </div>
                {movePending && (
                  <p className="mt-1 text-[10px] text-arena-muted">Sending move...</p>
                )}
              </div>
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
                  {Array.from({ length: Math.ceil(room.san_moves.length / 2) }, (_, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-1 py-0.5 even:bg-arena-elevated/50"
                    >
                      <span className="text-arena-muted">{i + 1}.</span>
                      <span className="font-mono">{room.san_moves[i * 2]}</span>
                      <span className="font-mono">{room.san_moves[i * 2 + 1] ?? ""}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
