"use client";

import { Chess } from "chess.js";
import { createClient } from "@/lib/supabase/client";

export type RoomStatus =
  | "waiting"
  | "active"
  | "white_won"
  | "black_won"
  | "draw"
  | "abandoned";

export type RoomRow = {
  id: string;
  room_code: string;
  status: RoomStatus;
  fen: string;
  pgn: string;
  san_moves: string[];
  white_player_id: string | null;
  black_player_id: string | null;
  white_name: string | null;
  black_name: string | null;
  white_guest_id: string | null;
  black_guest_id: string | null;
  turn: "w" | "b";
  result: string | null;
  finish: string | null;
  created_at: string;
  updated_at: string;
  last_move_at: string | null;
  expires_at: string | null;
};

export type RoomError =
  | "db_not_configured"
  | "table_not_found"
  | "not_found"
  | "request_failed"
  | "room_full"
  | "invalid_move";

export type RoomResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RoomError };

function isTableNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as Record<string, unknown>).code;
  return code === "42P01" || code === "PGRST116" || code === "PGRST200";
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function normalizeRoom(raw: unknown): RoomRow {
  const row = raw as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    room_code: String(row.room_code ?? ""),
    status: (row.status as RoomStatus) ?? "waiting",
    fen: String(row.fen ?? ""),
    pgn: String(row.pgn ?? ""),
    san_moves: Array.isArray(row.san_moves)
      ? (row.san_moves as unknown[]).filter((m): m is string => typeof m === "string")
      : [],
    white_player_id: (row.white_player_id as string | null) ?? null,
    black_player_id: (row.black_player_id as string | null) ?? null,
    white_name: (row.white_name as string | null) ?? null,
    black_name: (row.black_name as string | null) ?? null,
    white_guest_id: (row.white_guest_id as string | null) ?? null,
    black_guest_id: (row.black_guest_id as string | null) ?? null,
    turn: row.turn === "b" ? "b" : "w",
    result: (row.result as string | null) ?? null,
    finish: (row.finish as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    last_move_at: (row.last_move_at as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
  };
}

const INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function isRoomFinished(room: RoomRow): boolean {
  return (
    room.status === "white_won" ||
    room.status === "black_won" ||
    room.status === "draw" ||
    room.status === "abandoned"
  );
}

export function playerColorInRoom(
  room: RoomRow,
  guestId: string,
  userId?: string | null,
): "w" | "b" | null {
  if (room.white_guest_id === guestId) return "w";
  if (room.black_guest_id === guestId) return "b";
  if (userId) {
    if (room.white_player_id === userId) return "w";
    if (room.black_player_id === userId) return "b";
  }
  return null;
}

// =========================================================================
// API functions
// =========================================================================

export async function createRoom(args: {
  playerName: string;
  guestId: string;
  userId?: string | null;
}): Promise<RoomResult<RoomRow>> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "db_not_configured" };

  const roomCode = generateRoomCode();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const insertData: Record<string, unknown> = {
    room_code: roomCode,
    fen: INITIAL_FEN,
    white_name: args.playerName,
    white_guest_id: args.guestId,
    expires_at: expiresAt,
  };
  if (args.userId) insertData.white_player_id = args.userId;

  const { data, error } = await supabase
    .from("multiplayer_rooms")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (isTableNotFound(error)) return { ok: false, error: "table_not_found" };
    return { ok: false, error: "request_failed" };
  }

  return { ok: true, data: normalizeRoom(data) };
}

export async function getRoom(roomCode: string): Promise<RoomResult<RoomRow>> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "db_not_configured" };

  const { data, error } = await supabase
    .from("multiplayer_rooms")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (error) {
    if (isTableNotFound(error)) return { ok: false, error: "table_not_found" };
    return { ok: false, error: "request_failed" };
  }
  if (!data) return { ok: false, error: "not_found" };

  return { ok: true, data: normalizeRoom(data) };
}

