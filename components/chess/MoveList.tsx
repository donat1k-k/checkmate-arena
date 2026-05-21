import type { Move } from "chess.js";

type MoveListProps = {
  moves: Move[];
};

export default function MoveList({ moves }: MoveListProps) {
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
    <div className="rounded-lg border border-arena-border bg-arena-panel">
      <div className="border-b border-arena-border px-3 py-2 text-sm font-medium">
        Moves
      </div>
      <div className="max-h-64 overflow-y-auto px-3 py-2">
        {rows.length === 0 ? (
          <p className="text-sm text-arena-muted">No moves yet.</p>
        ) : (
          <ol className="text-sm">
            {rows.map((row) => (
              <li key={row.number} className="flex gap-2 py-0.5">
                <span className="w-6 shrink-0 text-arena-muted">
                  {row.number}.
                </span>
                <span className="w-16 font-mono">{row.white}</span>
                <span className="w-16 font-mono">{row.black ?? ""}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
