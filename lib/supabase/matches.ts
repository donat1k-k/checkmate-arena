import type { SupabaseClient } from "@supabase/supabase-js";
import type { Color } from "chess.js";
import { buildDemoCoachReview } from "@/lib/demo/coach";
import type {
  LocalMatch,
  MatchFinish,
  MatchResult,
} from "@/lib/demo/progress";
import type { GameOutcome } from "@/lib/chess/engine";
import type { Locale } from "@/lib/i18n/translations";
import {
  nextAccountProfile,
  saveAccountProfileProgress,
  type AccountProfile,
} from "@/lib/supabase/profiles";
import { saveAccountReview } from "@/lib/supabase/reviews";

const LOCAL_RIVAL_ID = "local-rival";

type MatchRow = {
  id: string;
  white_player_id: string | null;
  black_player_id: string | null;
  white_nickname: string;
  black_nickname: string;
  status: string;
  result: "white_won" | "black_won" | "draw" | null;
  moves: unknown;
  final_fen: string | null;
  rating_change_white: number | null;
  rating_change_black: number | null;
  created_at: string;
  finished_at: string | null;
};

export type AccountMatch = {
  id: string;
  playerId: string | null;
  playerNickname: string;
  opponentNickname: string;
  playerColor: Color;
  result: MatchResult;
  ratingDelta: number;
  sanMoves: string[];
  moveCount: number;
  finalFen: string | null;
  status: string;
  createdAt: string;
  finishedAt: string;
};

export type CompletedAccountMatch = AccountMatch & {
  ratingBefore: number;
  ratingAfter: number;
};

type AccountMatchListResult = {
  error: "requestFailed" | null;
  matches: AccountMatch[];
};

type AccountMatchResult = {
  error: "requestFailed" | null;
  match: AccountMatch | null;
};

type CompleteAccountMatchInput = {
  createdAt: string;
  finalFen: string;
  locale: Locale;
  outcome: GameOutcome;
  sanMoves: string[];
  playerColor?: Color;
  opponentNickname?: string;
};

type CompleteAccountMatchResult = {
  error: "requestFailed" | null;
  match: CompletedAccountMatch | null;
  profile: AccountProfile;
};

function sanMovesFromRow(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((move): move is string => typeof move === "string")
    : [];
}

function resultFromOutcome(
  outcome: GameOutcome,
  playerColor: Color,
): MatchResult {
  if (outcome.state === "stalemate" || outcome.state === "draw") return "draw";
  return outcome.winner === playerColor ? "win" : "loss";
}

function finishFromOutcome(outcome: GameOutcome): MatchFinish {
  if (outcome.state === "checkmate") return "checkmate";
  if (outcome.state === "resigned") return "resignation";
  if (outcome.state === "stalemate") return "stalemate";
  return outcome.reason;
}

function ratingDelta(result: MatchResult): number {
  if (result === "win") return 25;
  if (result === "loss") return -25;
  return 0;
}

function databaseResult(outcome: GameOutcome): MatchRow["result"] {
  if (outcome.state === "stalemate" || outcome.state === "draw") return "draw";
  return outcome.winner === "w" ? "white_won" : "black_won";
}

function databaseStatus(outcome: GameOutcome): string {
  if (outcome.state === "resigned") return "resigned";
  if (outcome.state === "stalemate" || outcome.state === "draw") return "draw";
  return outcome.winner === "w" ? "white_won" : "black_won";
}

function rowResult(row: MatchRow, playerColor: Color): MatchResult {
  if (row.result === "draw" || row.result === null) return "draw";

  const playerWon =
    (playerColor === "w" && row.result === "white_won") ||
    (playerColor === "b" && row.result === "black_won");

  return playerWon ? "win" : "loss";
}

function rowPlayerColor(row: MatchRow, playerId?: string): Color {
  if (playerId && row.black_player_id === playerId) return "b";
  if (!row.white_player_id && row.black_player_id) return "b";
  return "w";
}

function toAccountMatch(row: MatchRow, playerId?: string): AccountMatch {
  const playerColor = rowPlayerColor(row, playerId);
  const sanMoves = sanMovesFromRow(row.moves);
  const isWhite = playerColor === "w";

  return {
    id: row.id,
    playerId: isWhite ? row.white_player_id : row.black_player_id,
    playerNickname: isWhite ? row.white_nickname : row.black_nickname,
    opponentNickname: isWhite ? row.black_nickname : row.white_nickname,
    playerColor,
    result: rowResult(row, playerColor),
    ratingDelta:
      (isWhite ? row.rating_change_white : row.rating_change_black) ?? 0,
    sanMoves,
    moveCount: Math.ceil(sanMoves.length / 2),
    finalFen: row.final_fen,
    status: row.status,
    createdAt: row.created_at,
    finishedAt: row.finished_at ?? row.created_at,
  };
}

