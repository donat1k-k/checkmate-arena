-- Checkmate Arena — Supabase schema (Stage 3.1)
-- MVP backend foundation: profiles, matches, match_reviews.
-- Run this in the Supabase SQL editor on a fresh project.
-- Idempotent-ish: safe to re-run, but DROP-free — do not run on data you keep.

-- =========================================================================
-- Extensions
-- =========================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- =========================================================================
-- profiles
-- One row per authenticated user. Mirrors auth.users(id).
-- No public.users table: auth.users is the identity source of truth.
-- =========================================================================
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  nickname         text        not null,
  avatar_url       text,
  city             text,
  rating           integer     not null default 1000,
  peak_rating      integer     not null default 1000,
  wins             integer     not null default 0,
  losses           integer     not null default 0,
  draws            integer     not null default 0,
  streak           integer     not null default 0,
  average_accuracy numeric(5,2),
  pro_status       boolean     not null default false,
  created_at       timestamptz not null default now(),

  constraint profiles_nickname_len   check (char_length(nickname) between 1 and 24),
  constraint profiles_rating_range   check (rating between 0 and 4000),
  constraint profiles_peak_range     check (peak_rating between 0 and 4000),
  constraint profiles_peak_gte       check (peak_rating >= rating),
  constraint profiles_wins_nonneg    check (wins   >= 0),
  constraint profiles_losses_nonneg  check (losses >= 0),
  constraint profiles_draws_nonneg   check (draws  >= 0),
  constraint profiles_streak_nonneg  check (streak >= 0),
  constraint profiles_accuracy_range check (average_accuracy is null
                                            or average_accuracy between 0 and 100)
);

-- =========================================================================
-- matches
-- One row per game. Players may be null for demo/guest-side matches.
-- review link: match_reviews.match_id (1:1). No review_id column here to
-- avoid a circular FK; look reviews up via match_reviews.match_id.
-- =========================================================================
create table if not exists public.matches (
  id                  uuid        primary key default gen_random_uuid(),
  white_player_id     uuid        references public.profiles(id) on delete set null,
  black_player_id     uuid        references public.profiles(id) on delete set null,
  white_nickname      text        not null,
  black_nickname      text        not null,
  status              text        not null default 'waiting',
  result              text,
  winner_id           uuid        references public.profiles(id) on delete set null,
  moves               jsonb       not null default '[]'::jsonb,  -- SAN move list
  pgn                 text,
  final_fen           text,
  time_control        text        not null default 'unlimited',
  rating_change_white integer,
  rating_change_black integer,
  is_public           boolean     not null default true,         -- share-safe review links
  created_at          timestamptz not null default now(),
  finished_at         timestamptz,

  constraint matches_status_valid check (status in (
    'waiting','active','white_won','black_won','draw','resigned',
    'abandoned','completed'
  )),
  constraint matches_result_valid check (result is null or result in (
    'white_won','black_won','draw'
  )),
  constraint matches_time_control_valid check (time_control in (
    'bullet','blitz','rapid','classical','unlimited'
  )),
  constraint matches_rating_change_white_range
    check (rating_change_white is null or rating_change_white between -100 and 100),
  constraint matches_rating_change_black_range
    check (rating_change_black is null or rating_change_black between -100 and 100),
  constraint matches_finished_after_created
    check (finished_at is null or finished_at >= created_at)
);

-- =========================================================================
-- match_reviews
-- One row per match (1:1). AI Coach post-game report.
-- =========================================================================
create table if not exists public.match_reviews (
  id              uuid        primary key default gen_random_uuid(),
  match_id        uuid        not null unique
                              references public.matches(id) on delete cascade,
  white_accuracy  numeric(5,2),
  black_accuracy  numeric(5,2),
  best_move       text,
  worst_move      text,
  blunder_move    text,
  key_moment      text,
  coach_summary   text,
  training_advice text,
  ai_analysis     jsonb,
  created_at      timestamptz not null default now(),

  constraint reviews_white_accuracy_range
    check (white_accuracy is null or white_accuracy between 0 and 100),
  constraint reviews_black_accuracy_range
    check (black_accuracy is null or black_accuracy between 0 and 100)
);

-- =========================================================================
-- Indexes
-- =========================================================================
-- Leaderboard: global ranking by rating.
create index if not exists idx_profiles_rating       on public.profiles (rating desc);
-- Leaderboard: city ranking.
create index if not exists idx_profiles_city_rating  on public.profiles (city, rating desc);

-- Match history: a profile's games as white / as black.
create index if not exists idx_matches_white_player  on public.matches (white_player_id);
create index if not exists idx_matches_black_player  on public.matches (black_player_id);
-- Recent matches first.
create index if not exists idx_matches_created_at    on public.matches (created_at desc);
-- Public match / review-link lookups.
create index if not exists idx_matches_public        on public.matches (is_public);

-- Review lookup by match: the `unique` constraint on match_reviews.match_id
-- already creates an index — no separate index needed.

-- =========================================================================
-- Row Level Security
-- See docs/SUPABASE_SETUP.md and docs/DECISIONS.md for the policy rationale.
-- =========================================================================
alter table public.profiles      enable row level security;
alter table public.matches       enable row level security;
alter table public.match_reviews enable row level security;

-- ---- profiles -----------------------------------------------------------
-- Public read: profiles hold no PII (email lives in auth.users, not here),
-- so the whole table is readable to power leaderboard + public profiles.
create policy profiles_select_public
  on public.profiles for select
  using (true);

-- A user creates only their own profile row (id must equal their auth uid).
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

-- A user updates only their own profile row.
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- matches ------------------------------------------------------------
-- Read: public matches are open (shareable review links work without auth);
-- private matches are visible only to participants.
create policy matches_select_public_or_participant
  on public.matches for select
  using (
    is_public
    or auth.uid() = white_player_id
    or auth.uid() = black_player_id
  );

-- Insert: only a participant of the match may create it.
create policy matches_insert_participant
  on public.matches for insert
  with check (
    auth.uid() = white_player_id
    or auth.uid() = black_player_id
  );

-- Update: only a participant may update the match.
create policy matches_update_participant
  on public.matches for update
  using (
    auth.uid() = white_player_id
    or auth.uid() = black_player_id
  )
  with check (
    auth.uid() = white_player_id
    or auth.uid() = black_player_id
  );

-- ---- match_reviews ------------------------------------------------------
-- Read: a review follows the visibility of its parent match.
create policy reviews_select_public_or_participant
  on public.match_reviews for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_reviews.match_id
        and (
          m.is_public
          or auth.uid() = m.white_player_id
          or auth.uid() = m.black_player_id
        )
    )
  );

-- Insert: only a participant of the parent match may attach a review.
create policy reviews_insert_participant
  on public.match_reviews for insert
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

-- Update: only a participant may update the review (e.g. save ai_analysis).
-- Added in Stage 4.3; also in supabase/migrations/0002_add_ai_analysis.sql.
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
