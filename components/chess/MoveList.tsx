"use client";

import type { Move } from "chess.js";
import { usePreferences } from "@/components/settings/PreferencesProvider";

type MoveListProps = {
  moves: Move[];
};

export default function MoveList({ moves }: MoveListProps) {
  const { t } = usePreferences();
  const rows: { number: number; white?: string; black?: string }[] = [];
  moves.forEach((move, i) => {
    const row = Math.floor(i / 2);
    if (i % 2 === 0) {
      rows.push({ number: row + 1, white: move.san });
    } else {
      rows[row].black = move.san;
    }
  });

  return (
    <div className="overflow-hidden rounded-lg border border-arena-border bg-arena-panel">
      <div className="flex items-center justify-between gap-2 border-b border-arena-border px-3 py-2 text-sm">
        <p className="font-medium">{t.chess.moveList}</p>
        <p className="text-xs text-arena-muted">
          {moves.length === 0 ? t.chess.openingBoard : t.chess.plyRecorded(moves.length)}
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto px-3 py-2">
        {rows.length === 0 ? (
          <p className="text-sm text-arena-muted">{t.chess.noMoves}</p>
        ) : (
          <ol className="text-sm">
            {rows.map((row) => (
              <li
                key={row.number}
                className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-1 py-0.5 even:bg-arena-elevated/50"
              >
                <span className="w-6 shrink-0 text-arena-muted">
                  {row.number}.
                </span>
                <span className="font-mono">{row.white}</span>
                <span className="font-mono">{row.black ?? ""}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
