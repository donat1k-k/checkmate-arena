const REPUTATION_KEY = "checkmate-arena.reputation.v1";

type ReputationState = {
  commendations: number;
  reports: number;
  commendedRooms: string[];
  reportedRooms: string[];
};

const DEFAULT_STATE: ReputationState = {
  commendations: 0,
  reports: 0,
  commendedRooms: [],
  reportedRooms: [],
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readState(): ReputationState {
  if (!canUseStorage()) return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(REPUTATION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ReputationState>) : null;
    return {
      commendations:
        typeof parsed?.commendations === "number" ? Math.max(0, Math.round(parsed.commendations)) : 0,
      reports:
        typeof parsed?.reports === "number" ? Math.max(0, Math.round(parsed.reports)) : 0,
      commendedRooms: Array.isArray(parsed?.commendedRooms)
        ? parsed.commendedRooms.filter((v): v is string => typeof v === "string")
        : [],
      reportedRooms: Array.isArray(parsed?.reportedRooms)
        ? parsed.reportedRooms.filter((v): v is string => typeof v === "string")
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state: ReputationState): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(REPUTATION_KEY, JSON.stringify(state));
}

export type ReputationSummary = {
  commendations: number;
  reports: number;
};

export function loadReputation(): ReputationSummary {
  const s = readState();
  return { commendations: s.commendations, reports: s.reports };
}

export function commendPlayer(roomCode: string): { done: boolean; commendations: number } {
  const state = readState();
  if (state.commendedRooms.includes(roomCode)) {
    return { done: false, commendations: state.commendations };
  }
  const next: ReputationState = {
    ...state,
    commendations: state.commendations + 1,
    commendedRooms: [roomCode, ...state.commendedRooms].slice(0, 100),
  };
  saveState(next);
  return { done: true, commendations: next.commendations };
}

export function reportPlayer(roomCode: string): { done: boolean; reports: number } {
  const state = readState();
  if (state.reportedRooms.includes(roomCode)) {
    return { done: false, reports: state.reports };
  }
  const next: ReputationState = {
    ...state,
    reports: state.reports + 1,
    reportedRooms: [roomCode, ...state.reportedRooms].slice(0, 100),
  };
  saveState(next);
  return { done: true, reports: next.reports };
}

export function hasCommendedRoom(roomCode: string): boolean {
  return readState().commendedRooms.includes(roomCode);
}

export function hasReportedRoom(roomCode: string): boolean {
  return readState().reportedRooms.includes(roomCode);
}

export function resetReputation(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(REPUTATION_KEY);
}
