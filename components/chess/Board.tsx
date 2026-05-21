"use client";

import { Chessboard } from "react-chessboard";
import type { Color, Square } from "chess.js";

type BoardProps = {
  fen: string;
  orientation: Color;
  squareStyles: Record<string, React.CSSProperties>;
  allowDragging: boolean;
  onSquareClick: (square: Square) => void;
  onPieceDrop: (from: Square, to: Square) => boolean;
};

export default function Board({
  fen,
  orientation,
  squareStyles,
  allowDragging,
  onSquareClick,
  onPieceDrop,
}: BoardProps) {
  return (
    <div className="w-full max-w-[560px]">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation === "w" ? "white" : "black",
          allowDragging,
          squareStyles,
          darkSquareStyle: { backgroundColor: "#3a4a63" },
          lightSquareStyle: { backgroundColor: "#cdd6e3" },
          boardStyle: { borderRadius: "6px" },
          onSquareClick: ({ square }) => onSquareClick(square as Square),
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare) return false;
            return onPieceDrop(sourceSquare as Square, targetSquare as Square);
          },
        }}
      />
    </div>
  );
}