export async function joinRoom(
  roomCode: string,
  args: { playerName: string; guestId: string; userId?: string | null },
): Promise<RoomResult<RoomRow>> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "db_not_configured" };

  const roomResult = await getRoom(roomCode);
  if (!roomResult.ok) return roomResult;

  const room = roomResult.data;

  // Already in this room (by guestId or authenticated userId)
  if (
    room.white_guest_id === args.guestId ||
    room.black_guest_id === args.guestId ||
    (args.userId && room.white_player_id === args.userId) ||
    (args.userId && room.black_player_id === args.userId)
  ) {
    return { ok: true, data: room };
  }

  // Black slot taken or game already started
  if (room.black_guest_id || room.black_name || room.status !== "waiting") {
    return { ok: false, error: "room_full" };
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    black_name: args.playerName,
    black_guest_id: args.guestId,
    status: "active",
    updated_at: now,
  };
  if (args.userId) updatePayload.black_player_id = args.userId;

  // Conditional update: only proceed if black slot is still empty (race protection)
  const { data, error } = await supabase
    .from("multiplayer_rooms")
    .update(updatePayload)
    .eq("room_code", roomCode.toUpperCase())
    .is("black_guest_id", null)
    .select()
    .single();

  if (error) {
    if (isTableNotFound(error)) return { ok: false, error: "table_not_found" };
    // PGRST116 = no rows matched (seat taken by concurrent join)
    if ((error as { code?: string }).code === "PGRST116") {
      const reread = await getRoom(roomCode);
      if (!reread.ok) return reread;
      const r = reread.data;
      if (
        r.black_guest_id === args.guestId ||
        (args.userId && r.black_player_id === args.userId)
      ) {
        return { ok: true, data: r };
      }
      return { ok: false, error: "room_full" };
    }
    return { ok: false, error: "request_failed" };
  }

  return { ok: true, data: normalizeRoom(data) };
}

export async function makeRoomMove(
  roomCode: string,
  move: { from: string; to: string; promotion?: string },
  currentRoom: RoomRow,
): Promise<RoomResult<RoomRow>> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "db_not_configured" };

  const chess = new Chess(currentRoom.fen);
  let moveResult;
  try {
    moveResult = chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
  } catch {
    return { ok: false, error: "invalid_move" };
  }
  if (!moveResult) return { ok: false, error: "invalid_move" };

  const newFen = chess.fen();
  const newSanMoves = [...currentRoom.san_moves, moveResult.san];
  const newPgn = chess.pgn();
  const newTurn = chess.turn();

  let newStatus: RoomStatus = "active";
  let newResult: string | null = null;
  let newFinish: string | null = null;

  if (chess.isCheckmate()) {
    newStatus = newTurn === "w" ? "black_won" : "white_won";
    newResult = newTurn === "w" ? "black_won" : "white_won";
    newFinish = "checkmate";
  } else if (chess.isStalemate()) {
    newStatus = "draw";
    newResult = "draw";
    newFinish = "stalemate";
  } else if (chess.isDraw()) {
    newStatus = "draw";
    newResult = "draw";
    newFinish = "draw";
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("multiplayer_rooms")
    .update({
      fen: newFen,
      pgn: newPgn,
      san_moves: newSanMoves,
      turn: newTurn,
      status: newStatus,
      result: newResult,
      finish: newFinish,
      last_move_at: now,
      updated_at: now,
    })
    .eq("room_code", roomCode.toUpperCase())
    .select()
    .single();

  if (error) {
    if (isTableNotFound(error)) return { ok: false, error: "table_not_found" };
    return { ok: false, error: "request_failed" };
  }

  return { ok: true, data: normalizeRoom(data) };
}

export async function resignRoom(
  roomCode: string,
  resigningColor: "w" | "b",
): Promise<RoomResult<RoomRow>> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "db_not_configured" };

  const newStatus: RoomStatus = resigningColor === "w" ? "black_won" : "white_won";
  const newResult = resigningColor === "w" ? "black_won" : "white_won";
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("multiplayer_rooms")
    .update({
      status: newStatus,
      result: newResult,
      finish: "resignation",
      updated_at: now,
      last_move_at: now,
    })
    .eq("room_code", roomCode.toUpperCase())
    .select()
    .single();

  if (error) {
    if (isTableNotFound(error)) return { ok: false, error: "table_not_found" };
    return { ok: false, error: "request_failed" };
  }

  return { ok: true, data: normalizeRoom(data) };
}

export function subscribeToRoom(
  roomCode: string,
  onUpdate: (room: RoomRow) => void,
): () => void {
  const supabase = createClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`room:${roomCode}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "multiplayer_rooms",
        filter: `room_code=eq.${roomCode.toUpperCase()}`,
      },
      (payload) => {
        if (payload.new) {
          onUpdate(normalizeRoom(payload.new));
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
