# Deployment Guide — Checkmate Arena

---

## 1. Local build

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

Health check after start:
```bash
curl http://localhost:3000/api/health
# → { "ok": true, "service": "checkmate-arena" }
```

---

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all values. Never commit `.env.local` — it is gitignored.

### Required for Supabase features

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # SERVER-ONLY
```

> Without these: app runs in guest/localStorage mode, no auth, no leaderboard persistence.

### Required for AI Coach

```
AI_COACH_API_BASE_URL=https://api.openai.com/v1
AI_COACH_API_KEY=sk-...
AI_COACH_MODEL=gpt-4o-mini
```

> Without these: AI Coach shows "not configured" gracefully. App is fully usable without AI.

Provider examples:
| Provider | Base URL | Model example |
|----------|----------|---------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-haiku-4-5` |
| Ollama (local) | `http://localhost:11434/v1` | `llama3.2` |

---

## 3. Supabase setup

### 3.1 Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Save the **Project URL** and **anon key** for env vars

### 3.2 Apply schema

Run each file in Supabase SQL Editor in order:

```sql
-- 1. Base schema (profiles, matches, match_reviews, RLS)
-- Paste contents of: supabase/schema.sql
```

```sql
-- 2. AI analysis column
-- Paste contents of: supabase/migrations/0002_add_ai_analysis.sql
```

```sql
-- 3. Multiplayer rooms table
-- Paste contents of: supabase/migrations/0004_multiplayer_rooms.sql
```

### 3.3 Enable Realtime

```sql
alter publication supabase_realtime add table public.multiplayer_rooms;
```

### 3.4 Auth configuration

In Supabase dashboard:
- **Authentication → Providers** → enable **Email** provider
- Optionally disable email confirmation for easier local testing
- **Authentication → URL Configuration** → add redirect URLs:
  - Local: `http://localhost:3000/auth/callback`
  - Production: `https://your-domain.com/auth/callback`

### 3.5 Verify RLS

Check that Row Level Security is enabled on all tables:
- `public.profiles`
- `public.matches`
- `public.match_reviews`
- `public.multiplayer_rooms`

---

## 4. Docker deployment

### 4.1 Build image

```bash
docker build -t checkmate-arena .
```

The Dockerfile uses a 3-stage build:
- **deps** — production-only `node_modules`
- **builder** — full build with `npm run build`
- **runner** — `node:20-alpine` with only what's needed at runtime

### 4.2 Run container

```bash
docker run \
  --env-file .env.local \
  -p 3000:3000 \
  checkmate-arena
```

### 4.3 Verify

```bash
curl http://localhost:3000/api/health
# → { "ok": true, "service": "checkmate-arena" }
```

### 4.4 Notes

- ENV variables are not baked into the image — always pass via `--env-file` or secrets manager
- `.env.local` is in `.dockerignore` — never enters the build context
- Port is fixed at 3000; map to any host port with `-p HOST_PORT:3000`

---

## 5. Vercel deployment

Checkmate Arena is a standard Next.js App Router project — fully Vercel-compatible.

### 5.1 Connect repo

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Select the repo — Vercel auto-detects Next.js

### 5.2 Set environment variables

In Vercel project → Settings → Environment Variables, add all variables from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_COACH_API_BASE_URL`
- `AI_COACH_API_KEY`
- `AI_COACH_MODEL`

### 5.3 Update Supabase redirect URL

Add your Vercel URL to Supabase Auth redirect URLs:
```
https://your-app.vercel.app/auth/callback
```

### 5.4 Deploy

Push to main branch — Vercel deploys automatically.

---

## 6. Production env checklist

Before going live, verify:

- [ ] `.env.local` (or CI/CD secrets) contains all 6 required vars
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `AI_COACH_API_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] Supabase schema + all migrations applied
- [ ] Realtime enabled for `multiplayer_rooms`
- [ ] Email auth provider enabled
- [ ] Production redirect URL added in Supabase Auth settings
- [ ] `GET /api/health` returns 200
- [ ] `npm run build` exits 0 on CI before deploy

---

## 7. Post-deploy smoke test

After deploy, run this manual checklist:

1. `GET /api/health` → `{ "ok": true, "service": "checkmate-arena" }`
2. Home page loads without errors
3. Guest mode: `/play` → set nickname → make moves → resign → review opens
4. Auth: sign up new account → profile row created in Supabase
5. Auth: sign in → sign out → sign in again
6. Leaderboard: authenticated user sees global board with "You" row
7. AI Coach (if AI env set): `/review` → Generate → 4 cards appear
8. Multiplayer: create room → copy link → open in second browser → join works
9. Settings: RU ↔ EN switch → F5 → preference persists
10. Mobile: open on phone, navigate to `/play` and `/profile`, check layout

---

## 8. Known production constraints

| Item | Notes |
|------|-------|
| **Multiplayer RLS** | Prototype-level — anon UPDATE allowed. Harden before public launch. |
| **Move validation** | Client-side only (chess.js). No Edge Function server validation. |
| **Stripe** | Not connected. `/pro` page shows "Billing coming soon". |
| **Anti-cheat** | Fair Play Guard is a visual prototype, no real enforcement. |
| **Timers** | Not implemented in multiplayer. Draw offer UI exists, logic not wired. |
