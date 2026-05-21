# DECISIONS

Журнал архитектурных решений Checkmate Arena.

## 2026-05-21 — Стек MVP

- **Frontend:** Next.js 16 (App Router) + TypeScript.
- **UI:** Tailwind CSS v4 (`@theme`-токены: arena-bg/panel/blue/gold/...).
  shadcn/ui — отложен до этапа UI-лоска, не нужен для игрового ядра.
- **Доска:** `chess.js` (правила) + `react-chessboard` v5 (рендер, `options`-проп).
- **Backend (план):** Supabase — Postgres + Auth + Realtime.
- **AI Review (план):** Next.js API route — эвристика по PGN, demo/LLM summary за флагом.
- **Deploy (план):** Vercel + Supabase managed.

Обоснование: единый full-stack под будущий realtime, тёмная премиальная палитра
синий+золото из брифа.

## 2026-05-21 — Границы MVP

Зафиксировано разделение must-have / demo-mock / roadmap. См.
`.claude/plans/...` (одобренный план). Главный приоритет — продуктовая петля,
всё вне неё вторично.

## 2026-05-21 — Этап 1: игровое ядро (offline)

- Правила полностью делегированы `chess.js` (мат/пат/рокировка/en passant/
  превращение/ничьи). Обёртка `lib/chess/engine.ts` (`ChessGame`) не дублирует
  логику — только пробрасывает `{from,to,promotion}` и отдаёт статус/подсветку.
- Нелегальные ходы блокируются на UI: ход применяется только если цель входит
  в `legalTargets(selected)`; иначе клик трактуется как новый выбор.
- Превращение пешки — собственный диалог выбора Q/R/B/N (кастомный flow).
- Хранение состояния партии: `ChessGame` в `useRef` + `useReducer` для ререндера.
  БД/realtime в этапе 1 нет.

## 2026-05-21 — Этап 3.1: Supabase schema (backend foundation)

Только schema + docs. React-код Supabase ещё не использует, пакеты не
установлены, auth UI нет. Файлы: `supabase/schema.sql`,
`docs/SUPABASE_SETUP.md`, `.env.example`.

### Структура БД
- Таблицы `profiles`, `matches`, `match_reviews`. Таблицу `public.users`
  сознательно **не** создаём — идентичность в `auth.users`, чтобы не
  плодить путаницу. `profiles.id` ссылается на `auth.users(id)`
  с `on delete cascade`.
- Связь review с матчем — через `match_reviews.match_id` (`unique`, 1:1).
  Колонку `review_id` в `matches` не делаем: это породило бы циклический
  FK. Lookup review идёт по `match_reviews.match_id`.
- `matches.moves` — `jsonb` (массив SAN), совпадает с локальным
  `lib/demo/progress.ts` (`sanMoves: string[]`).
- `white_player_id` / `black_player_id` nullable + `on delete set null`:
  матч переживает удаление аккаунта, для demo-стороны игрок может
  отсутствовать.

### Check-констрейнты
- `status` — фиксированный набор из брифа 2.11
  (`waiting/active/white_won/black_won/draw/resigned/abandoned/completed`).
- `result` — `null` либо `white_won/black_won/draw`.
- `time_control` — `bullet/blitz/rapid/classical/unlimited`
  (`unlimited` по умолчанию: таймеров в MVP пока нет).
- Рейтинг профиля 0..4000, `peak_rating >= rating`, счётчики неотрицательны.
- `rating_change_*` в диапазоне -100..100, accuracy 0..100.

### Решение по RLS
- **profiles** — публичное чтение всей таблицы. Tradeoff: проще, чем
  view с «безопасными полями». Это допустимо, потому что PII в таблице
  нет — email и прочее живут в `auth.users`, которая клиенту недоступна.
  Insert/update — только владелец (`auth.uid() = id`).
- **matches** — чтение: публичные матчи (`is_public = true`) открыты всем,
  приватные — только участникам. Insert/update — только участник матча.
- **match_reviews** — видимость наследуется от родительского матча
  (через `exists` по `matches`). Insert — только участник матча.

### Решение по public review links
Брифу (2.16, 2.33) нужны share-ссылки на review без авторизации.
Tradeoff: вместо отдельной таблицы share-токенов и подписанных ссылок
введён флаг `matches.is_public` (по умолчанию `true`). Публичный матч и
его review читаются анонимно по прямой ссылке `/review/[matchId]`.

Почему это безопасно для MVP: в `matches` / `match_reviews` нет секретов —
только ходы партии, PGN, FEN и текст AI-разбора, всё это и так показывается
в UI review. Скрывать нечего. Кто хочет приватный матч — ставит
`is_public = false`, и тогда матч/review видят только участники.

Минус подхода: id матча — `gen_random_uuid()`, ссылка не угадывается, но
любой, кому она попала, увидит review. Для MVP это приемлемо; настоящие
подписанные share-токены — задача roadmap, не этого этапа.

### Гостевой режим
Гостевой прогресс остаётся в `localStorage` (`lib/demo/progress.ts`) и
Supabase не трогает. Анонимная запись в БД политиками не предусмотрена —
все write-политики требуют `auth.uid()`. Миграция guest → аккаунт —
задача Stage 3.2.

### Триггеры
Триггеры и сложные SQL-функции на MVP сознательно не используются.
Строку `profiles` после регистрации вставляет клиент/сервер
(`id = auth.uid()`) — это делается на Stage 3.2.
