# Features — Checkmate Arena

What's implemented, why it's above a basic chess project, and where it goes next.

---

## What's implemented

### Chess core

| Feature | Details |
|---------|---------|
| Local hot-seat | Two players, one device. Full chess rules via chess.js. |
| vs AI opponent | Beginner (random), Casual (prefers captures/checks), Tactical (material evaluation). No external engine — pure chess.js heuristics. |
| Promotion | Custom Q/R/B/N dialog, correct SAN notation. |
| Autosave | Active game survives page reload. Bound to player profile ID. |
| Replay board | Navigate any game move-by-move from review. Click move in list to jump. |

### AI layer

| Feature | Details |
|---------|---------|
| AI Coach post-game | 4 structured cards: main mistake, best alternative, why it matters, what to train next. OpenAI-compatible API, dual-language prompts (RU/EN). |
| Key moments timeline | AI identifies 3-6 turning points in the game, each with type (good/inaccuracy/mistake/critical/turning_point), comment, and link to position. |
| Training from Mistakes | Player answers "what would you do here?" → sees coach answer → can ask AI to evaluate their response. |
| Ask AI about this move | Pick any move in replay → ask contextual question → 3-card answer (answer, better plan, training tip). 4 pre-built quick questions. |
| Coach Advice in-game | Heuristic move suggestions during play (check/capture/center/develop priority). No LLM, no external engine. 100 AC or free in Pro Trial. |
| AI persistence | AI analysis saved to Supabase `match_reviews.ai_analysis` JSONB. Loads on review reload without re-querying. |

### Multiplayer

| Feature | Details |
|---------|---------|
| Friend rooms by link | Create room → share 6-char code → friend opens and auto-joins. |
| Supabase Realtime | Moves sync via postgres_changes subscription. Polling fallback for join detection. |
| Resign | Confirm dialog → result syncs to opponent. |
| Check indicator | Red banner for own king in check, amber for opponent. |
| Promotion overlay | Fullscreen overlay (not inline row), named pieces. |
| Post-game review | Room match saved to history (localStorage for guest, Supabase for account). Review link from game over screen. |
| Fair Play Guard | Visual notice explaining no live hints in PvP. Prototype-level. |
| Commend / Report | Per-room, localStorage idempotency — once per opponent, per room. |

### Profile & progression

| Feature | Details |
|---------|---------|
| ELO graph | SVG sparkline of recent match rating points. |
| LVL 1-10 | Level derived from wins + win rate. Progress bar in profile header. |
| Role/style badge | Light heuristic: "Aggressive", "Tactical", "Defensive" based on match history. |
| Match history | Local (localStorage) and account (Supabase). AI and vs-AI games included. |
| Edit profile | Display nickname (overlay), bio (160 chars), avatar preset, clan tag, equipped title/frame. |
| Reputation | Commendations received (visible count), reports tracked locally. |

### Economy & store

| Feature | Details |
|---------|---------|
| Arena Coins | In-app currency, no monetary value. Earned per completed game (+10 AC). |
| Arena Store | Board skins, piece skins, coach cards, status titles. Items owned per session (localStorage). |
| Equip system | Owned items can be equipped per category. Active cosmetics shown in profile and settings. |
| Clan tags | Preset tags (NVS / ALM / TACT / MATE / RUSH), displayed on leaderboard rows. |
| Pro Trial | 3 free Pro-feature games. Decrements once per completed matchId. |
| Free AI reviews | 3 free AI Coach generations. Only successful responses count. |

### Social

| Feature | Details |
|---------|---------|
| Global leaderboard | Pulls from Supabase `profiles` when env set, falls back to demo data for guests. |
| City filter | Filter leaderboard by city (Global / Novosibirsk / Almaty / Moscow / Astana). |
| Top-3 cards | Highlighted top players with location and stats. |
| Clan tags | Visual tag on each row. |
| Scouting teaser | Locked Pro feature card — "Scout opponent style". |

### Infrastructure & UX

