export type BlitzDifficulty = "easy" | "medium" | "hard";

export type BlitzPuzzle = {
  id: string;
  title: string;
  titleRu: string;
  fen: string;
  sideToMove: "w" | "b";
  solution: string;
  difficulty: BlitzDifficulty;
  timeLimitSeconds: number;
  explanation: string;
  explanationRu: string;
  rewardCoins: number;
};

export const BLITZ_PUZZLES: BlitzPuzzle[] = [
  {
    id: "bp1",
    title: "Back Rank Strike",
    titleRu: "Удар по восьмой горизонтали",
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    sideToMove: "w",
    solution: "Rd8",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "The rook delivers a back-rank checkmate. Black's pawns on f7, g7, h7 seal every escape route.",
    explanationRu: "Ладья даёт мат по последней горизонтали. Пешки чёрных на f7, g7, h7 блокируют все пути отступления.",
    rewardCoins: 5,
  },
  {
    id: "bp2",
    title: "Queen Sweep",
    titleRu: "Удар ферзём",
    fen: "7k/6pp/7Q/8/8/8/6PP/6K1 w - - 0 1",
    sideToMove: "w",
    solution: "Qxg7",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "Capture the g7 pawn and deliver checkmate. The h7 pawn blocks the king's only escape square.",
    explanationRu: "Захватите пешку g7 и объявите мат. Пешка h7 закрывает единственный выход королю.",
    rewardCoins: 5,
  },
  {
    id: "bp3",
    title: "Corner Trap",
    titleRu: "Угловая ловушка",
    fen: "8/8/8/8/8/6K1/6Q1/7k w - - 0 1",
    sideToMove: "w",
    solution: "Qg1",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "The queen steps to g1, cutting off all escape. The white king controls h2 and the king is trapped in the corner.",
    explanationRu: "Ферзь идёт на g1 и перекрывает все выходы. Белый король контролирует h2 — чёрный король заперт в углу.",
    rewardCoins: 5,
  },
  {
    id: "bp4",
    title: "Rook Battery",
    titleRu: "Батарея ладьи",
    fen: "5rk1/5ppp/8/8/8/2R5/5PPP/6K1 w - - 0 1",
    sideToMove: "w",
    solution: "Rc8",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "The rook delivers checkmate on c8. Black's own rook and pawns seal the king with no escape.",
    explanationRu: "Ладья даёт мат на c8. Собственные ладья и пешки чёрных закрывают королю все выходы.",
    rewardCoins: 5,
  },
  {
    id: "bp5",
    title: "Corridor Mate",
    titleRu: "Мат в коридоре",
    fen: "5k2/8/5K2/8/8/8/8/5Q2 w - - 0 1",
    sideToMove: "w",
    solution: "Qf7",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "The queen delivers corridor checkmate on f7. Both diagonals and the white king eliminate every escape.",
    explanationRu: "Ферзь даёт мат в коридоре на f7. Диагонали и белый король перекрывают все выходы.",
    rewardCoins: 8,
  },
  {
    id: "bp6",
    title: "King & Rook Finale",
    titleRu: "Финал ладьи и короля",
    fen: "k1K5/8/R7/8/8/8/8/8 w - - 0 1",
    sideToMove: "w",
    solution: "Ra7",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Rook to a7 delivers checkmate. The king on c8 covers b8, and the rook on a7 guards the entire 7th rank.",
    explanationRu: "Ладья на a7 — мат. Король на c8 контролирует b8, а ладья на a7 охраняет всю седьмую горизонталь.",
    rewardCoins: 8,
  },
  {
    id: "bp7",
    title: "Rook Box",
    titleRu: "Ладейный ящик",
    fen: "k7/8/KR6/8/8/8/8/8 w - - 0 1",
    sideToMove: "w",
    solution: "Rb8",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Rook to b8 delivers check along the 8th rank. The escape to a7 is cut off by the white king on a6.",
    explanationRu: "Ладья на b8 — шах по восьмой горизонтали. Побег на a7 перекрыт белым королём на a6.",
    rewardCoins: 8,
  },
  {
    id: "bp8",
    title: "Queen Box",
    titleRu: "Ферзевый ящик",
    fen: "2k5/8/2K5/8/8/8/2Q5/8 w - - 0 1",
    sideToMove: "w",
    solution: "Qc7",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Queen to c7 is checkmate. Both diagonals and the 7th rank cover every adjacent square.",
    explanationRu: "Ферзь на c7 — мат. Диагонали и седьмая горизонталь перекрывают все соседние клетки.",
    rewardCoins: 8,
  },
  {
    id: "bp9",
    title: "Knight Fork",
    titleRu: "Вилка конём",
    fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
    sideToMove: "w",
    solution: "Nc7",
    difficulty: "hard",
    timeLimitSeconds: 10,
    explanation: "Knight to c7 forks the king and the rook on a8. After the king moves you win the rook for free.",
    explanationRu: "Конь на c7 — вилка на короля и ладью a8. После хода короля ладья берётся бесплатно.",
    rewardCoins: 12,
  },
  {
    id: "bp10",
    title: "Smothered Strike",
    titleRu: "Удушающий удар",
    fen: "5k2/4Rppp/8/8/8/8/5PPP/6K1 w - - 0 1",
    sideToMove: "w",
    solution: "Re8",
    difficulty: "hard",
    timeLimitSeconds: 10,
    explanation: "Rook to e8 delivers checkmate. The king is smothered by its own pawns with no escape on any side.",
    explanationRu: "Ладья на e8 — мат. Король задушен собственными пешками и не имеет выхода ни в одну сторону.",
    rewardCoins: 12,
  },
];

