import type { Color } from "chess.js";
import type { GameOutcome } from "@/lib/chess/engine";

const PROFILE_KEY = "checkmate-arena.guest-profile.v1";
const MATCHES_KEY = "checkmate-arena.local-matches.v1";
const ACTIVE_GAME_KEY = "checkmate-arena.active-game.v1";
const DEFAULT_RATING = 1000;
const LOCAL_RIVAL_OPPONENT_ID = "local-rival";
const LEGACY_LOCAL_RIVAL_NICKNAME = "Local Rival";

export type MatchResult = "win" | "loss" | "draw";

export type GuestProfile = {
  id: string;
  nickname: string;
  rating: number;
  peakRating: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  createdAt: string;
};

export type MatchFinish =
  | "checkmate"
  | "resignation"
  | "stalemate"
  | "insufficient"
  | "threefold"
  | "fifty-move";

export type LocalMatch = {
  id: string;
  guestId: string;
  guestNickname: string;
  opponentNickname: string;
  playerColor: Color;
  result: MatchResult;
  finish: MatchFinish;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  sanMoves: string[];
  moveCount: number;
  finalFen: string;
  createdAt: string;
  finishedAt: string;
};

type CompleteMatchInput = {
  id: string;
  createdAt: string;
  finalFen: string;
  outcome: GameOutcome;
  sanMoves: string[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readStoredJson(key: string): unknown {
  if (!canUseStorage()) return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isGuestProfile(value: unknown): value is GuestProfile {
  if (!value || typeof value !== "object") return false;

  const profile = value as Partial<GuestProfile>;
  return (
    typeof profile.id === "string" &&
    typeof profile.nickname === "string" &&
    isNumber(profile.rating) &&
    isNumber(profile.peakRating) &&
    isNumber(profile.wins) &&
    isNumber(profile.losses) &&
    isNumber(profile.draws) &&
    isNumber(profile.streak) &&
    typeof profile.createdAt === "string"
  );
}

function isMatchResult(value: unknown): value is MatchResult {
  return value === "win" || value === "loss" || value === "draw";
}

function isMatchFinish(value: unknown): value is MatchFinish {
  return (
    value === "checkmate" ||
    value === "resignation" ||
    value === "stalemate" ||
    value === "insufficient" ||
    value === "threefold" ||
    value === "fifty-move"
  );
}

function isLocalMatch(value: unknown): value is LocalMatch {
  if (!value || typeof value !== "object") return false;

  const match = value as Partial<LocalMatch>;
  return (
    typeof match.id === "string" &&
    typeof match.guestId === "string" &&
    typeof match.guestNickname === "string" &&
    typeof match.opponentNickname === "string" &&
    (match.playerColor === "w" || match.playerColor === "b") &&
    isMatchResult(match.result) &&
    isMatchFinish(match.finish) &&
    isNumber(match.ratingBefore) &&
    isNumber(match.ratingAfter) &&
    isNumber(match.ratingDelta) &&
    Array.isArray(match.sanMoves) &&
    match.sanMoves.every((move) => typeof move === "string") &&
    isNumber(match.moveCount) &&
    typeof match.finalFen === "string" &&
    typeof match.createdAt === "string" &&
    typeof match.finishedAt === "string"
  );
}

function finishFromOutcome(outcome: GameOutcome): MatchFinish {
  if (outcome.state === "checkmate") return "checkmate";
  if (outcome.state === "resigned") return "resignation";
  if (outcome.state === "stalemate") return "stalemate";
  return outcome.reason;
}

function resultFromOutcome(outcome: GameOutcome): MatchResult {
  if (outcome.state === "stalemate" || outcome.state === "draw") return "draw";
  return outcome.winner === "w" ? "win" : "loss";
}

function requestedRatingDelta(result: MatchResult): number {
  if (result === "win") return 25;
  if (result === "loss") return -25;
  return 0;
}

function updatedProfile(profile: GuestProfile, match: LocalMatch): GuestProfile {
  return {
    ...profile,
    rating: match.ratingAfter,
    peakRating: Math.max(profile.peakRating, match.ratingAfter),
    wins: profile.wins + (match.result === "win" ? 1 : 0),
    losses: profile.losses + (match.result === "loss" ? 1 : 0),
    draws: profile.draws + (match.result === "draw" ? 1 : 0),
    streak: match.result === "win" ? profile.streak + 1 : 0,
  };
}

export function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sanitizeNickname(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

export function createGuestProfile(nickname: string): GuestProfile {
  const createdAt = new Date().toISOString();

  return {
    id: createLocalId("guest"),
    nickname: sanitizeNickname(nickname),
    rating: DEFAULT_RATING,
    peakRating: DEFAULT_RATING,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    createdAt,
  };
}

export function loadGuestProfile(): GuestProfile | null {
  const value = readStoredJson(PROFILE_KEY);
  return isGuestProfile(value) ? value : null;
}

export function saveGuestProfile(profile: GuestProfile): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadMatches(): LocalMatch[] {
  const value = readStoredJson(MATCHES_KEY);
  return Array.isArray(value) ? value.filter(isLocalMatch) : [];
}

function saveMatches(matches: LocalMatch[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function recordCompletedMatch(
  profile: GuestProfile,
  input: CompleteMatchInput,
): { inserted: boolean; match: LocalMatch; profile: GuestProfile } {
  const previousMatches = loadMatches();
  const savedMatch = previousMatches.find((match) => match.id === input.id);

  if (savedMatch) {
    return {
      inserted: false,
      match: savedMatch,
      profile: loadGuestProfile() ?? profile,
    };
  }

  const result = resultFromOutcome(input.outcome);
  const ratingBefore = profile.rating;
  const ratingAfter = Math.max(0, ratingBefore + requestedRatingDelta(result));
  const match: LocalMatch = {
    id: input.id,
    guestId: profile.id,
    guestNickname: profile.nickname,
    opponentNickname: LOCAL_RIVAL_OPPONENT_ID,
    playerColor: "w",
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
  const nextProfile = updatedProfile(profile, match);

  saveMatches([match, ...previousMatches].slice(0, 30));
  saveGuestProfile(nextProfile);

  return { inserted: true, match, profile: nextProfile };
}

export function getOpponentDisplayName(
  opponentNickname: string,
  localRivalLabel: string,
): string {
  return opponentNickname === LOCAL_RIVAL_OPPONENT_ID ||
    opponentNickname === LEGACY_LOCAL_RIVAL_NICKNAME
    ? localRivalLabel
    : opponentNickname;
}

export function getGamesPlayed(profile: GuestProfile): number {
  return profile.wins + profile.losses + profile.draws;
}

export function getWinRate(profile: GuestProfile): number {
  const games = getGamesPlayed(profile);
  return games === 0 ? 0 : Math.round((profile.wins / games) * 100);
}

export function getRatingLevel(rating: number): number {
  if (rating < 800) return 1;
  if (rating < 1000) return 2;
  if (rating < 1200) return 3;
  if (rating < 1400) return 4;
  if (rating < 1600) return 5;
  if (rating < 1800) return 6;
  if (rating < 2000) return 7;
  if (rating < 2200) return 8;
  if (rating < 2400) return 9;
  return 10;
}

export function formatResult(result: MatchResult): string {
  if (result === "win") return "Win";
  if (result === "loss") return "Loss";
  return "Draw";
}

export function formatFinish(finish: MatchFinish): string {
  switch (finish) {
    case "checkmate":
      return "Checkmate";
    case "resignation":
      return "Resignation";
    case "stalemate":
      return "Stalemate";
    case "insufficient":
      return "Insufficient material";
    case "threefold":
      return "Threefold repetition";
    case "fifty-move":
      return "Fifty-move rule";
  }
}

export type ActiveGameDraft = {
  pgn: string;
  matchId: string;
  createdAt: string;
  savedAt: string;
  profileId: string;
};

function isActiveDraft(value: unknown): value is ActiveGameDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<ActiveGameDraft>;
  return (
    typeof d.pgn === "string" &&
    typeof d.matchId === "string" &&
    typeof d.createdAt === "string" &&
    typeof d.savedAt === "string" &&
    typeof d.profileId === "string"
  );
}

export function saveActiveGame(draft: ActiveGameDraft): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(draft));
}

export function loadActiveGame(): ActiveGameDraft | null {
  const value = readStoredJson(ACTIVE_GAME_KEY);
  return isActiveDraft(value) ? value : null;
}

export function clearActiveGame(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACTIVE_GAME_KEY);
}
