const ECONOMY_KEY = "checkmate-arena.economy.v1";
const DEFAULT_ARENA_COINS = 120;
const MATCH_REWARD = 10;

type ArenaEconomyState = {
  balance: number;
  rewardedMatchIds: string[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readState(): ArenaEconomyState {
  if (!canUseStorage()) {
    return { balance: DEFAULT_ARENA_COINS, rewardedMatchIds: [] };
  }

  try {
    const raw = window.localStorage.getItem(ECONOMY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ArenaEconomyState>) : null;
    const rewardedMatchIds = Array.isArray(parsed?.rewardedMatchIds)
      ? parsed.rewardedMatchIds.filter((value): value is string => typeof value === "string")
      : [];

    return {
      balance:
        typeof parsed?.balance === "number" && Number.isFinite(parsed.balance)
          ? Math.max(0, Math.round(parsed.balance))
          : DEFAULT_ARENA_COINS,
      rewardedMatchIds,
    };
  } catch {
    return { balance: DEFAULT_ARENA_COINS, rewardedMatchIds: [] };
  }
}

function saveState(state: ArenaEconomyState): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ECONOMY_KEY, JSON.stringify(state));
}

export function loadArenaCoinsBalance(): number {
  return readState().balance;
}

export function rewardArenaCoinsForMatch(matchId: string): {
  awarded: boolean;
  amount: number;
  balance: number;
} {
  const state = readState();

  if (state.rewardedMatchIds.includes(matchId)) {
    return { awarded: false, amount: 0, balance: state.balance };
  }

  const nextState = {
    balance: state.balance + MATCH_REWARD,
    rewardedMatchIds: [matchId, ...state.rewardedMatchIds].slice(0, 100),
  };

  saveState(nextState);

  return {
    awarded: true,
    amount: MATCH_REWARD,
    balance: nextState.balance,
  };
}