export const BLITZ_PUZZLES_BY_DIFFICULTY: Record<BlitzDifficulty, BlitzPuzzle[]> = {
  easy: BLITZ_PUZZLES.filter((p) => p.difficulty === "easy"),
  medium: BLITZ_PUZZLES.filter((p) => p.difficulty === "medium"),
  hard: BLITZ_PUZZLES.filter((p) => p.difficulty === "hard"),
};

// ── localStorage ──────────────────────────────────────────────────────────────

const BLITZ_STATS_KEY = "checkmate-arena.blitz-stats.v1";

export type BlitzStats = {
  solved: number;
  streak: number;
  bestStreak: number;
  coinsEarned: number;
  attempts: number;
  solvedIds: string[];
  hintUsedThisSession: boolean;
};

const DEFAULT_BLITZ_STATS: BlitzStats = {
  solved: 0,
  streak: 0,
  bestStreak: 0,
  coinsEarned: 0,
  attempts: 0,
  solvedIds: [],
  hintUsedThisSession: false,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function loadBlitzStats(): BlitzStats {
  if (!canUseStorage()) return { ...DEFAULT_BLITZ_STATS };
  try {
    const raw = window.localStorage.getItem(BLITZ_STATS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<BlitzStats>) : null;
    return {
      solved: typeof parsed?.solved === "number" ? Math.max(0, Math.round(parsed.solved)) : 0,
      streak: typeof parsed?.streak === "number" ? Math.max(0, Math.round(parsed.streak)) : 0,
      bestStreak:
        typeof parsed?.bestStreak === "number" ? Math.max(0, Math.round(parsed.bestStreak)) : 0,
      coinsEarned:
        typeof parsed?.coinsEarned === "number" ? Math.max(0, Math.round(parsed.coinsEarned)) : 0,
      attempts: typeof parsed?.attempts === "number" ? Math.max(0, Math.round(parsed.attempts)) : 0,
      solvedIds: Array.isArray(parsed?.solvedIds)
        ? parsed.solvedIds.filter((v): v is string => typeof v === "string")
        : [],
      hintUsedThisSession: false,
    };
  } catch {
    return { ...DEFAULT_BLITZ_STATS };
  }
}

export function recordBlitzSolve(puzzleId: string, coinsEarned: number): BlitzStats {
  const stats = loadBlitzStats();
  const alreadySolved = stats.solvedIds.includes(puzzleId);
  const newSolvedIds = alreadySolved ? stats.solvedIds : [...stats.solvedIds, puzzleId];
  const newStreak = stats.streak + 1;
  const newBestStreak = Math.max(stats.bestStreak, newStreak);
  const addCoins = alreadySolved ? 0 : coinsEarned;
  const next: BlitzStats = {
    solved: alreadySolved ? stats.solved : stats.solved + 1,
    streak: newStreak,
    bestStreak: newBestStreak,
    coinsEarned: stats.coinsEarned + addCoins,
    attempts: stats.attempts + 1,
    solvedIds: newSolvedIds,
    hintUsedThisSession: stats.hintUsedThisSession,
  };
  if (canUseStorage()) {
    window.localStorage.setItem(BLITZ_STATS_KEY, JSON.stringify(next));
  }
  return next;
}

export function recordBlitzFail(): BlitzStats {
  const stats = loadBlitzStats();
  const next: BlitzStats = {
    ...stats,
    streak: 0,
    attempts: stats.attempts + 1,
  };
  if (canUseStorage()) {
    window.localStorage.setItem(BLITZ_STATS_KEY, JSON.stringify(next));
  }
  return next;
}

export function markHintUsed(): BlitzStats {
  const stats = loadBlitzStats();
  const next: BlitzStats = { ...stats, hintUsedThisSession: true };
  if (canUseStorage()) {
    window.localStorage.setItem(BLITZ_STATS_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetBlitzStats(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(BLITZ_STATS_KEY);
}

export function getAccuracy(stats: BlitzStats): number {
  if (stats.attempts === 0) return 0;
  return Math.round((stats.solved / stats.attempts) * 100);
}