| Feature | Details |
|---------|---------|
| RU/EN i18n | ~300 string keys across all screens. Full coverage, no hardcoded user-facing text. |
| Theme | Dark (amber-on-black) and Light (cognac-on-cream). Saved to localStorage. No flash on reload. |
| Mobile responsive | Tested at 375px. All pages stack correctly, no horizontal overflow. |
| Auth | Supabase email auth. Guest mode fully functional without auth wall. |
| Guest/account split | Guest: localStorage only. Account: Supabase persistence. Clean separation, no automatic migration. |
| Health endpoint | `GET /api/health` → `{ ok: true, service: "checkmate-arena" }` |
| Docker | 3-stage production build. No secrets in image. |

---

## Why it's above a basic chess project

Most hobby chess projects stop at: board + legal moves + maybe a bot.

Checkmate Arena adds:

1. **AI coaching layer** — not just "here's the engine eval". Structured insight cards, key moment detection, contextual Q&A per move. Requires OpenAI-compatible API integration with custom prompt engineering, JSON schema enforcement, RU/EN dual prompts.

2. **Real-time multiplayer** — Supabase Realtime postgres_changes, room lifecycle (create/join/play/resign/review), promotion overlay, check indicators, post-game history save.

3. **Business model shell** — pricing page with honest "billing coming soon", subscription tier comparison table (17 rows), Arena Store with purchase/equip flow, Pro Trial counter, free AI review budget. Ready for Stripe integration.

4. **Progression system** — ELO graph, LVL 1-10, role badge, match history across local/AI/multiplayer games, blitz stats, profile customization.

5. **Blitz puzzle mode** — 22 positions, 4 difficulty tiers, timer, hint system, AC rewards, stats tracking.

6. **Production plumbing** — Supabase RLS, Docker 3-stage build, Vercel-compatible, env-safe (build passes without secrets), health endpoint, no flash theme/language load.

---

## Business / monetization layer

Current state (visual shell, no payments):

| Tier | What it unlocks (planned) |
|------|--------------------------|
| **Free** | Local chess, vs AI, 3 free AI reviews, 3 Pro Trial games, Mate Rush Easy/Medium, basic profile |
| **Pro** | Unlimited AI reviews, all Blitz tiers, premium store items, detailed stats, friend rooms rating, in-game hints |
| **Ultra** | Priority AI, clan tools, tournament rooms, report export, all Pro features |

Infrastructure ready for Stripe:
- Pricing page built with tier comparison
- Pro Trial counter implemented (localStorage → move to server)
- Feature gates in place (locked UI states, disabled CTA)
- AI review counter ready to be server-side

---

## AI layer architecture

```
/review → POST /api/coach (server route)
             ↓
         lib/ai/coachPrompt.ts (builds structured prompt)
             ↓
         OpenAI-compatible API (any provider)
             ↓
         JSON { mainMistake, bestAlternative, whyImportant, trainNext, keyMoments[] }
             ↓
         Saved to match_reviews.ai_analysis (JSONB)
             ↓
         UI: 4 cards + key moments timeline + training blocks

/review → POST /api/coach/move (server route)
             ↓
         lib/ai/moveQuestionPrompt.ts (ply + FEN + question)
             ↓
         JSON { answer, betterPlan, trainingTip }
             ↓
         UI: 3-card answer (session only, not persisted)
```

Key design decisions:
- API key never reaches browser (server-only routes)
- Build passes without AI env (graceful degradation)
- Provider-agnostic (works with OpenAI, Anthropic via OpenRouter, local Ollama)
- RU/EN prompt selection matches user locale

---

## Future roadmap

### Near-term (next sprint)

- [ ] Stripe billing integration — connect checkout for Pro/Ultra
- [ ] Server-side entitlement checks — move Pro gates from client to API
- [ ] Multiplayer RLS hardening — auth.uid() per-player UPDATE validation
- [ ] Server-side move validation in rooms (Edge Function)
- [ ] Draw offer logic in multiplayer

### Mid-term

- [ ] Matchmaking — random opponent queue
- [ ] Spectator chat
- [ ] Timers / time controls in multiplayer (bullet / blitz / rapid)
- [ ] Real clan system with server-side storage
- [ ] Tournament rooms

### Long-term

- [ ] Guest → account progress migration
- [ ] AI analysis with real engine evaluation (Stockfish via stockfish.js or WASM)
- [ ] Streaks, achievements, seasonal events
- [ ] Mobile app (React Native or PWA)
- [ ] Coach personalization (remember player weaknesses across games)
