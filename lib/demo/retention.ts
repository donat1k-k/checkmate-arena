const RETENTION_KEY = "checkmate-arena.retention.v1";
const DEFAULT_TRIAL_GAMES = 3;
const DEFAULT_FREE_AI_REVIEWS = 3;

type RetentionState = {
  trialGamesLeft: number;
  trialMatchIds: string[];
  freeAiReviewsLeft: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function clampCounter(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : fallback;
}

function readState(): RetentionState {
  if (!canUseStorage()) {
    return {
      trialGamesLeft: DEFAULT_TRIAL_GAMES,
      trialMatchIds: [],
      freeAiReviewsLeft: DEFAULT_FREE_AI_REVIEWS,
    };
  }

  try {
    const raw = window.localStorage.getItem(RETENTION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<RetentionState>) : null;
    return {
      trialGamesLeft: clampCounter(parsed?.trialGamesLeft, DEFAULT_TRIAL_GAMES),
      trialMatchIds: Array.isArray(parsed?.trialMatchIds)
        ? parsed.trialMatchIds.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      freeAiReviewsLeft: clampCounter(
        parsed?.freeAiReviewsLeft,
        DEFAULT_FREE_AI_REVIEWS,
      ),
    };
  } catch {
    return {
      trialGamesLeft: DEFAULT_TRIAL_GAMES,
      trialMatchIds: [],
      freeAiReviewsLeft: DEFAULT_FREE_AI_REVIEWS,
    };
  }
}

function saveState(state: RetentionState): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(RETENTION_KEY, JSON.stringify(state));
}

export function loadProTrialGamesLeft(): number {
  return readState().trialGamesLeft;
}

export function useProTrialForMatch(matchId: string): {
  consumed: boolean;
  gamesLeft: number;
} {
  const state = readState();
  if (state.trialMatchIds.includes(matchId)) {
    return { consumed: false, gamesLeft: state.trialGamesLeft };
  }

  const gamesLeft = Math.max(0, state.trialGamesLeft - 1);
  saveState({
    ...state,
    trialGamesLeft: gamesLeft,
    trialMatchIds: [matchId, ...state.trialMatchIds].slice(0, 100),
  });
  return { consumed: state.trialGamesLeft > gamesLeft, gamesLeft };
}

export function loadFreeAiReviewsLeft(): number {
  return readState().freeAiReviewsLeft;
}

export function consumeFreeAiReview(): {
  consumed: boolean;
  reviewsLeft: number;
} {
  const state = readState();
  if (state.freeAiReviewsLeft === 0) {
    return { consumed: false, reviewsLeft: 0 };
  }

  const reviewsLeft = state.freeAiReviewsLeft - 1;
  saveState({ ...state, freeAiReviewsLeft: reviewsLeft });
  return { consumed: true, reviewsLeft };
}

export function resetRetentionState(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(RETENTION_KEY);
}
