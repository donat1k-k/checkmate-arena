import type { SupabaseClient, User } from "@supabase/supabase-js";
import { sanitizeNickname } from "@/lib/demo/progress";
import type { MatchResult } from "@/lib/demo/progress";

type ProfileSummary = {
  id: string;
  nickname: string;
};

export type AccountProfile = {
  id: string;
  nickname: string;
  rating: number;
  peakRating: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  createdAt: string;
};

export type EnsureProfileResult = {
  error: "authRequired" | "requestFailed" | null;
  profile: ProfileSummary | null;
};

export type AccountProfileResult = {
  error: "authRequired" | "requestFailed" | null;
  profile: AccountProfile | null;
};

type ProfileRow = {
  id: string;
  nickname: string;
  rating: number;
  peak_rating: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  created_at: string;
};

function profileNickname(user: User, nickname?: string): string {
  const metadataNickname =
    typeof user.user_metadata?.nickname === "string"
      ? user.user_metadata.nickname
      : "";
  const emailNickname = user.email?.split("@")[0] ?? "";

  return (
    sanitizeNickname(nickname ?? "") ||
    sanitizeNickname(metadataNickname) ||
    sanitizeNickname(emailNickname) ||
    "ArenaPlayer"
  );
}

function toAccountProfile(profile: ProfileRow): AccountProfile {
  return {
    id: profile.id,
    nickname: profile.nickname,
    rating: profile.rating,
    peakRating: profile.peak_rating,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    streak: profile.streak,
    createdAt: profile.created_at,
  };
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User | null,
  nickname?: string,
): Promise<EnsureProfileResult> {
  if (!user) {
    return { error: "authRequired", profile: null };
  }

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, nickname")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    return { error: "requestFailed", profile: null };
  }

  if (existingProfile) {
    return {
      error: null,
      profile: existingProfile as ProfileSummary,
    };
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      nickname: profileNickname(user, nickname),
    })
    .select("id, nickname")
    .single();

  if (!insertError && createdProfile) {
    return {
      error: null,
      profile: createdProfile as ProfileSummary,
    };
  }

  const { data: racedProfile } = await supabase
    .from("profiles")
    .select("id, nickname")
    .eq("id", user.id)
    .maybeSingle();

  return racedProfile
    ? { error: null, profile: racedProfile as ProfileSummary }
    : { error: "requestFailed", profile: null };
}

export async function loadAccountProfile(
  supabase: SupabaseClient,
  user: User | null,
): Promise<AccountProfileResult> {
  if (!user) {
    return { error: "authRequired", profile: null };
  }

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select(
      "id, nickname, rating, peak_rating, wins, losses, draws, streak, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    return { error: "requestFailed", profile: null };
  }

  if (existingProfile) {
    return {
      error: null,
      profile: toAccountProfile(existingProfile as ProfileRow),
    };
  }

  const ensuredProfile = await ensureProfile(supabase, user);
  if (ensuredProfile.error) {
    return { error: ensuredProfile.error, profile: null };
  }

  const { data: createdProfile, error: retryError } = await supabase
    .from("profiles")
    .select(
      "id, nickname, rating, peak_rating, wins, losses, draws, streak, created_at",
    )
    .eq("id", user.id)
    .single();

  return retryError || !createdProfile
    ? { error: "requestFailed", profile: null }
    : {
        error: null,
        profile: toAccountProfile(createdProfile as ProfileRow),
      };
}

export function getAccountGamesPlayed(profile: AccountProfile): number {
  return profile.wins + profile.losses + profile.draws;
}

export function getAccountWinRate(profile: AccountProfile): number {
  const games = getAccountGamesPlayed(profile);
  return games === 0 ? 0 : Math.round((profile.wins / games) * 100);
}

export function nextAccountProfile(
  profile: AccountProfile,
  result: MatchResult,
  ratingAfter: number,
): AccountProfile {
  return {
    ...profile,
    rating: ratingAfter,
    peakRating: Math.max(profile.peakRating, ratingAfter),
    wins: profile.wins + (result === "win" ? 1 : 0),
    losses: profile.losses + (result === "loss" ? 1 : 0),
    draws: profile.draws + (result === "draw" ? 1 : 0),
    streak: result === "win" ? profile.streak + 1 : 0,
  };
}

export async function updateProfileNickname(
  supabase: SupabaseClient,
  profileId: string,
  nickname: string,
): Promise<"requestFailed" | null> {
  const sanitized = sanitizeNickname(nickname);
  if (!sanitized) return "requestFailed";
  const { error } = await supabase
    .from("profiles")
    .update({ nickname: sanitized })
    .eq("id", profileId);
  return error ? "requestFailed" : null;
}

export async function saveAccountProfileProgress(
  supabase: SupabaseClient,
  profile: AccountProfile,
): Promise<"requestFailed" | null> {
  const { error } = await supabase
    .from("profiles")
    .update({
      rating: profile.rating,
      peak_rating: profile.peakRating,
      wins: profile.wins,
      losses: profile.losses,
      draws: profile.draws,
      streak: profile.streak,
    })
    .eq("id", profile.id);

  return error ? "requestFailed" : null;
}
