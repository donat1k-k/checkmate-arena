# ♟ Checkmate Arena

**AI-powered chess arena с мультиплеером по ссылке, AI Coach, Blitz Mate Rush, прогрессией, монетизацией и социальным слоем.**

> **Статус:** Submission-ready MVP · Готовый прототип стартапа · Stage 10

---

## Содержание

- [Что это за продукт](#что-это-за-продукт)
- [Почему это не обычная шахматная доска](#почему-это-не-обычная-шахматная-доска)
- [Соответствие уровням ТЗ](#соответствие-уровням-тз)
- [Главные фичи](#главные-фичи)
- [Креативные решения](#креативные-решения)
- [Бизнес-модель](#бизнес-модель)
- [Технологии](#технологии)
- [Архитектура](#архитектура)
- [Как запустить локально](#как-запустить-локально)
- [Переменные окружения](#переменные-окружения)
- [Supabase setup](#supabase-setup)
- [Деплой](#деплой)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [English summary](#english-summary)

---

## Что это за продукт

Checkmate Arena — соревновательная шахматная платформа, которая превращает одиночную игру в полноценный игровой продукт с прогрессией, AI-разбором и социальным слоем.

**Главная петля удержания:**
зашёл → сыграл → получил рейтинг → получил AI-разбор → увидел прогресс → захотел сыграть ещё.

Игрок может:
- сыграть **локально** (hot-seat), **против AI** (3 уровня сложности) или **с другом по ссылке** (мультиплеер через Supabase Realtime);
- после игры получить **AI Coach** — разбор ошибок с ключевыми моментами, обучающими карточками и возможностью задавать вопросы по каждому ходу;
- прокачивать **профиль**: рейтинг ELO, уровень 1–10, ELO-график, история матчей;
- играть в **Blitz Mate Rush** — быстрый режим матовых задач с таймером и наградами;
- тратить **Arena Coins** в магазине: скины доски, фигур, рамки профиля, тайтлы;
- видеть себя на **глобальном лидерборде** с фильтром по городу и клан-тегом;
- подписаться на **Pro / Ultra** (визуальный shell, Stripe-интеграция в roadmap).

---

## Почему это не обычная шахматная доска

| Что есть у большинства | Что есть у Checkmate Arena |
|------------------------|---------------------------|
| Доска + правила | Полный продуктовый движок с retention-петлёй |
| Игра против бота | AI Coach: разбор после каждой партии + Q&A по ходам |
| Нет мультиплеера | Friend rooms по ссылке, Supabase Realtime |
| Нет экономики | Arena Coins, магазин, Pro Trial |
| Нет прогрессии | ELO, LVL 1–10, ELO-график, роль/стиль, достижения |
| Нет монетизации | Free / Pro / Ultra pricing shell, готов к Stripe |
| Нет социального слоя | Лидерборд с городами, кланы, commend/report |
| Локализация | RU / EN покрытие основных пользовательских сценариев, 300+ строк i18n |
| Нет мобилки | Mobile-first 375px, протестировано |

---

## Соответствие уровням ТЗ

| Уровень | Требование | Статус |
|---------|-----------|--------|
| **Средний** | Правила шахмат, локальная игра, сохранение истории | ✅ chess.js, localStorage |
| **Средний** | Корректная работа в браузере | ✅ Next.js, TypeScript |
| **Сильный** | AI-соперник | ✅ 3 уровня (Beginner / Casual / Tactical) |
| **Сильный** | История матчей и review | ✅ localStorage + Supabase |
| **Сильный** | Авторизация / Supabase | ✅ email auth + guest mode |
| **Сильный** | Темы, адаптивность | ✅ Dark/Light, mobile 375px |
| **Великий** | Мультиплеер по ссылке | ✅ Friend rooms, Supabase Realtime |
| **Великий** | AI Coach | ✅ 4 insight карточки + ключевые моменты + Q&A |
| **Великий** | Социальный слой | ✅ Лидерборд с городами, кланы, commend/report |
| **Великий** | Upgrade to Pro / монетизация | ✅ Pro/Ultra pricing shell, Arena Store |
| **Великий** | Уникальная ниша | ✅ Blitz Mate Rush, Fair Play Guard, Coach Advice |
| **Великий** | Бизнес-мышление | ✅ Arena Coins, Pro Trial, Free AI reviews quota |

---

## Главные фичи

### Chess core
| Фича | Детали |
|------|--------|
| Local hot-seat | Два игрока на одном устройстве, полные правила chess.js |
| vs AI | Beginner (random), Casual (взятия/шахи), Tactical (материальный перевес) |
| Превращение пешки | Кастомный диалог Q/R/B/N, корректный SAN |
| Автосохранение | Активная партия переживает перезагрузку страницы |
| Replay Board | Пошаговый просмотр любого матча, клик по ходу = прыжок к позиции |

### Мультиплеер
| Фича | Детали |
|------|--------|
| Friend rooms по ссылке | 6-символьный код → другу → он открывает → автоматический join |
| Supabase Realtime | Ходы синхронизируются через postgres_changes, polling-fallback при join |
| Resign | Подтверждение → результат синхронизируется обоим игрокам |
| Индикатор шаха | Красный баннер для короля в шахе |
| Промоушен overlay | Fullscreen overlay с именованными фигурами |
| Fair Play Guard | Уведомление об отключении AI-подсказок в PvP, commend/report после матча |

### AI слой
| Фича | Детали |
|------|--------|
| AI Coach после игры | 4 структурированные карточки: главная ошибка, альтернатива, почему важно, что тренировать |
| Key Moments Timeline | AI выделяет 3–6 поворотных моментов с типом, комментарием и прыжком к позиции |
| Training from Mistakes | Игрок отвечает «что бы ты сыграл?» → видит ответ тренера → может спросить AI |
| Ask AI about this move | Вопрос к AI по любому ходу в replay, 4 готовых быстрых вопроса |
| Coach Advice in-game | Эвристика chess.js: топ-3 хода с объяснением (без LLM). Стоит 100 AC или бесплатно в Pro Trial |
| AI persistence | Анализ сохраняется в Supabase `ai_analysis JSONB`, загружается при повторном открытии |

### Профиль и прогрессия
| Фича | Детали |
|------|--------|
| ELO-график | SVG-спарклайн изменения рейтинга по матчам |
| LVL 1–10 | Уровень из побед + win rate, прогресс-бар в шапке профиля |
| Роль / стиль | Эвристика по истории: "Aggressive", "Tactical", "Defensive" |
| История матчей | Local (localStorage) и account (Supabase): local/AI/multiplayer |
| Редактирование профиля | Nickname, bio (160 символов), аватар, клан-тег, equipped тайтл/рамка |
| Репутация | Commendations received, reports (localStorage idempotency) |

### Экономика и магазин
| Фича | Детали |
|------|--------|
| Arena Coins | Внутренняя валюта без денежной ценности. +10 AC за завершённую игру |
| Arena Store | Скины доски, фигур, coach cards, статусные тайтлы |
| Equip system | Owned items экипируются по категориям, отображаются в профиле |
| Pro Trial | 3 бесплатные Pro-игры. Ledger по matchId — нет двойного списания |
| Free AI reviews | 3 бесплатные генерации AI Coach. Ошибки API лимит не списывают |

### Blitz Mate Rush
| Фича | Детали |
|------|--------|
| 22 позиции | Easy × 8, Medium × 8, Hard × 6 |
| Таймер + подсказки | Лимит времени, 1 подсказка на сессию (Pro — unlimited teaser) |
| Клик + drag | Выбор фигуры, подсветка ходов, подтверждение решения |
| AC Rewards | Coins за решённые задачи, idempotency по puzzle id |
| Статистика | Solved, streak, best streak, accuracy — в профиле |

### Социальный слой
| Фича | Детали |
|------|--------|
| Глобальный лидерборд | Supabase `profiles` (top 20 по рейтингу), fallback на demo data |
| City filter | Global / Новосибирск / Алматы / Москва / Астана |
| Top-3 карточки | Подсвеченные лидеры с локацией и статистикой |
| Clan tags | Пресеты: NVS / ALM / TACT / MATE / RUSH |
| Commend / Report | После multiplayer матча, idempotency per room |

### Инфраструктура
| Фича | Детали |
|------|--------|
| RU / EN i18n | ~300 ключей по основным экранам; отдельные технические строки могут оставаться в коде |
| Dark / Light theme | Amber-система токенов. No flash при перезагрузке |
| Mobile 375px | Все страницы протестированы, нет горизонтального overflow |
| Auth | Supabase email auth. Guest mode без auth-стены |
| Docker | 3-stage production build. Секреты в образ не зашиты |
| Health endpoint | `GET /api/health` → `{ ok: true, service: "checkmate-arena" }` |

---

## Креативные решения

### Blitz Mate Rush
Отдельный игровой режим «почти завершённые позиции» — быстрее обычной партии, сразу интересно. Таймер, подсказки, AC-награды. Даёт продуктовый хук для короткого захода.

### Arena Coins как внутренняя экономика
Внутренняя валюта создаёт retention-механику без реальных платежей. Игрок зарабатывает монеты, тратит в магазине, видит прогресс экономики профиля. Готово к конвертации в Stripe-пополнение.

### Pro Trial на 3 игры
Вместо «upgrade или ничего» — пользователь получает 3 бесплатных Pro-игры, чтобы почувствовать премиум. Ledger по matchId: нет двойного списания при ререндере или перезагрузке.

### Free AI reviews quota
3 бесплатных AI Coach генерации. Ошибки API не списывают квоту. Уже сохранённый анализ загружается бесплатно. Квота создаёт понятный апсейл к Pro.

### Coach Advice in-game (без LLM)
Эвристика chess.js: приоритет шах > взятие > центр > развитие. Топ-3 кандидата с объяснением. Нулевой LLM cost, работает офлайн, честное позиционирование — «кандидаты, не engine-анализ».

### Fair Play Guard
Честный UI-сигнал: AI-подсказки в PvP отключены. После матча — CTA на AI Coach review. Не production anti-cheat, но продуктово правильно: не давать читить и объяснять почему.

### Profile progression как в competitive games
ELO + LVL + роль/стиль + equipped cosmetics + clan tag = профиль, который хочется прокачивать. Не просто статистика — идентичность игрока.

### City / Clan social layer
Лидерборд с городами и клан-тегами создаёт локальные сообщества. Новосибирск, Алматы, Астана — реальные целевые рынки, не абстрактный «глобальный лидерборд».

---

## Бизнес-модель

### Тарифы

| Тир | Что включает | Статус |
|-----|-------------|--------|
| **Free** | Local chess, vs AI, 3 free AI reviews, 3 Pro Trial игры, Mate Rush Easy/Medium, базовый профиль | ✅ Реализовано |
| **Pro** | Unlimited AI reviews, все уровни Blitz, premium store items, детальная статистика, in-game hints | 🔲 Visual shell |
| **Ultra** | Priority AI, clan tools, tournament rooms, report export, всё из Pro | 🔲 Visual shell |

### Монетизация (shell + roadmap)

| Механика | Состояние |
|---------|-----------|
| Pricing page Free / Pro / Ultra | ✅ Реализовано |
| Comparison table (17 строк) | ✅ Реализовано |
| Arena Coins + Store | ✅ Реализовано (browser-local) |
| Profile frames / Board skins / Coach cards | ✅ Реализовано (visual) |
| Pro Trial counter | ✅ Реализовано |
| Free AI reviews quota | ✅ Реализовано |
| Feature gates (disabled CTA, locked states) | ✅ Реализовано |
| Stripe / реальные платежи | ❌ Не подключено — "Billing coming soon" |
| Server-side entitlement checks | ❌ Не подключено — client-side only |

**Честная граница:** реальные платежи не подключены намеренно. Pro/Ultra — это product shell для демонстрации monetization thinking. Вся инфраструктура готова к Stripe: pricing page, feature gates, Pro Trial counter, AI review quota.

---

## Технологии

| Слой | Стек |
|------|------|
| **Framework** | Next.js 16 (App Router), TypeScript |
| **Стили** | Tailwind CSS v4, amber token system, Plus Jakarta Sans / JetBrains Mono |
| **Шахматы** | chess.js (правила), react-chessboard v5 (UI) |
| **Backend** | Supabase — Postgres, Auth (email), Realtime (multiplayer) |
| **AI** | OpenAI-compatible API (OpenAI, Anthropic via OpenRouter, Ollama) |
| **Local state** | localStorage: guest progress, economy, cosmetics, blitz stats |
| **Deploy** | Docker 3-stage build, Vercel-compatible |

---

## Архитектура

```
app/
  page.tsx              # Home / hero
  play/                 # Chess game (local / vs AI / multiplayer link)
  review/[matchId]/     # AI Coach review, Replay, Ask AI, Training
  blitz/                # Blitz Mate Rush puzzles
  multiplayer/          # Create / join friend rooms
  room/[code]/          # Live multiplayer room (Supabase Realtime)
  profile/              # Player profile, ELO graph, history, cosmetics
  leaderboard/          # Global rankings, city filter, clan tags
  pro/                  # Pricing page + Arena Store
  settings/             # Language, theme, avatar, cosmetics
  auth/                 # Sign in / sign up / callback
  api/coach/            # AI Coach server route (key server-only)
  api/coach/move/       # Ask AI about move server route
  api/health/           # Health check endpoint

components/
  chess/                # Board, ReplayBoard, MoveList
  layout/               # SiteShell (nav, mobile menu)
  settings/             # PreferencesProvider (i18n + theme)

lib/
  chess/engine.ts       # ChessGame wrapper (chess.js)
  chess/ai.ts           # Local AI opponent heuristics
  ai/coachPrompt.ts     # AI Coach prompt builder (RU/EN)
  ai/moveQuestionPrompt.ts  # Ask AI about move prompt
  demo/progress.ts      # Guest progress (localStorage)
  demo/economy.ts       # Arena Coins (localStorage)
  demo/cosmetics.ts     # Equipped cosmetics (localStorage)
  demo/blitz.ts         # Blitz puzzle definitions
  supabase/             # Supabase client, matches, profiles, reviews, leaderboard
  i18n/translations.ts  # RU/EN string dictionaries (~300 keys)

supabase/
  schema.sql            # Full target schema
  migrations/           # 0002_add_ai_analysis.sql, 0004_multiplayer_rooms.sql
```

**AI flow:**
```
/review → POST /api/coach (server) → lib/ai/coachPrompt.ts → OpenAI-compatible API
        → JSON { mainMistake, bestAlternative, whyImportant, trainNext, keyMoments[] }
        → Saved to match_reviews.ai_analysis (JSONB)
        → UI: 4 cards + Key Moments Timeline + Training from Mistakes

/review → POST /api/coach/move (server) → lib/ai/moveQuestionPrompt.ts
        → JSON { answer, betterPlan, trainingTip }
        → UI: 3-card answer (session only)
```

---

## Как запустить локально

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env.local
cp .env.example .env.local
# Заполнить переменные (см. раздел ниже)

# 3. Запустить dev server
npm run dev

# 4. Production build
npm run build
npm run start
```

> **Без `.env.local`** — приложение работает в guest-режиме (localStorage).
> Auth-страницы показывают "Supabase not configured". AI Coach показывает "not configured".
> `npm run build` проходит без переменных окружения.

---

## Переменные окружения

| Переменная | Описание |
|------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (публичный, безопасно) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (только сервер) |
| `AI_COACH_API_BASE_URL` | Base URL OpenAI-compatible провайдера (без `/chat/completions`) |
| `AI_COACH_API_KEY` | API ключ провайдера (server-only, не `NEXT_PUBLIC_`) |
| `AI_COACH_MODEL` | Модель: `gpt-4o-mini`, `anthropic/claude-haiku-4-5`, `llama3` и т.д. |

---

## Supabase setup

```sql
-- Шаг 1: base schema
-- Вставить содержимое supabase/schema.sql

-- Важно: schema.sql уже содержит match_reviews.ai_analysis
-- и policy reviews_update_participant. После полного schema.sql
-- НЕ запускайте 0002_add_ai_analysis.sql повторно.

-- Шаг 2: multiplayer rooms
-- Вставить содержимое supabase/migrations/0004_multiplayer_rooms.sql

-- Шаг 3: включить Realtime для мультиплеера
alter publication supabase_realtime add table public.multiplayer_rooms;

-- Только для incremental setup старой БД:
-- supabase/migrations/0002_add_ai_analysis.sql
```

В Supabase Dashboard:
- **Authentication → Providers** — включить Email
- **Authentication → URL Configuration** — добавить redirect URL (`http://localhost:3000/auth/callback` для local)

---

## Деплой

**Docker:**
```bash
docker build -t checkmate-arena .
docker run --env-file .env.local -p 3000:3000 checkmate-arena
```

**Vercel:**
- Push в GitHub → connect Vercel → добавить env vars → deploy

Подробнее: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Known limitations

| Область | Статус |
|---------|--------|
| **Stripe / реальные платежи** | Не подключено — billing "Coming soon" |
| **Pro entitlements** | Visual shell — нет server-side enforcement |
| **Fair Play Guard** | Prototype-level — нет production anti-cheat и банов |
| **Таймеры / draw offer** | Не реализованы в мультиплеере |
| **Multiplayer RLS** | Prototype — anon может обновить любую комнату; нужно hardening под production |
| **Server-side move validation** | Client-side chess.js only; Edge Function нет |
| **Matchmaking** | Только friend rooms — нет случайного соперника |
| **Guest → account миграция** | Прогресс хранится отдельно, автомиграции нет |
| **Clan system** | Visual presets — нет server-side хранения |
| **Premium analytics** | Locked UI shell — нет реальной аналитики |

---

## Roadmap

### Near-term
- [ ] Stripe billing — checkout для Pro/Ultra
- [ ] Server-side entitlement checks — перенос gates с клиента на API
- [ ] Multiplayer RLS hardening — `auth.uid()` per-player UPDATE validation
- [ ] Server-side move validation (Edge Function)
- [ ] Draw offer + timers (bullet/blitz/rapid)

### Mid-term
- [ ] Matchmaking — очередь случайного соперника
- [ ] Spectator mode + chat
- [ ] Real clan system (server-side)
- [ ] Tournament rooms
- [ ] Guest → account progress migration

### Long-term
- [ ] Stockfish / WASM engine для глубокого анализа
- [ ] Стрики, ачивки, сезонные события
- [ ] Mobile PWA / React Native
- [ ] Coach personalization (память слабостей игрока между партиями)

---

## English summary

**Checkmate Arena** is a full-stack competitive chess platform built as a startup-ready prototype. Beyond a standard chess board, it delivers: real-time friend rooms via Supabase Realtime, an AI Coach that reviews every game with structured insight cards and a move-by-move Q&A, Blitz Mate Rush (quick puzzle mode), a progression system (ELO, levels, ELO graph), an internal economy with Arena Coins and a cosmetics store, and a Free/Pro/Ultra monetization shell ready for Stripe. The social layer includes a city-filtered global leaderboard, clan tags, and commend/report. Built with Next.js 16, TypeScript, Tailwind CSS v4, chess.js, Supabase (Auth + Postgres + Realtime), and an OpenAI-compatible AI layer. Broad RU/EN i18n coverage, mobile-responsive, Docker + Vercel deploy path. Real payments are intentionally not wired — the billing infrastructure (pricing page, feature gates, trial counters) is product-complete and Stripe-ready.
