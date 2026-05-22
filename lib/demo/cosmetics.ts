export type CosmeticCategory = "frame" | "board" | "coach" | "title";

export type EquippedCosmetics = {
  frame: string | null;
  board: string | null;
  coach: string | null;
  title: string | null;
};

const COSMETICS_KEY = "checkmate-arena.equipped-cosmetics.v1";

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  frame: null,
  board: null,
  coach: null,
  title: null,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function loadEquippedCosmetics(): EquippedCosmetics {
  if (!canUseStorage()) return { ...DEFAULT_EQUIPPED };
  try {
    const raw = window.localStorage.getItem(COSMETICS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<EquippedCosmetics>) : null;
    return {
      frame: typeof parsed?.frame === "string" ? parsed.frame : null,
      board: typeof parsed?.board === "string" ? parsed.board : null,
      coach: typeof parsed?.coach === "string" ? parsed.coach : null,
      title: typeof parsed?.title === "string" ? parsed.title : null,
    };
  } catch {
    return { ...DEFAULT_EQUIPPED };
  }
}

export function equipCosmetic(
  category: CosmeticCategory,
  itemId: string | null,
): EquippedCosmetics {
  const current = loadEquippedCosmetics();
  const next: EquippedCosmetics = { ...current, [category]: itemId };
  if (canUseStorage()) {
    window.localStorage.setItem(COSMETICS_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetEquippedCosmetics(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(COSMETICS_KEY);
}
