import type { SupabaseClient, User } from "@supabase/supabase-js";
import { sanitizeNickname } from "@/lib/demo/progress";

type ProfileSummary = {
  id: string;
  nickname: string;
};

export type EnsureProfileResult = {
  error: "authRequired" | "requestFailed" | null;
  profile: ProfileSummary | null;
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
