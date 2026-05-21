"use client";

import { Chessboard } from "react-chessboard";

const PREVIEW_POSITION =
  "r2q1rk1/ppp2ppp/2n1bn2/3pp3/3PP3/2N1BN2/PPP2PPP/R2Q1RK1 w - - 0 9";

export default function ArenaPreviewBoard() {
  return (
    <div aria-hidden className="rounded-lg border border-arena-border bg-arena-panel p-3 shadow-2xl shadow-black/30">
      <Chessboard
        options={{
          position: PREVIEW_POSITION,
          allowDragging: false,
          darkSquareStyle: { backgroundColor: "#32465f" },
          lightSquareStyle: { backgroundColor: "#d7dfeb" },
          boardStyle: { borderRadius: "6px" },
        }}
      />
    </div>
  );
}
