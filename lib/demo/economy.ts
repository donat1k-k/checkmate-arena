const ECONOMY_KEY = "checkmate-arena.economy.v1";
const DEFAULT_ARENA_COINS = 120;
const MATCH_REWARD = 10;

type ArenaEconomyState = {
  balance: number;
  rewardedMatchIds: string[];
  ownedItemIds: string[];
};

export type StoreAccess = "coins" | "pro" | "ultra";
export type StoreCategory =
  | "board"
  | "pieces"
  | "frame"
  | "coach"
  | "title";

export type ArenaStoreItem = {
  id: string;
  category: StoreCategory;
  access: StoreAccess;
  cost?: number;
};

export const ARENA_STORE_ITEMS: ArenaStoreItem[] = [
  { id: "board-ember-grid", category: "board", access: "coins", cost: 70 },
  { id: "pieces-ivory-sprint", category: "pieces", access: "coins", cost: 95 },
  { id: "coach-tactical-brief", category: "coach", access: "coins", cost: 60 },
  { id: "title-city-chaser", category: "title", access: "coins", cost: 45 },
  { id: "frame-pro-forge", category: "frame", access: "pro" },
  { id: "pieces-pro-crown", category: "pieces", access: "pro" },
  { id: "coach-ultra-scout", category: "coach", access: "ultra" },
  { id: "frame-ultra-halo", category: "frame", access: "ultra" },
];

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readState(): ArenaEconomyState {
  if (!canUseStorage()) {
    return {
      balance: DEFAULT_ARENA_COINS,
      rewardedMatchIds: [],
      ownedItemIds: [],
    };
  }

  try {
    const raw = window.localStorage.getItem(ECONOMY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ArenaEconomyState>) : null;
    const rewardedMatchIds = Array.isArray(parsed?.rewardedMatchIds)
      ? parsed.rewardedMatchIds.filter((value): value is string => typeof value === "string")
      : [];
    const ownedItemIds = Array.isArray(parsed?.ownedItemIds)
      ? parsed.ownedItemIds.filter(
          (value): value is string =>
            typeof value === "string" &&
            ARENA_STORE_ITEMS.some((item) => item.id === value),
        )
      : [];

    return {
      balance:
        typeof parsed?.balance === "number" && Number.isFinite(parsed.balance)
          ? Math.max(0, Math.round(parsed.balance))
          : DEFAULT_ARENA_COINS,
      rewardedMatchIds,
      ownedItemIds,
    };
  } catch {
    return {
      balance: DEFAULT_ARENA_COINS,
      rewardedMatchIds: [],
      ownedItemIds: [],
    };
  }
}

function saveState(state: ArenaEconomyState): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ECONOMY_KEY, JSON.stringify(state));
}

export function loadArenaCoinsBalance(): number {
  return readState().balance;
}

export function loadOwnedStoreItems(): string[] {
  return readState().ownedItemIds;
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
    ownedItemIds: state.ownedItemIds,
  };

  saveState(nextState);

  return {
    awarded: true,
    amount: MATCH_REWARD,
    balance: nextState.balance,
  };
}

export function purchaseArenaStoreItem(itemId: string): {
  status: "owned" | "purchased" | "insufficient" | "locked" | "missing";
  balance: number;
  ownedItemIds: string[];
} {
  const item = ARENA_STORE_ITEMS.find((candidate) => candidate.id === itemId);
  const state = readState();

  if (!item) {
    return { status: "missing", balance: state.balance, ownedItemIds: state.ownedItemIds };
  }

  if (state.ownedItemIds.includes(itemId)) {
    return { status: "owned", balance: state.balance, ownedItemIds: state.ownedItemIds };
  }

  if (item.access !== "coins" || item.cost === undefined) {
    return { status: "locked", balance: state.balance, ownedItemIds: state.ownedItemIds };
  }

  if (state.balance < item.cost) {
    return {
      status: "insufficient",
      balance: state.balance,
      ownedItemIds: state.ownedItemIds,
    };
  }

  const nextState = {
    ...state,
    balance: state.balance - item.cost,
    ownedItemIds: [item.id, ...state.ownedItemIds],
  };
  saveState(nextState);
  return {
    status: "purchased",
    balance: nextState.balance,
    ownedItemIds: nextState.ownedItemIds,
  };
}

export function addArenaCoins(amount: number): number {
  const state = readState();
  const nextState = { ...state, balance: state.balance + Math.max(0, Math.round(amount)) };
  saveState(nextState);
  return nextState.balance;
}

export function resetArenaEconomy(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ECONOMY_KEY);
  window.localStorage.removeItem("checkmate-arena.equipped-cosmetics.v1");
}
