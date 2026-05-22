import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEMO_PLAYERS,
  type DemoLeaderboardCityKey,
  type DemoLeaderboardPlayer,
} from "@/lib/demo/leaderboard";
import { getRatingLevel, type GuestProfile } from "@/lib/demo/progress";

const DEFAULT_LIMIT = 20;
// Below this count of real account profiles, demo players pad the board so it
// never looks empty.
const FALLBACK_THRESHOLD = 5;

export type LeaderboardRow = {
  id: string;
  nickname: string;
  rating: number;
  level: number;
  winRate: number;
  streak: number;
  rank: number;
  isYou: boolean;
  cityKey: DemoLeaderboardCityKey | null;
  city: string | null;
  clanTag: string | null;
};

export type LeaderboardResult = {
  error: "requestFailed" | null;
  rows: LeaderboardRow[];
};

type ProfileRow = {
  id: string;
  nickname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  city: string | null;
};

type RankInput = Omit<LeaderboardRow, "level" | "rank">;

function winRate(wins: number, losses: number, draws: number): number {
  const games = wins + losses + draws;
  return games === 0 ? 0 : Math.round((wins / games) * 100);
}

function rank(entries: RankInput[]): LeaderboardRow[] {
  return [...entries]
    .sort((first, second) => second.rating - first.rating)
    .map((entry, index) => ({
      ...entry,
      level: getRatingLevel(entry.rating),
      rank: index + 1,
    }));
}

function demoEntry(player: DemoLeaderboardPlayer): RankInput {
  return {
    id: player.id,
    nickname: player.nickname,
    rating: player.rating,
    winRate: player.winRate,
    streak: player.streak,
    isYou: false,
    cityKey: player.cityKey,
    city: null,
    clanTag: player.clanTag,
  };
}

export async function loadAccountLeaderboard(
  supabase: SupabaseClient,
  currentUserId: string | null,
): Promise<LeaderboardResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, rating, wins, losses, draws, streak, city")
    .order("rating", { ascending: false })
    .limit(DEFAULT_LIMIT);

  if (error || !data) {
    return { error: "requestFailed", rows: [] };
  }

  const accountEntries: RankInput[] = (data as ProfileRow[]).map((row) => ({
    id: row.id,
    nickname: row.nickname,
    rating: row.rating,
    winRate: winRate(row.wins, row.losses, row.draws),
    streak: row.streak,
    isYou: currentUserId !== null && row.id === currentUserId,
    cityKey: null,
    city: row.city,
    clanTag: null,
  }));

  const entries =
    accountEntries.length >= FALLBACK_THRESHOLD
      ? accountEntries
      : [...accountEntries, ...DEMO_PLAYERS.map(demoEntry)];

  return { error: null, rows: rank(entries) };
}

export function buildDemoLeaderboard(
  profile: GuestProfile | null,
): LeaderboardRow[] {
  const guestEntry: RankInput[] = profile
    ? [
        {
          id: profile.id,
          nickname: profile.nickname,
          rating: profile.rating,
          winRate: winRate(profile.wins, profile.losses, profile.draws),
          streak: profile.streak,
          isYou: true,
          cityKey: "guest",
          city: null,
          clanTag: null,
        },
      ]
    : [];

  return rank([...DEMO_PLAYERS.map(demoEntry), ...guestEntry]);
}
