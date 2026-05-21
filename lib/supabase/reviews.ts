import type { SupabaseClient } from "@supabase/supabase-js";
import type { DemoCoachReview } from "@/lib/demo/coach";

export type AccountReview = {
  id: string;
  matchId: string;
  headline: string | null;
  summary: string | null;
  trainingAdvice: string | null;
  createdAt: string;
};

type ReviewRow = {
  id: string;
  match_id: string;
  key_moment: string | null;
  coach_summary: string | null;
  training_advice: string | null;
  created_at: string;
};

type AccountReviewResult = {
  error: "requestFailed" | null;
  review: AccountReview | null;
};

function toAccountReview(review: ReviewRow): AccountReview {
  return {
    id: review.id,
    matchId: review.match_id,
    headline: review.key_moment,
    summary: review.coach_summary,
    trainingAdvice: review.training_advice,
    createdAt: review.created_at,
  };
}

export async function saveAccountReview(
  supabase: SupabaseClient,
  matchId: string,
  review: DemoCoachReview,
): Promise<AccountReviewResult> {
  const { data, error } = await supabase
    .from("match_reviews")
    .insert({
      match_id: matchId,
      key_moment: review.headline,
      coach_summary: review.summary,
      training_advice: review.trainingAdvice,
    })
    .select("id, match_id, key_moment, coach_summary, training_advice, created_at")
    .single();

  return error || !data
    ? { error: "requestFailed", review: null }
    : { error: null, review: toAccountReview(data as ReviewRow) };
}

export async function loadAccountReview(
  supabase: SupabaseClient,
  matchId: string,
): Promise<AccountReviewResult> {
  const { data, error } = await supabase
    .from("match_reviews")
    .select("id, match_id, key_moment, coach_summary, training_advice, created_at")
    .eq("match_id", matchId)
    .maybeSingle();

  return error || !data
    ? { error: error ? "requestFailed" : null, review: null }
    : { error: null, review: toAccountReview(data as ReviewRow) };
}
