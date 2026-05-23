# Final QA Checklist — Checkmate Arena

Stage 10 pre-submission checklist. Check each item manually before deploy.

---

## Auth

- [ ] `/auth/sign-up` — register new email, row created in `profiles`
- [ ] `/auth/sign-in` — sign in existing account, nav shows email
- [ ] Sign out → nav clears session, redirect to home
- [ ] Wrong password → localized error message (no raw Supabase text)
- [ ] Without `.env.local` → auth pages show "Supabase not configured" state, not crash
- [ ] Guest mode accessible at `/play` without any auth

---

## Home

- [ ] Hero renders with board preview and CTA buttons
- [ ] Arena Coins balance visible (guest and authenticated)
- [ ] Recent match shown if history exists
- [ ] Blitz card in quick actions links to `/blitz`
- [ ] RU/EN strings correct on home
- [ ] Mobile 375px — no horizontal overflow

---

## Play — local hot-seat

- [ ] Set nickname → profile persists after reload
- [ ] Click-to-move works (select piece → legal dots → click target)
- [ ] Drag-to-move works
- [ ] Illegal move blocked (no move applied, piece deselected)
- [ ] Checkmate detected — correct winner shown, king highlighted red
- [ ] Resign → result screen appears
- [ ] New Game resets board
- [ ] Autosave: 3 moves → F5 → game restored, blue banner visible
- [ ] New Game after restore → draft cleared → F5 → clean board
- [ ] Rating changes after completed match
- [ ] +10 Arena Coins after completed match (once per matchId)
- [ ] Review link appears in result block

---

## Play — vs AI

- [ ] Mode selector: Local / vs AI / Multiplayer (link)
- [ ] AI difficulty selector: Beginner / Casual / Tactical / Coach Pro (locked)
- [ ] Color selector: White / Black / Random
- [ ] AI responds after player move (with delay)
- [ ] Playing as Black — AI makes first move
- [ ] Autosave/restore works for AI game
- [ ] Promotion against AI — overlay appears
- [ ] Checkmate by AI detected correctly
- [ ] Coach Advice button visible (not game over, local or AI mode)
- [ ] Coach Advice costs 100 AC (or free in Pro Trial)

---

## Review — AI Coach

- [ ] Review opens from result block and from profile history
- [ ] Guest review loads from localStorage
- [ ] Account review loads from Supabase after page reload
- [ ] Replay board: ⏮ ◀ ▶ ⏭ navigate moves correctly
- [ ] Click on move in list → board jumps to that position
- [ ] "Generate AI Coach" button present
- [ ] Without AI env → "not configured" message, no crash
- [ ] With AI env → 4 cards (main mistake, best alternative, why important, train next)
- [ ] Key moments timeline appears (if AI returned keyMoments)
- [ ] "Go to move" in key moment → board jumps to that ply
- [ ] Training from Mistakes section appears for mistake/critical moments
- [ ] Ask AI about this move — select move → quick questions appear
- [ ] Ask AI — submit question → 3 cards (answer, better plan, training tip)
- [ ] Saved badge appears for account review after AI generation
- [ ] Regenerate button available if analysis already exists
- [ ] RU/EN all strings in review follow locale

---

## Blitz — Mate Rush

- [ ] Page loads, difficulty tabs visible: Easy / Medium / Hard / Pro Rush (locked)
- [ ] Start Puzzle → board shows position, timer starts
- [ ] Click-to-move: select piece → legal dots → click target
- [ ] Drag-to-move works
- [ ] Correct move → success feedback, AC reward, Next Puzzle button
- [ ] Wrong move → red highlight from/to, error feedback, Try Again button
- [ ] Timer expires → "Time's up" feedback, solution shown
- [ ] Hint used → hint text shown, hintUsed flag set; second hint → limit reached
- [ ] Pro Rush → locked state, Pro teaser visible
- [ ] Stats: solved / streak / best streak / accuracy update correctly
- [ ] Profile blitz stats block visible after solved puzzles

---

## Multiplayer

- [ ] `/multiplayer` page loads with Create and Join sections
- [ ] Without migration → yellow warning banner, no crash
- [ ] Create room → redirect to `/room/XXXXXX`
- [ ] Copy invite link button works
- [ ] Second browser opens link → auto-joins as Black
- [ ] White makes move → Black receives via Realtime (no reload needed)
- [ ] Check banner visible to the player in check
- [ ] Promotion overlay (fullscreen, Q/R/B/N with names)
- [ ] Resign → confirm dialog → result shown, syncs to opponent
- [ ] Game over → "Open review" button → review opens
- [ ] Match appears in `/profile` history after game over
- [ ] Reload after game over → match not duplicated in history
- [ ] Fair Play Guard notice visible on `/multiplayer` and in room sidebar
- [ ] Commend / Report buttons after game over in room
- [ ] Mobile 375px — no overflow

---

