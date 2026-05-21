import { Chess, type Color, type Move, type Square } from "chess.js";

export type GameOutcome =
  | { state: "checkmate"; winner: Color }
  | { state: "stalemate" }
  | { state: "draw"; reason: "insufficient" | "threefold" | "fifty-move" }
  | { state: "resigned"; winner: Color };

export type GameStatus =
  | { state: "playing"; turn: Color; inCheck: boolean }
  | GameOutcome;

export type PromotionPiece = "q" | "r" | "b" | "n";

export type MoveResult =
  | { ok: true; san: string }
  | { ok: false; reason: "illegal" | "needs-promotion" | "game-over" };

/**
 * Wrapper around chess.js. Owns a single game and exposes the small surface
 * the UI needs: legal targets, move application, and end-of-game status.
 */
export class ChessGame {
  private chess: Chess;
  private resignedBy: Color | null = null;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  get fen(): string {
    return this.chess.fen();
  }

  get turn(): Color {
    return this.chess.turn();
  }

  history(): Move[] {
    return this.chess.history({ verbose: true });
  }

  /** Squares the piece on `from` may legally move to. */
  legalTargets(from: Square): Square[] {
    return this.chess.moves({ square: from, verbose: true }).map((m) => m.to);
  }

  /** True when moving from→to is a pawn promotion and needs a piece choice. */
  isPromotion(from: Square, to: Square): boolean {
    return this.chess
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && m.promotion !== undefined);
  }

  move(from: Square, to: Square, promotion?: PromotionPiece): MoveResult {
    if (this.isGameOver()) return { ok: false, reason: "game-over" };
    if (!promotion && this.isPromotion(from, to)) {
      return { ok: false, reason: "needs-promotion" };
    }
    try {
      const m = this.chess.move({ from, to, promotion });
      return { ok: true, san: m.san };
    } catch {
      return { ok: false, reason: "illegal" };
    }
  }

  resign(color: Color): void {
    if (this.isGameOver()) return;
    this.resignedBy = color;
  }

  isGameOver(): boolean {
    return this.resignedBy !== null || this.chess.isGameOver();
  }

  /** Square of the king currently in check, or null when not in check. */
  checkedKingSquare(): Square | null {
    if (!this.chess.inCheck()) return null;
    const turn = this.chess.turn();
    for (const row of this.chess.board()) {
      for (const piece of row) {
        if (piece && piece.type === "k" && piece.color === turn) {
          return piece.square;
        }
      }
    }
    return null;
  }

  status(): GameStatus {
    if (this.resignedBy) {
      return {
        state: "resigned",
        winner: this.resignedBy === "w" ? "b" : "w",
      };
    }
    if (this.chess.isCheckmate()) {
      // Side to move is checkmated, so the opponent won.
      return { state: "checkmate", winner: this.chess.turn() === "w" ? "b" : "w" };
    }
    if (this.chess.isStalemate()) return { state: "stalemate" };
    if (this.chess.isInsufficientMaterial()) {
      return { state: "draw", reason: "insufficient" };
    }
    if (this.chess.isThreefoldRepetition()) {
      return { state: "draw", reason: "threefold" };
    }
    if (this.chess.isDraw()) return { state: "draw", reason: "fifty-move" };
    return {
      state: "playing",
      turn: this.chess.turn(),
      inCheck: this.chess.inCheck(),
    };
  }
}
