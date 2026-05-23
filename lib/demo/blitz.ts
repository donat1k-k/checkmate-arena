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
    fen: "5k2/8/4K3/8/8/8/8/5Q2 w - - 0 1",
    sideToMove: "w",
    solution: "Qf7",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "The queen climbs to f7 with checkmate. The white king protects the queen and covers the escape squares.",
    explanationRu: "Ферзь поднимается на f7 с матом. Белый король защищает ферзя и перекрывает поля отхода.",
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
    fen: "2k5/8/1K6/8/8/8/2Q5/8 w - - 0 1",
    sideToMove: "w",
    solution: "Qc7",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Queen to c7 is checkmate. The queen cuts the back-rank exits while the king guards the queen.",
    explanationRu: "Ферзь на c7 — мат. Ферзь отрезает выходы по последней горизонтали, а король защищает ферзя.",
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
  {
    id: "bp11",
    title: "Quiet Queen Seal",
    titleRu: "Тихая ферзевая печать",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    sideToMove: "w",
    solution: "Qf8",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "Queen to f8 seals the corner. The white king covers h7 and g7, so Black has no flight square.",
    explanationRu: "Ферзь на f8 запечатывает угол. Белый король контролирует h7 и g7, поэтому у чёрных нет выхода.",
    rewardCoins: 5,
  },
  {
    id: "bp12",
    title: "Queen Back-rank",
    titleRu: "Ферзь по первой горизонтали",
    fen: "6k1/5ppp/8/8/8/8/8/Q5K1 w - - 0 1",
    sideToMove: "w",
    solution: "Qa8",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "Queen to a8 gives checkmate on the back rank. Black's own pawns block every escape.",
    explanationRu: "Ферзь на a8 — мат по последней горизонтали. Пешки чёрных блокируют все выходы.",
    rewardCoins: 5,
  },
  {
    id: "bp13",
    title: "Rook Corridor",
    titleRu: "Ладейный коридор",
    fen: "1k6/ppp5/8/8/8/8/8/3R2K1 w - - 0 1",
    sideToMove: "w",
    solution: "Rd8",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Rook to d8 gives back-rank mate. The rook owns the 8th rank while Black's pawns block every escape.",
    explanationRu: "Ладья на d8 даёт мат по последней горизонтали. Ладья контролирует восьмую линию, а пешки чёрных закрывают выходы.",
    rewardCoins: 8,
  },
  {
    id: "bp14",
    title: "Bishop & Queen",
    titleRu: "Слон и ферзь",
    fen: "6k1/8/8/8/8/8/6BQ/6K1 w - - 0 1",
    sideToMove: "w",
    solution: "Qh7",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Queen to h7 delivers checkmate. The bishop on g2 controls f3-h1 diagonal and the queen covers h7.",
    explanationRu: "Ферзь на h7 — мат. Слон на g2 контролирует диагональ, ферзь перекрывает h7.",
    rewardCoins: 8,
  },
  {
    id: "bp15",
    title: "Rook Swing",
    titleRu: "Ладейный маятник",
    fen: "1k6/1p6/1K6/8/8/8/8/R7 w - - 0 1",
    sideToMove: "w",
    solution: "Ra8",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Rook to a8 is checkmate. King on b8 has no escape — b7 pawn blocks and white king covers a7, a6.",
    explanationRu: "Ладья на a8 — мат. Король b8 без выхода: пешка b7 блокирует, белый король закрывает a7, a6.",
    rewardCoins: 8,
  },
  {
    id: "bp16",
    title: "Queen & King",
    titleRu: "Ферзь и король",
    fen: "8/8/8/8/8/1k6/8/QK6 w - - 0 1",
    sideToMove: "w",
    solution: "Qa2",
    difficulty: "medium",
    timeLimitSeconds: 15,
    explanation: "Queen to a2 is checkmate. King on b3 is trapped — white king controls c2 and queen covers a2-a3.",
    explanationRu: "Ферзь на a2 — мат. Король b3 в ловушке: белый король контролирует c2, ферзь закрывает a2-a3.",
    rewardCoins: 8,
  },
  {
    id: "bp17",
    title: "Rook on Open File",
    titleRu: "Ладья по открытой линии",
    fen: "3rk3/4pppp/8/8/8/3R4/8/3R2K1 w - - 0 1",
    sideToMove: "w",
    solution: "Rxd8",
    difficulty: "hard",
    timeLimitSeconds: 10,
    explanation: "The upper rook captures on d8 with mate. The second rook protects the file, so the king cannot recapture.",
    explanationRu: "Верхняя ладья берёт на d8 с матом. Вторая ладья держит линию, поэтому король не может взять в ответ.",
    rewardCoins: 12,
  },
  {
    id: "bp18",
    title: "Back-rank Ladder",
    titleRu: "Лесенка по горизонтали",
    fen: "1k6/8/1K6/8/8/8/8/RR6 w - - 0 1",
    sideToMove: "w",
    solution: "Ra8",
    difficulty: "hard",
    timeLimitSeconds: 10,
    explanation: "Rook to a8 is checkmate. White king covers a7 and the two rooks command both back-rank files.",
    explanationRu: "Ладья на a8 — мат. Белый король закрывает a7, две ладьи контролируют последнюю горизонталь.",
    rewardCoins: 12,
  },
  {
    id: "bp19",
    title: "Queen Swing",
    titleRu: "Ферзевый маятник",
    fen: "7k/5ppp/8/8/8/8/8/Q5K1 w - - 0 1",
    sideToMove: "w",
    solution: "Qa7",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "Queen to a7 delivers checkmate along the 7th rank. Black's own pawns trap the king on h8.",
    explanationRu: "Ферзь на a7 — мат по седьмой горизонтали. Пешки чёрных запирают короля на h8.",
    rewardCoins: 5,
  },
  {
    id: "bp20",
    title: "Two Rooks Smash",
    titleRu: "Удар двух ладей",
    fen: "k7/p7/K7/8/8/8/8/RR6 w - - 0 1",
    sideToMove: "w",
    solution: "Rb8",
    difficulty: "hard",
    timeLimitSeconds: 10,
    explanation: "Rook to b8 is checkmate. King on a8 is hemmed in by the white king on a6 and pawn on a7. Ra1 stays guarding.",
    explanationRu: "Ладья на b8 — мат. Король a8 заперт белым королём на a6 и пешкой a7. Ra1 страхует.",
    rewardCoins: 12,
  },
  {
    id: "bp21",
    title: "Queen Corner Trap",
    titleRu: "Угловая ловушка ферзём",
    fen: "k7/8/1K6/8/8/8/8/Q7 w - - 0 1",
    sideToMove: "w",
    solution: "Qa6",
    difficulty: "easy",
    timeLimitSeconds: 20,
    explanation: "Queen to a6 is checkmate. King on a8 is trapped in the corner with no escapes.",
    explanationRu: "Ферзь на a6 — мат. Король a8 в углу, все выходы перекрыты.",
    rewardCoins: 5,
  },
  {
    id: "bp22",
    title: "Rook Pin Mate",
    titleRu: "Мат на связке",
    fen: "2k5/2p5/2K5/8/8/8/8/R7 w - - 0 1",
    sideToMove: "w",
    solution: "Ra8",
    difficulty: "hard",
    timeLimitSeconds: 10,
    explanation: "Rook to a8 is checkmate. King on c8 cannot take because of white king, and c7 pawn blocks escape.",
    explanationRu: "Ладья на a8 — мат. Король c8 не может взять из-за белого короля, пешка c7 блокирует выход.",
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