function coachSourceMatch(
  profile: AccountProfile,
  input: CompleteAccountMatchInput,
  playerColor: Color,
  opponentNickname: string,
  result: MatchResult,
  ratingBefore: number,
  ratingAfter: number,
): LocalMatch {
  return {
    id: "account-coach-source",
    guestId: profile.id,
    guestNickname: profile.nickname,
    opponentNickname,
    playerColor,
    result,
    finish: finishFromOutcome(input.outcome),
    ratingBefore,
    ratingAfter,
    ratingDelta: ratingAfter - ratingBefore,
    sanMoves: input.sanMoves,
    moveCount: Math.ceil(input.sanMoves.length / 2),
    finalFen: input.finalFen,
    createdAt: input.createdAt,
    finishedAt: new Date().toISOString(),
  };
}

const matchSelect =
  "id, white_player_id, black_player_id, white_nickname, black_nickname, status, result, moves, final_fen, rating_change_white, rating_change_black, created_at, finished_at";

export async function loadAccountMatches(
  supabase: SupabaseClient,
  profileId: string,
): Promise<AccountMatchListResult> {
  const { data, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .or(`white_player_id.eq.${profileId},black_player_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(30);

  return error
    ? { error: "requestFailed", matches: [] }
    : {
        error: null,
        matches: (data as MatchRow[]).map((match) =>
          toAccountMatch(match, profileId),
        ),
      };
}

export async function loadAccountMatch(
  supabase: SupabaseClient,
  matchId: string,
): Promise<AccountMatchResult> {
  const { data, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("id", matchId)
    .maybeSingle();

  return error || !data
    ? { error: error ? "requestFailed" : null, match: null }
    : { error: null, match: toAccountMatch(data as MatchRow) };
}

export async function recordAccountMatch(
  supabase: SupabaseClient,
  profile: AccountProfile,
  input: CompleteAccountMatchInput,
): Promise<CompleteAccountMatchResult> {
  const playerColor = input.playerColor ?? "w";
  const opponentNickname = input.opponentNickname ?? LOCAL_RIVAL_ID;
  const result = resultFromOutcome(input.outcome, playerColor);
  const ratingBefore = profile.rating;
  const ratingAfter = Math.max(0, ratingBefore + ratingDelta(result));
  const nextProfile = nextAccountProfile(profile, result, ratingAfter);
  const finishedAt = new Date().toISOString();
  const isWhite = playerColor === "w";
  const ratingChange = ratingAfter - ratingBefore;
  const playerWon =
    (input.outcome.state === "checkmate" || input.outcome.state === "resigned") &&
    input.outcome.winner === playerColor;

  const { data, error: matchError } = await supabase
    .from("matches")
    .insert({
      white_player_id: isWhite ? profile.id : null,
      black_player_id: isWhite ? null : profile.id,
      white_nickname: isWhite ? profile.nickname : opponentNickname,
      black_nickname: isWhite ? opponentNickname : profile.nickname,
      status: databaseStatus(input.outcome),
      result: databaseResult(input.outcome),
      winner_id: playerWon ? profile.id : null,
      moves: input.sanMoves,
      final_fen: input.finalFen,
      time_control: "unlimited",
      rating_change_white: isWhite ? ratingChange : -ratingChange,
      rating_change_black: isWhite ? -ratingChange : ratingChange,
      created_at: input.createdAt,
      finished_at: finishedAt,
    })
    .select(matchSelect)
    .single();

  if (matchError || !data) {
    return { error: "requestFailed", match: null, profile };
  }

  const savedMatch = toAccountMatch(data as MatchRow, profile.id);
  const review = buildDemoCoachReview(
    coachSourceMatch(
      profile,
      input,
      playerColor,
      opponentNickname,
      result,
      ratingBefore,
      ratingAfter,
    ),
    input.locale,
  );
  const savedReview = await saveAccountReview(supabase, savedMatch.id, review);

  if (savedReview.error) {
    return { error: "requestFailed", match: null, profile };
  }

  const profileError = await saveAccountProfileProgress(supabase, nextProfile);
  if (profileError) {
    return { error: profileError, match: null, profile };
  }

  return {
    error: null,
    match: {
      ...savedMatch,
      ratingBefore,
      ratingAfter,
    },
    profile: nextProfile,
  };
}