## Profile

- [ ] Guest profile: rating, level, win/loss/draw, match history
- [ ] Account profile: Supabase data, correct after matches
- [ ] ELO graph renders for history with 2+ entries
- [ ] LVL progress bar visible
- [ ] Role/style badge visible
- [ ] Edit button (✏) opens edit panel
- [ ] Edit nickname, bio, avatar → save → toast "Saved"
- [ ] Clan tag selection visible in edit
- [ ] Blitz stats block visible if blitz attempts > 0
- [ ] AI Reviews counter shows remaining free reviews
- [ ] Fair Play card visible with "Good standing"
- [ ] Reputation card with commendation count
- [ ] Premium analytics locked blocks visible (6 locked cards)
- [ ] Equipped cosmetics summary visible if something equipped
- [ ] Mobile 375px — no overflow

---

## Store / Pro

- [ ] `/pro` — Free / Pro / Ultra pricing cards render
- [ ] Comparison table: 17 rows, EN/RU
- [ ] Pro Trial block: 3 games countdown decrements correctly (once per matchId)
- [ ] Arena Store: items visible (board skins, piece skins, coach cards, titles)
- [ ] Buy item with sufficient AC → "Owned" badge appears
- [ ] Equip owned item → "Equipped" state + notice
- [ ] Pro/Ultra locked items → disabled, teaser visible
- [ ] Insufficient AC → can't buy
- [ ] "Billing coming soon" — no active checkout

---

## Settings

- [ ] Language switch RU/EN → persists after F5
- [ ] Theme switch Dark/Light → persists after F5
- [ ] No flash of wrong theme on reload (dark/light saved correctly)
- [ ] No flash of wrong language on reload
- [ ] City selection saves
- [ ] Avatar picker — select preset → saves
- [ ] Clan tag presets (None / NVS / ALM / TACT / MATE / RUSH)
- [ ] Active cosmetics section shows owned + equipped items
- [ ] Reset local product data → confirm dialog → resets coins, purchases, blitz stats, cosmetics
- [ ] Reset does NOT clear match history or auth session

---

## Leaderboard

- [ ] With Supabase env → global board from DB
- [ ] Authenticated → own row highlighted "You"
- [ ] Signed out + Supabase env → global board, no "You" highlight
- [ ] Without Supabase env → demo local board
- [ ] City filter tabs work (Global / Novosibirsk / Almaty / Moscow / Astana)
- [ ] Top-3 cards render
- [ ] Clan tags visible on rows if set
- [ ] Scouting teaser card visible
- [ ] Mobile 375px — no overflow

---

## i18n

- [ ] All pages: switch RU → reload → still RU
- [ ] All pages: switch EN → reload → still EN
- [ ] No hardcoded EN strings visible in RU mode
- [ ] Chess notation (SAN) unchanged by locale switch
- [ ] Auth error messages use i18n keys, not raw Supabase text

---

## Mobile 375px

- [ ] `/` — no horizontal overflow
- [ ] `/play` — board on top, controls below, no overflow
- [ ] `/review/[matchId]` — replay first, ask AI, then AI Coach, no overflow
- [ ] `/blitz` — no overflow
- [ ] `/multiplayer` — no overflow
- [ ] `/room/[code]` — no overflow
- [ ] `/profile` — no overflow
- [ ] `/leaderboard` — no overflow
- [ ] `/pro` — no overflow
- [ ] `/settings` — no overflow
- [ ] `/auth/sign-in` — no overflow
- [ ] Nav compact menu opens and closes without breaking layout

---

## Build

- [ ] `npm run build` exits 0 (no TypeScript errors, no missing imports)
- [ ] `npm run lint` exits 0 (or acceptable warnings only)
- [ ] `git diff --check` — no whitespace errors
- [ ] No `.env.local` in `git status`
- [ ] No `node_modules` or `.next` in `git status`

---

## Supabase

- [ ] `supabase/schema.sql` applied cleanly to fresh project
- [ ] Migration `0002_add_ai_analysis.sql` applied
- [ ] Migration `0004_multiplayer_rooms.sql` applied
- [ ] Realtime enabled: `alter publication supabase_realtime add table public.multiplayer_rooms`
- [ ] RLS enabled on `profiles`, `matches`, `match_reviews`, `multiplayer_rooms`
- [ ] Email auth provider enabled in Supabase dashboard
- [ ] Redirect URL `http://localhost:3000/auth/callback` added (local) or production URL

---

## AI API

- [ ] Without AI env — AI Coach button shows "not configured", no crash
- [ ] With AI env — POST `/api/coach` returns 200 with 4-card analysis
- [ ] With AI env — POST `/api/coach/move` returns 200 with move answer
- [ ] AI key not exposed to client (no `NEXT_PUBLIC_AI_*` variables)
- [ ] `GET /api/health` → `{ "ok": true, "service": "checkmate-arena" }`
