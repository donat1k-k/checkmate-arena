import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import type { AiDifficulty } from "@/lib/demo/progress";
import type { PromotionPiece } from "@/lib/chess/engine";

type AiMove = {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
};

const PIECE_VALUE: Partial<Record<PieceSymbol, number>> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function randomItem<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function isCheckingMove(move: Move): boolean {
  return move.san.includes("+") || move.san.includes("#");
}

function immediateMaterialGain(move: Move): number {
  const capturedValue = move.captured ? PIECE_VALUE[move.captured] ?? 0 : 0;
  const promotionGain = move.promotion
    ? (PIECE_VALUE[move.promotion] ?? 0) - (PIECE_VALUE.p ?? 0)
    : 0;

  return capturedValue + promotionGain;
}

function casualCandidates(moves: Move[]): Move[] {
  const forcing = moves.filter(
    (move) => Boolean(move.captured) || isCheckingMove(move),
  );

  return forcing.length > 0 ? forcing : moves;
}

function tacticalScore(move: Move): number {
  let score = immediateMaterialGain(move) * 18;

  if (move.captured) score += 8;
  if (isCheckingMove(move)) score += move.san.includes("#") ? 300 : 14;
  if (move.promotion) score += 24;

  return score;
}

function tacticalCandidate(moves: Move[]): Move | null {
  const bestScore = Math.max(...moves.map(tacticalScore));
  const bestMoves = moves.filter((move) => tacticalScore(move) === bestScore);

  return randomItem(bestMoves);
}

export function chooseAiMove(fen: string, difficulty: AiDifficulty): AiMove | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });

  const choice =
    difficulty === "beginner"
      ? randomItem(moves)
      : difficulty === "casual"
        ? randomItem(casualCandidates(moves))
        : tacticalCandidate(moves);

  if (!choice) return null;

  return {
    from: choice.from,
    to: choice.to,
    ...(choice.promotion
      ? { promotion: choice.promotion as PromotionPiece }
      : {}),
  };
}
