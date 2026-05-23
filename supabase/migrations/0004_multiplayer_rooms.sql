-- Stage 9.0A: Multiplayer Rooms (Prototype)
-- Apply manually in Supabase SQL editor.
--
-- IMPORTANT: RLS policies here are prototype-level — anon read/write allowed.
-- See docs/DECISIONS.md → Stage 9.0A for rationale.
-- NOT production-ready: no per-player auth checks, no anti-cheat.

-- =========================================================================
-- multiplayer_rooms
-- One row per friend-room session. Players identified by guest_id (localStorage).
-- Authenticated player IDs are nullable — prototype supports both guest and account.
-- =========================================================================
create table if not exists public.multiplayer_rooms (
  id               uuid        primary key default gen_random_uuid(),
  room_code        text        unique not null,
  status           text        not null default 'waiting',
  fen              text        not null,
  pgn              text        not null default '',
  san_moves        text[]      not null default '{}',
  white_player_id  uuid        null,
  black_player_id  uuid        null,
  white_name       text        null,
  black_name       text        null,
  white_guest_id   text        null,
  black_guest_id   text        null,
  turn             text        not null default 'w',
  result           text        null,
  finish           text        null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  last_move_at     timestamptz null,
  expires_at       timestamptz null,

  constraint rooms_status_valid check (status in (
    'waiting','active','white_won','black_won','draw','abandoned'
  )),
  constraint rooms_result_valid check (result is null or result in (
    'white_won','black_won','draw'
  )),
  constraint rooms_turn_valid check (turn in ('w','b'))
);

-- Room lookup by code
create index if not exists idx_multiplayer_rooms_code
  on public.multiplayer_rooms (room_code);

-- Expiry cleanup index
create index if not exists idx_multiplayer_rooms_expires
  on public.multiplayer_rooms (expires_at)
  where expires_at is not null;

-- =========================================================================
-- Row Level Security
-- PROTOTYPE-LEVEL: permissive anon policies for friend-room prototype.
-- Real production would require auth.uid() checks and anti-cheat on each move.
-- =========================================================================
alter table public.multiplayer_rooms enable row level security;

create policy rooms_select_all
  on public.multiplayer_rooms for select
  using (true);

create policy rooms_insert_all
  on public.multiplayer_rooms for insert
  with check (true);

create policy rooms_update_all
  on public.multiplayer_rooms for update
  using (true)
  with check (true);

-- Enable Realtime for this table (needed for postgres_changes subscriptions)
-- Run this separately if not already enabled for the project:
-- alter publication supabase_realtime add table public.multiplayer_rooms;
