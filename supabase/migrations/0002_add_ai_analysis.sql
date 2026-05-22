-- Stage 4.3: AI Coach persistence
-- Run ONCE in Supabase SQL editor before using AI analysis persistence.
-- The ALTER TABLE is idempotent (IF NOT EXISTS).
-- The CREATE POLICY will error if run twice — run only on a fresh DB or after checking pg_policies.

-- 1. Add nullable ai_analysis column to match_reviews.
--    No backfill needed: existing rows get NULL, which is treated as "not generated yet".
alter table public.match_reviews
  add column if not exists ai_analysis jsonb;

-- 2. Add UPDATE RLS policy for match_reviews.
--    Required so account users can update ai_analysis on their own match reviews.
--    Without this policy Supabase RLS blocks all UPDATE operations on match_reviews.
create policy reviews_update_participant
  on public.match_reviews for update
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_reviews.match_id
        and (
          auth.uid() = m.white_player_id
          or auth.uid() = m.black_player_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_reviews.match_id
        and (
          auth.uid() = m.white_player_id
          or auth.uid() = m.black_player_id
        )
    )
  );
