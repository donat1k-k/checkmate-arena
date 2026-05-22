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

## 2026-05-21 — Этап 3.2: Auth Layer

### SDK и SSR-сессия
- Для email auth установлены `@supabase/supabase-js` и `@supabase/ssr`.
  Browser- и server-client работают только с
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`; отдельный
  service-role client не создаётся и `SUPABASE_SERVICE_ROLE_KEY` на этом
  этапе не используется.
- Сессия заведена через cookie-based SSR helper. `middleware.ts` обновляет
  auth cookies на запросах, чтобы server-side код видел актуальную сессию.
  Next.js 16 уже предупреждает о будущем переходе с `middleware.ts` на
  `proxy.ts`, но Stage 3.2 оставляет имя из утверждённого spec.
- Если public env не заданы, Supabase clients возвращают `null`, middleware
  пропускает запрос без auth-refresh, а `/auth/*` показывает понятное
  состояние «Supabase не настроен». Guest-flow и production build от этого
  не зависят.

### Email auth и profiles
- Реализован только email/password flow: sign up, sign in, sign out.
  Telegram/Google/OAuth и realtime не входят в этот слой.
- Email confirmation задаётся настройкой Supabase Dashboard. Приложение
  поддерживает оба режима: при немедленной сессии создаёт profile сразу,
  а при confirmation показывает email notice и обрабатывает callback через
  `/auth/callback`.
- Строка `public.profiles` создаётся в коде через `ensureProfile()` после
  успешной регистрации, первого входа или callback. Helper сначала читает
  existing row, затем вставляет `id = auth.uid()` под anon key + RLS.
  Триггеров и SQL-функций по-прежнему нет.
- Ник для profile берётся из поля регистрации, затем из auth metadata или
  локальной части email. Все варианты проходят через уже существующий
  `sanitizeNickname()` и укладываются в `profiles_nickname_len`.
- Auth UI не показывает сырые ошибки Supabase: ошибки маппятся на
  существующие i18n keys `errors.*`.

### Guest → account позже
Stage 3.2 не переносит local matches/reviews в Supabase. Для следующего
этапа миграция guest-прогресса проектируется как явное действие после
входа:
- сначала считать browser-local profile/matches и показать пользователю,
  что будет перенесено;
- profile merge делать отдельно от сохранения матчей, не затирая удалённый
  server profile без подтверждения;
- matches/reviews писать только после появления Stage 3.3 persistence и
  сохранить localStorage до подтверждённого remote save;
- после успешного переноса оставить понятный локальный state marker, чтобы
  повторный вход не дублировал матчи.

## 2026-05-21 — Этап 3.3: Account-aware profile + persistence

### Разделение guest и account
- Источник прогресса определяется в браузере по активной Supabase-сессии.
  Без public env или без пользователя `/play`, `/profile` и старые review
  продолжают работать через существующий guest `localStorage`.
- При активной сессии `/profile` не смешивает browser-local историю гостя с
  аккаунтом: профиль и history читаются из `profiles` / `matches`.
  Автоматический перенос старых guest-матчей по-прежнему не начинается.
- `games_played` отдельной колонкой schema не хранится. Экран аккаунта считает
  его из `wins + losses + draws`, чтобы не менять Stage 3.1 schema.

### Сохранение результата аккаунта
- Stage 3.3 сохраняет тот же hot-seat ranked demo: владелец аккаунта играет
  белыми против demo-соперника `local-rival`. `white_player_id` указывает на
  profile, `black_player_id` остаётся `null`.
- Завершённый account match вставляется в `matches`, базовый heuristic review
  вставляется в `match_reviews`, затем обновляются rating/stats в `profiles`.
  Это MVP-клиентский flow без SQL RPC/транзакции: save-effect на `/play`
  защищён от повторного запуска на одном результате, а SQL schema и RLS не
  расширялись.
- Rating delta остаётся продуктово тем же, что в guest loop:
  win `+25`, loss `-25`, draw `0`; `rating_change_white/black` сохраняют delta
  матча, а `peak_rating`, wins/losses/draws/streak обновляются в profile.
- Полный rating before/after для истории аккаунта schema не хранит. Сразу
  после матча `/play` показывает путь рейтинга из загруженного profile
  snapshot, а сохранённые account history/review используют persisted delta.

### Review snapshot
- Basic account review сохраняется как heuristic snapshot без Stockfish,
  LLM и API: headline кладётся в `match_reviews.key_moment`, summary в
  `coach_summary`, next habit в `training_advice`.
- `/review/[matchId]` сначала ищет guest match в localStorage, затем при
  наличии Supabase config читает public account match + review по `matchId`.
  Поэтому старые guest-ссылки остаются браузерными, а account review переживает
  reload и открывается по saved link после входа в другом браузере.

## 2026-05-21 — Этап 3.4: Supabase leaderboard

### Account-aware leaderboard
- `/leaderboard` показывает глобальный список из Supabase `profiles`
  (`order by rating desc`, limit 20) только при настроенном Supabase **и**
  активной сессии. Гость или отсутствие Supabase/сессии — прежний demo/local
  board. Причина: guest-рейтинг живёт в `localStorage`, а не в Supabase, поэтому
  для гостя глобальный список не имеет своей строки — demo-board честнее.
- Текущий пользователь помечается `isYou` по сравнению `profiles.id` с
  `auth.uid()`; отдельного «me»-запроса нет, строка ищется в уже загруженном
  top-списке.

### Demo fallback
- Если реальных аккаунтов меньше 5, список дополняется существующими
  `DEMO_PLAYERS`, чтобы доска не выглядела пустой на раннем этапе. При 5+
  аккаунтах demo-игроки не подмешиваются.
- Города: demo-игроки используют i18n city keys, аккаунты — сырое
  `profiles.city` (сейчас обычно пусто, показывается «—»). Маппинг сырого
  города в i18n-ключи не делается — это не нужно для MVP.

### Границы
- Без realtime/polling: список читается один раз при заходе на страницу.
  Обновление рейтинга в leaderboard видно после перезагрузки страницы.
- `schema.sql` не менялся; RLS `profiles` (`select using (true)`) уже позволял
  публичное чтение для leaderboard.

## 2026-05-22 — Этап 4.3: AI Coach persistence

### Хранение AI-анализа
- AI-анализ хранится как JSONB в `match_reviews.ai_analysis` (nullable).
  Одна строка на матч (1:1 через существующий unique-индекс `match_id`).
  JSONB выбран вместо отдельных колонок, потому что структура анализа может
  расширяться (поля, версии prompt), а schema-миграции для каждого поля
  избыточны. Один jsonb-столбец легко добавить и просто читать.

### UPDATE RLS для match_reviews
- В Stage 3.1 у `match_reviews` была только INSERT-политика. UPDATE-политика
  добавлена в Stage 4.3 через миграцию `0002_add_ai_analysis.sql`.
  Без неё Supabase RLS блокировал бы `supabase.update(...)` на любом review.
  Политика симметрична INSERT: только участник родительского матча.

### Применение миграции — вручную
- `supabase/migrations/0002_add_ai_analysis.sql` применяется вручную через
  Supabase SQL editor. Автоматического применения нет.
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` идемпотентен.
  `CREATE POLICY` идемпотентен только при первом запуске — повторный вызов
  даст ошибку "policy already exists" (безопасно игнорировать при re-run).

### Graceful fallback если миграция не применена
- `loadAccountReview` не выбирает `ai_analysis` — не ломается без колонки.
- `loadSavedAiAnalysis` выбирает только `ai_analysis`; при ошибке (42703 =
  undefined column) возвращает null — страница показывает кнопку без краша.
- `saveAiAnalysis` проверяет `error.code === "42703"` и возвращает
  `"migrationNeeded"` вместо generic error — UI показывает точный hint.

### Guest analysis — session-only
- Гостевой AI-анализ не пишется в Supabase. Без аккаунта нет `match_id` в
  базе, поэтому `saveAiAnalysis` не вызывается. Гость видит результат в
  текущей сессии; после reload кнопка возвращается. Об этом сообщает `guestNote`.

### Схема AiAnalysis
```
{
  mainMistake, bestAlternative, whyImportant, trainNext: string,
  keyMovePly?: number, keyMoveSan?: string, keyMoveComment?: string
}
```
Валидатор `toAiAnalysis()` проверяет 4 обязательных string-поля, опциональные key move поля копирует только при правильном типе — защита от частичной записи или изменения формата. Старые объекты без key move полей читаются без краша.

## 2026-05-22 — Этап 4.4: Interactive Review Replay

### Replay из sanMoves на клиенте
Позиции восстанавливаются на клиенте: `new Chess()` + цикл `chess.move(san)` по `sanMoves[]`. Это не требует нового API, движка или server-side вычислений. FEN на каждый ply сохраняется в `useMemo`. При невалидном SAN цикл прерывается — показываем то, что успели вычислить.

Почему не через `ChessGame` (engine.ts): replay — read-only, `resign` state не нужен, проще создавать чистый `Chess()` без обёртки. `engine.ts` не менялся.

### keyMove поля в AiAnalysis JSONB без миграции
`keyMovePly`, `keyMoveSan`, `keyMoveComment` — опциональные поля в существующем `ai_analysis jsonb`. Никакой SQL-миграции не требуется: старые строки без этих полей читаются нормально (toAiAnalysis возвращает undefined), новые строки с полями — сохраняются и читаются. JSONB гибкость — именно для таких расширений.
