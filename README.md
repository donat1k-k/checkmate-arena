# ♟ Checkmate Arena

**AI-powered chess arena with multiplayer rooms, AI coach, blitz puzzles, profile progression and monetization shell.**

Play, review, grow. Every game teaches.

---

## Features

| Layer | What's inside |
|-------|---------------|
| **Chess core** | Local hot-seat, vs AI (Beginner / Casual / Tactical), legal-move validation via chess.js |
| **Multiplayer** | Friend rooms by invite link, Supabase Realtime sync, resign, promotion overlay |
| **AI Coach** | Post-game deep analysis (4 insight cards + key moments timeline), interactive replay board |
| **Ask AI** | Contextual questions about any move directly from the replay board |
| **Training** | Training from Mistakes — answer, see coach reply, ask AI about your answer |
| **Blitz** | Mate Rush puzzles — 22 positions, Easy / Medium / Hard, timer, AC rewards |
| **Economy** | Arena Coins (in-app), Store with board skins / piece skins / coach cards / title items |
| **Profile** | ELO graph, LVL 1-10 bar, role/style badge, match history, cosmetics, reputation, Fair Play |
| **Pro shell** | Free / Pro / Ultra pricing page, 3-game Pro trial, honest "Billing coming soon" |
| **Social** | Global leaderboard, city filter, clan tags, commend/report after rooms |
| **i18n** | Russian + English, full coverage across all screens |
| **Auth** | Supabase email auth, guest mode (localStorage) without auth wall |
| **Deploy-ready** | Docker 3-stage build, Vercel-compatible, `/api/health` endpoint |

---

## Tech stack

| | |
|-|-|
| **Framework** | Next.js 16 (App Router), TypeScript |
| **Styles** | Tailwind CSS v4, custom amber token system, Plus Jakarta Sans / JetBrains Mono |
| **Chess** | chess.js (rules engine), react-chessboard v5 (board UI) |
| **Backend** | Supabase — Postgres, Auth (email), Realtime (multiplayer rooms) |
| **AI** | OpenAI-compatible API (any provider: OpenAI, Anthropic via OpenRouter, Ollama) |
| **Local state** | localStorage for guest mode, coins, cosmetics, blitz stats, active game draft |

---

## Screenshots

> Add screenshots to `docs/screenshots/` and update paths below.

| Home | Play | Multiplayer |
|------|------|-------------|
| ![Home](docs/screenshots/home.png) | ![Play](docs/screenshots/play.png) | ![Multiplayer](docs/screenshots/multiplayer.png) |

| Review | Profile | Pro |
|--------|---------|-----|
| ![Review](docs/screenshots/review.png) | ![Profile](docs/screenshots/profile.png) | ![Pro](docs/screenshots/pro.png) |

| Blitz | Settings |
|-------|----------|
| ![Blitz](docs/screenshots/blitz.png) | ![Settings](docs/screenshots/settings.png) |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `AI_COACH_API_BASE_URL` | OpenAI-compatible base URL (no `/chat/completions`) |
| `AI_COACH_API_KEY` | API key for AI provider |
| `AI_COACH_MODEL` | Model name (e.g. `gpt-4o-mini`, `anthropic/claude-haiku-4-5`) |

> App works without AI env — AI Coach shows "not configured" gracefully.
> App works without Supabase env — guest localStorage mode fully functional.

### 3. Supabase setup

Apply the database schema in your Supabase SQL Editor:

```sql
-- Step 1: apply base schema
-- Paste contents of supabase/schema.sql

-- Step 2: apply AI analysis column
-- Paste contents of supabase/migrations/0002_add_ai_analysis.sql

-- Step 3: apply multiplayer rooms
-- Paste contents of supabase/migrations/0004_multiplayer_rooms.sql

-- Step 4: enable Realtime for multiplayer
alter publication supabase_realtime add table public.multiplayer_rooms;
```

In Supabase dashboard:
- **Authentication → Providers** — enable Email provider
- **Authentication → URL Configuration** — add `http://localhost:3000/auth/callback` to redirect URLs

### 4. Run locally

```bash
npm run dev       # development server (webpack mode)
npm run build     # production build
npm run start     # production server
npm run lint      # lint check
```

---

## Project structure

```
app/
  page.tsx              # Home
  play/                 # Chess game (local / vs AI)
  review/[matchId]/     # Post-game AI Coach review
  blitz/                # Blitz Mate Rush puzzles
  multiplayer/          # Create / join friend rooms
  room/[code]/          # Live multiplayer room
  profile/              # Player profile + stats
  leaderboard/          # Global rankings
  pro/                  # Pricing + Arena Store
  settings/             # Language, theme, customization
  auth/                 # Sign in / sign up
  api/coach/            # AI Coach server route
  api/coach/move/       # Ask AI about move server route
  api/health/           # Health check endpoint

components/
  chess/                # Board, ReplayBoard, MoveList
  layout/               # SiteShell (nav)
  settings/             # PreferencesProvider (i18n + theme)

lib/
  chess/engine.ts       # ChessGame wrapper around chess.js
  ai/                   # Prompt builders for AI Coach
  demo/                 # localStorage layers (progress, economy, blitz, …)
  supabase/             # Supabase client + queries
  i18n/translations.ts  # RU/EN string dictionaries

supabase/
  schema.sql            # Full target schema (base)
  migrations/           # Incremental SQL migrations
```

---

## Known limitations

| Area | Status |
|------|--------|
| **Stripe / payments** | Not connected — billing pages show "Coming soon" |
| **Pro entitlements** | Visual shell only — no server-side enforcement |
| **Fair Play Guard** | Prototype layer — no production anti-cheat or bans |
| **Timers / draw offer** | Not yet implemented in multiplayer |
| **Multiplayer RLS** | Prototype-level — anon can update any room; needs hardening before production |
| **Server-side move validation** | Client-side chess.js only in rooms; no Edge Function yet |
| **Matchmaking** | No random opponent matching — friend rooms only |
| **Guest → account migration** | Progress stays separate; no automatic merge |
| **AI analysis persistence** | Requires applying migration `0002_add_ai_analysis.sql` |
| **Multiplayer match history** | Requires migration `0004_multiplayer_rooms.sql` |

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full Docker and Vercel instructions.

---

## Project status

**Stage 10 — Submission-ready.**

All core product loops are implemented and working:
- Guest and authenticated play with full match history and review
- AI Coach post-game analysis with interactive replay
- Friend rooms with Supabase Realtime sync
- Blitz Mate Rush puzzle mode
- Profile progression with ELO graph and economy
- Arena Store with cosmetics and Pro/Ultra shell
- RU/EN i18n, mobile-responsive layout, Docker + Vercel deploy path

See [docs/FEATURES.md](docs/FEATURES.md) for a full feature breakdown and roadmap.
