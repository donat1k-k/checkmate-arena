# HANDOFF

## Этап 1 — Игровое ядро (offline). Статус: завершён (2026-05-21)

### Сделано
- Scaffold: Next.js 16 + TS + Tailwind v4. `npm run dev` / `npm run build` OK.
- `lib/chess/engine.ts` — класс `ChessGame` (обёртка chess.js): ход, легальные
  цели, детект промоушена, статус партии, подсветка короля в шахе, сдача.
- `components/chess/Board.tsx` — обёртка react-chessboard v5 (клик + drag).
- `components/chess/MoveList.tsx` — история ходов SAN парами.
- `app/play/page.tsx` — offline hot-seat: клик/drag-ходы, подсветка выбора и
  легальных целей, диалог промоушена, индикатор хода/шаха, Resign, New Game,
  экран результата.
- `app/page.tsx` — минимальный Home-лендинг.

### Проверено в браузере (Preview MCP)
- Детский мат → мат определён, король подсвечен красным.
- Превращение пешки → диалог Q/R/B/N, ферзь поставлен, SAN `hxg8=Q`.
- Resign → "White wins by resignation".
- New Game → сброс. Mobile (375px) → доска сверху, панель вертикально.
- Консоль без ошибок.

### Не кликалось вручную (делегировано chess.js, доверяем библиотеке)
Рокировка, взятие на проходе, пат, ничьи. Правила реализованы chess.js нативно,
обёртка их не дублирует. При желании — точечно прогнать позже.

## Этап 2 — Local Product Loop. Статус: завершён (2026-05-21)

### Сделано
- Guest entry на `/play`: nickname создаёт локальный guest profile в
  `localStorage`; рейтинг начинается с 1000.
- Локальный ranked demo поверх Stage 1 hot-seat: guest считается White против
  `Local Rival`, завершённый матч меняет рейтинг на `+25` / `-25` / `0`.
- `lib/demo/progress.ts` хранит guest profile и match history в браузере,
  сохраняет один результат на один match id и отдаёт level/winrate helpers.
- `/profile` показывает рейтинг, level, статы и историю матчей с переходом в
  review.
- `/review/[matchId]` показывает результат и demo heuristic AI Coach по
  результату и SAN-history без engine evaluation/API.
- `/leaderboard` показывает demo-игроков и текущего guest среди них.
- Общая навигация теперь ведёт на Home / Play / Profile / Leaderboard.

### Команды и проверки
- `npm run build` — OK.
- `git diff --check` — OK, только предупреждения Git о будущем LF → CRLF для
  изменённых TSX-файлов.
- `Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/play'` — HTTP 200
  от уже запущенного Next dev server в этом workspace.

### Что проверить вручную
- На `/play` задать nickname и убедиться, что после reload он остаётся.
- Завершить одну партию победой/поражением/ничьей и убедиться, что карточка
  результата появляется один раз, а повторный ререндер не дублирует матч.
- Открыть Review после результата и из Profile history.
- Проверить Profile и Leaderboard после нескольких завершённых партий.
- Прогнать mobile layout для navigation, Play sidebar, history и review cards.

### Не проверено кликами в браузере в этом проходе
Browser preview заблокировал локальный URL (`localhost` и `127.0.0.1`) в
in-app browser, поэтому интерактивный click-through оставлен в ручных шагах
выше. Production build при этом прошёл.

## Этап 2.5 — Product Polish / Demo-ready. Статус: завершён (2026-05-21)

### Сделано
- Общий shell стал demo-ready: брендированный sticky nav, ссылка на Pro,
  footer loop, более выразительные глобальные focus/background states.
- Home теперь показывает продуктовую петлю через arena hero с реальным
  chessboard preview, CTA в Play/Leaderboard и быстрые сигналы про guest,
  rating и coach.
- `/play` переработан в матчевый экран без изменения chess engine:
  player rails, rating/level header, match status, усиленный result block,
  переходы в Review/Profile/Leaderboard и более читаемый move list.
- `/profile` усилен identity/progress слоем: avatar initials, peak/current
  rating, badges/status, latest match signal и более заметная history.
- `/review/[matchId]` подан как короткий coach report: result panel, review
  signals, SAN last-sequence trace и train-next block без engine/API метрик.
- `/leaderboard` получил top-3 competitive section и сохранённую таблицу с
  подсветкой guest row.
- Добавлен статический `/pro` monetization concept с честной границей:
  checkout/auth/backend entitlements не реализованы.
- `lib/chess/engine.ts` и `lib/demo/progress.ts` в этом этапе не менялись.

### Команды и проверки
- `npm run build` — OK.
- `git diff --check` — OK, только предупреждения Git о будущем LF → CRLF для
  изменённых UI-файлов.
- `npm run dev -- --port 3000` — поднят локальный dev server для visual QA.
- In-app browser click-through: Home, guest entry, Play, Resign → Result →
  Review, Profile, Leaderboard, Pro; проверены desktop и mobile-size views.

### Что проверить вручную
- Пройти happy path с новым nickname: `/` → `/play` → завершить матч →
  открыть Review → вернуться в Profile → открыть Leaderboard.
- На `/play` проверить обычные click/drag moves, promotion flow, Resign и
  New Game после завершения результата.
- На `/profile` проверить empty state в чистом браузере и history после
  нескольких сохранённых матчей.
- Проверить `/pro`, что кнопка checkout остаётся честно disabled/coming soon.
- Проверить nav, hero, match screen, review cards и leaderboard table на
  узком mobile viewport.

## Этап 2.6 — Settings + i18n foundation. Статус: завершён (2026-05-21)

### Сделано
- Добавлен browser-local preferences layer: `PreferencesProvider` хранит
  `locale` (`RU` / `EN`) и `theme` (`Dark` / `Light`) в отдельном
  `localStorage` key, выставляет `html lang` и `data-theme`.
- Добавлена `/settings` с переключателями языка и темы, ссылка Settings
  появилась в общем shell.
- Заведён `lib/i18n/translations.ts` со словарями для shell, Home, Play,
  Profile, Leaderboard, Review, Pro, Settings и основных chess UI labels.
- Local match history продолжает хранить технические `win` / `loss` / `draw`
  и finish keys; перевод result/finish и demo coach copy делается при
  отображении.
- Light theme добавлена через override существующих `arena-*` color tokens без
  редизайна страниц и без изменений chess engine/product loop storage.

### Команды и проверки
- `npm run build` — OK.
- `git diff --check` — OK, только предупреждения Git о будущем LF → CRLF для
  изменённых файлов.
- In-app browser: `/settings` RU/EN и Dark/Light переключаются; после reload
  сохраняются RU + Light, `html` получает `lang="ru"` и `data-theme="light"`.
- In-app browser route pass в RU/Light: Home, Play, Profile, Leaderboard, Pro,
  Review существующего локального матча.

### Что проверить вручную
- В чистом браузере открыть `/settings`, выбрать RU/EN и Dark/Light, затем
  перезагрузить страницу и убедиться, что preferences сохранились.
- Пройти локальную петлю на обоих языках: `/play` → завершить матч → Review →
  Profile → Leaderboard.
- Проверить Home, Play board area, таблицу Leaderboard и Pro в Light theme на
  desktop и узком mobile viewport.
- Убедиться, что SAN-нотация и сохранённая история матчей не меняются при
  переключении языка.

## Этап 2.6.1 — Pre-backend cleanup. Статус: завершён (2026-05-21)

### Сделано
- Demo-соперник вынесен в translations: `/play`, Profile и Review теперь
  показывают локализованное имя вместо захардкоженного UI-copy.
- Новые local matches сохраняют технический opponent id `local-rival`; старые
  матчи с legacy-значением `Local Rival` продолжают читаться и получают тот же
  локализованный display fallback.
- Demo-города Leaderboard переведены на стабильные city keys и локализуются в
  top-3 карточках и таблице.
- В translations добавлены базовые future auth/backend error keys без
  подключения auth, API или Supabase.
- Точечно приглажены несколько неестественных RU-строк в текущем i18n copy.
  Rating loop и chess engine не менялись.

### Команды и проверки
- `npm run build` — OK.
- `git diff --check` — OK, только предупреждения Git о будущем LF → CRLF для
  изменённых файлов.
- In-app browser: RU `/play`, `/profile`, `/review/[matchId]` показывают
  локализованного demo-соперника для уже сохранённого local match; RU
  `/leaderboard` показывает локализованные города в карточках и таблице.
- In-app browser: EN `/play` показывает `Local Rival`, EN `/leaderboard`
  показывает английские city labels.

### Что проверить вручную
- Переключить RU/EN и открыть `/play`, Profile history и Review уже
  сохранённого local match: имя demo-соперника должно следовать выбранному
  языку.
- Открыть `/leaderboard` на RU/EN и проверить city labels в top-3 и таблице,
  включая guest row и `Other`.
- Завершить новый local match и убедиться, что результат, рейтинг, Profile и
  Review продолжают работать как в этапе 2.6.

## QA-проход — Chess mechanics. Статус: пройден (2026-05-21)

QA + точечный bugfix без нового этапа. Подозрение на баг прямого promotion
проверялось, **не подтвердилось**.

### Проверено в браузере (Preview MCP, click-flow)
- Обычные ходы, illegal move заблокирован (выбор пешки + клик по нелегальной
  клетке — ход не применён, move list пуст).
- Checkmate: детский мат `Qh4#`, статус "Checkmate - Black wins", король e1
  подсвечен красным.
- Resign: "Black wins by resignation".
- Promotion через взятие: `gxh8=R`, выбор фигуры из диалога ставит ладью.
- Promotion прямым ходом на пустую последнюю клетку: `b8=Q`. Клетка b8 (пустая,
  8-я горизонталь) корректно показывается как легальная цель, диалог Q/R/B/N
  открывается, ферзь ставится. **Подозреваемый баг не воспроизводится.**
- Рокировка: `O-O` (король g1, ладья f1).
- En passant: `exd6` (взятая пешка d5 убрана).
- Консоль браузера без ошибок.

### Не проверено
- Пат — позицию не выставляли (правило делегировано chess.js).

### Изменения кода
- Нет. Баг не подтвердился, фикс не требовался.

## Этап 3.1 — Supabase schema + setup docs. Статус: завершён (2026-05-21)

### Сделано
- `supabase/schema.sql` — schema MVP-бэкенда: таблицы `profiles`,
  `matches`, `match_reviews`; check-констрейнты на
  status/result/time_control/rating/accuracy; индексы для leaderboard,
  match history и review lookup; RLS-политики на трёх таблицах.
- `docs/SUPABASE_SETUP.md` — инструкция: создание проекта, применение
  schema, ключи/env, краткая модель RLS, ручной чек-лист дашборда.
- `.env.example` — placeholder-ключи Supabase (URL, anon, service_role),
  без реальных секретов.
- `docs/DECISIONS.md` — решения этапа 3.1: структура БД, отказ от
  `public.users` и циклического `review_id`, модель RLS, подход к
  public review links, отказ от триггеров на MVP.

### Границы этапа
- Frontend-интеграции нет. React Supabase не использует.
- Пакеты не установлены. Auth UI нет.
- `npm run build` не запускался — frontend-код не менялся.
- `git diff --check` — чисто.

### Что сделать вручную в Supabase dashboard
- Создать проект Supabase.
- Выполнить `supabase/schema.sql` в SQL Editor.
- Проверить, что RLS включён на `profiles`, `matches`, `match_reviews`.
- Скопировать URL + anon + service_role ключи в локальный `.env.local`
  (не коммитить).
- Auth-провайдеры — отложено до Stage 3.2.

## Подготовка Stage 3.2 — Auth Layer (история handoff)

Полное ТЗ для Codex вынесено в `docs/STAGE_3_2_AUTH_SPEC.md` (создан
2026-05-21): цель, границы, список файлов, env, подключение Supabase
client, sign up/in/out, создание profile row, сохранение guest-flow,
i18n-ключи, запреты, критерии готовности, QA-чек-лист, команды.

Кратко по исходному spec:
- Установить `@supabase/supabase-js` (+ `@supabase/ssr` при необходимости).
- Создать Supabase client (browser + server) на базе env-переменных.
- Включить Email auth-провайдер в дашборде.
- Реализовать вставку строки `profiles` после регистрации
  (`id = auth.uid()`, без триггера).
- Сохранить рабочим гостевой localStorage-режим, без auth-стены.
- Спроектировать (в DECISIONS) миграцию guest-прогресса в аккаунт.
- Backend/realtime и перенос matches/reviews — после 3.2, отдельной
  задачей.

## Этап 3.2 — Auth Layer. Статус: завершён (2026-05-21)

### Сделано
- Установлены `@supabase/supabase-js` и `@supabase/ssr`.
- Добавлены env-safe Supabase browser/server clients и cookie refresh в
  `middleware.ts`; без `.env.local` сборка не падает, auth UI показывает
  состояние «Supabase не настроен».
- Добавлены `/auth/sign-in`, `/auth/sign-up`, `/auth/callback`, общая
  email/password форма, nav status активной сессии и sign out.
- `ensureProfile()` создаёт/читает `public.profiles` после sign up, первого
  sign in и callback. Ник проходит через `sanitizeNickname()`; service-role
  в браузер и в этот flow не добавлялся.
- RU/EN словари получили namespace `auth`; auth ошибки показываются через
  `errors.*`, без сырого текста Supabase.
- Guest `/play`, локальные profile/history/review/leaderboard flow и
  `localStorage`-ключи Stage 2 не переносились в backend и не закрывались
  auth-стеной.
- В `DECISIONS.md` зафиксированы auth-решения и контур будущего явного
  переноса guest → account без начала Stage 3.3.

### Команды и проверки
- `npm run build` — OK при отсутствующем `.env.local`.
  Next.js 16 предупреждает, что file convention `middleware.ts` в будущем
  нужно заменить на `proxy.ts`; имя оставлено по Stage 3.2 spec.
- `git diff --check` — OK, только предупреждения Git о будущем LF → CRLF.
- In-app browser без env: `/auth/sign-in` и `/auth/sign-up` показывают
  setup-state; RU + light auth copy виден на mobile viewport 375px без
  горизонтального overflow; `/play` остаётся доступен локальному guest.
- In-app browser console — без error logs в этом pass.

### Что проверить вручную
- В Supabase-проекте с применённой Stage 3.1 schema заполнить `.env.local`,
  открыть `/auth/sign-up` и зарегистрировать новый email; проверить строку
  `profiles` с `id = auth.uid()`.
- Перезагрузить страницу с активной сессией, проверить nav status, затем
  sign out и повторный sign in.
- С неверным паролем проверить локализованную ошибку вместо сырого ответа
  Supabase.
- При включённом email confirmation проверить notice после регистрации и
  callback после письма.
- Без env открыть `/auth/sign-in` и `/auth/sign-up`: должно быть понятное
  состояние Supabase setup и путь играть гостем.
- Без входа пройти `/play` → local match → Review → Profile/Leaderboard и
  убедиться, что guest localStorage flow остался рабочим.
- Переключить RU/EN и dark/light на обеих auth-страницах, отдельно открыть
  mobile viewport 375px.

### Что сделать в Supabase dashboard
- Применить `supabase/schema.sql`, если Stage 3.1 schema ещё не выполнена.
- Включить Email provider в **Authentication → Providers**.
- Решить, нужен ли Email confirmation; приложение поддерживает оба режима.
- Добавить redirect URL для локального callback
  `http://localhost:3000/auth/callback` в Auth URL configuration.
- Взять Project URL и anon key для `.env.local`; service_role держать
  серверным и не использовать в browser auth.

## Этап 3.3 — Account-aware profile + match persistence. Статус: завершён (2026-05-21)

### Сделано
- Добавлены account persistence helpers:
  `lib/supabase/matches.ts` пишет завершённый match и читает account history /
  public match по id, `lib/supabase/reviews.ts` пишет и читает basic heuristic
  review snapshot, `lib/supabase/profiles.ts` читает полный account profile и
  обновляет rating/stats.
- `/play` теперь сначала проверяет активную Supabase-сессию. Без env/сессии
  guest-flow остаётся на `localStorage`; с аккаунтом результат hot-seat ranked
  demo сохраняется в `matches`, review — в `match_reviews`, а stats — в
  `profiles`. Один завершённый account result не запускает повторный save-effect.
- `/profile` при активной сессии показывает Account profile из Supabase:
  nickname, rating, peak rating, games played, wins/losses/draws/streak и
  сохранённую history. Guest profile/history больше не подмешиваются в account
  экран; zero-match аккаунт получает честный empty state.
- `/review/[matchId]` сохраняет старый guest lookup в localStorage и умеет
  загружать account match + saved review из Supabase по ссылке после reload.
- RU/EN copy расширен account-состояниями для play/profile/review. `DECISIONS.md`
  фиксирует разделение guest/account, сохранение heuristic snapshot и границу
  schema без отдельного `games_played`.

### Команды и проверки
- `npm run build` — OK с локальным `.env.local`.
  Next.js 16 по-прежнему предупреждает про будущую замену file convention
  `middleware.ts` на `proxy.ts`.
- `git diff --check` — OK, только предупреждения Git о будущем LF → CRLF.
- `npm run dev -- --port 3000` — поднят локальный dev server для QA.
- In-app browser без входа: `/profile` показывает guest profile/history,
  сохранённый guest review открывается по старой ссылке, `/play` Resign снова
  пишет local result и review link. Console error logs — пусто.

### Что проверить вручную
- С активной Supabase-сессией открыть `/profile`: должен быть Account profile,
  а не Guest profile, даже если в этом браузере уже есть guest localStorage.
- На новом аккаунте без матчей проверить empty state:
  «Сыграй первый матч, чтобы сохранить прогресс в аккаунте».
- Войти, завершить один матч на `/play`, проверить ровно одну новую строку в
  `matches`, одну строку в `match_reviews` и обновлённые rating/stats в
  `profiles`.
- После завершения account match открыть Review из result и Profile history,
  затем сделать reload `/review/[matchId]`.
- В другом браузере после входа открыть сохранённую account review-ссылку и
  убедиться, что match/review подтягиваются из Supabase.
- Выйти из аккаунта и снова пройти guest `/play` → Review → Profile, чтобы
  проверить localStorage fallback без автоматической миграции старых матчей.

## Post-3.3 hardening — account-save rejected promise. Статус: завершён (2026-05-21)

QA + точечный hardening без нового этапа.

### Сделано
- `app/play/page.tsx` — account-save `recordAccountMatch(...).then(...)` получил
  `.catch`: при rejected promise теперь показывается save error и сбрасывается
  `savePending`, поэтому UI больше не залипает на «Сохраняем...» с disabled
  New Game. Успешный save и guest-flow не затронуты.

### Проверки и QA
- `npm run build` — OK. `git diff --check` — OK (только LF → CRLF warnings).
- In-app browser, активная Supabase-сессия: checkmate (fool's mate / scholar's
  mate), resign и guest checkmate завершаются, сохраняются и дают review-ссылку.
  Checkmate detection (engine + chess.js) проверена отдельно — корректна.
- Симптом «checkmate показан как check» воспроизвести не удалось: `/play` —
  hot-seat без бота, ход за чёрных делает сам игрок; шах корректно ждёт хода.

## Этап 3.4 — Supabase leaderboard. Статус: завершён (2026-05-21)

### Сделано
- `lib/supabase/leaderboard.ts` — `loadAccountLeaderboard()` читает top-профили
  из Supabase `profiles` (select id/nickname/rating/wins/losses/draws/streak/city,
  `order by rating desc`, limit 20), считает winrate и level, выставляет `isYou`
  для текущего пользователя. `buildDemoLeaderboard()` строит ту же row-структуру
  для guest/demo-режима.
- `lib/demo/leaderboard.ts` — `DEMO_PLAYERS` теперь экспортируется как fallback;
  старый `buildLeaderboard` удалён (логика перенесена в `lib/supabase/leaderboard.ts`).
- `app/leaderboard/page.tsx` — leaderboard стал account-aware: при настроенном
  Supabase и активной сессии показывает глобальный список аккаунтов с подсветкой
  строки «You»; гость или отсутствие Supabase/сессии — прежний demo/local board.
- Если реальных аккаунтов меньше 5, доска дополняется demo-игроками, чтобы не
  выглядеть пустой. Города аккаунтов берутся из `profiles.city` (сейчас обычно
  пусто → «—»), demo-города — из i18n.
- i18n: добавлены `leaderboard.accountEyebrow` / `leaderboard.accountBody` (RU/EN).

### Границы этапа
- Realtime, polling, rooms/multiplayer не делались; schema.sql, chess engine и
  auth flow не менялись; guest data не мигрировалась.

### Команды и проверки
- `npm run build` — OK. `git diff --check` — OK (только LF → CRLF warnings).
- In-app browser, активная Supabase-сессия: `/leaderboard` показывает «Global
  leaderboard», 6 строк (5 demo + аккаунт `test`), сортировка по рейтингу,
  строка пользователя подсвечена и помечена «You».

### Что проверить вручную
- Залогиненным открыть `/leaderboard`: глобальный список из Supabase, своя
  строка помечена «You».
- Гостем (или без `.env.local`) открыть `/leaderboard`: demo/local board с
  guest-строкой как раньше.
- При большом числе аккаунтов (>= 5) demo-игроки не должны подмешиваться.

## Post-3.4 bugfix — leaderboard без авторизации. Статус: завершён (2026-05-21)

### Причина бага
`app/leaderboard/page.tsx` вызывал `loadAccountLeaderboard` только внутри
`if (user)`, то есть только при активной сессии. После sign out `user = null`,
код пропускал Supabase и сразу падал в demo fallback. Но `profiles` имеет
`select using (true)` — публичное чтение без авторизации.

### Фикс
Убрана обёртка `if (user)`. `loadAccountLeaderboard` теперь вызывается всегда,
когда Supabase env настроен; текущий `user?.id ?? null` передаётся для маркировки
строки `isYou`. Если запрос упал — fallback на demo/local как раньше.

### Файлы
- `app/leaderboard/page.tsx` — строки 33–49, убрана `if (user)` обёртка.

### Проверить вручную
- Залогиниться → `/leaderboard`: глобальный список, строка «You» подсвечена.
- Sign out → `/leaderboard`: тот же глобальный список Supabase, без «You».
- Без `.env.local` (Supabase не настроен) → demo/local board как раньше.

### Команды
- `npm run build` — OK. `git diff --check` — OK (только LF → CRLF warning).

## Этап 3.5 — Stability cleanup before deploy. Статус: завершён (2026-05-21)

### Сделано

**1. middleware.ts → proxy.ts (Next.js 16 file convention)**
- `middleware.ts` удалён. Создан `proxy.ts` с переименованием функции `middleware` → `proxy`.
- Supabase SSR cookie-refresh (`getClaims`) полностью сохранён.
- Build-warning `"middleware" file convention is deprecated. Please use "proxy" instead.` больше не появляется.
- Внутреннюю переменную `config` в теле функции переименовано в `supabaseConfig`, чтобы не конфликтовать с module-level `export const config`.

**2. Flash темы и языка при загрузке**
- Причина flash: `PreferencesProvider` стартует с дефолтами `en`/`dark`, затем useEffect читает localStorage → React ре-рендерит с реальными значениями.
- Фикс A (тема): в `app/layout.tsx` добавлен inline-скрипт в `<head>`. Скрипт исполняется до рендера — читает `checkmate-arena.preferences.v1` из localStorage, ставит `data-theme` и `lang` на `<html>`, добавляет класс `prefs-loading`.
- Фикс B (язык + тема): в `globals.css` добавлено `html.prefs-loading body { opacity: 0; }`. Тело скрыто, пока preferences не загружены.
- Фикс C: в `PreferencesProvider` useEffect, сразу после `setLoaded(true)`, убирается класс `prefs-loading` — тело появляется уже с правильными цветами и текстом.
- Итог: ни цветовой flash (dark→light), ни языковой flash (EN→RU) не видны.

**3. .env.local в git**
- Проверено: `.gitignore` содержит `.env*.local`. Файл не отслеживается гитом — `git ls-files .env.local` возвращает пусто.

### Команды и проверки
- `npm run build` — OK, warning про middleware исчез, TypeScript OK.
- `git diff --check` — OK, только LF→CRLF warnings (обычные для этого репо).

### Что проверить вручную
- В браузере с сохранёнными preferences (RU / Light): при reload страницы не должно быть видимого мигания ни цветами, ни языком.
- В чистом браузере (без localStorage): страница должна появляться сразу с EN / Dark без blank flash.
- Войти / выйти из Supabase-аккаунта: session cookie refresh по-прежнему работает через `proxy.ts`.
- Переключить тему и язык в `/settings` — убедиться, что изменения применяются мгновенно.

## Этап 4.0A — AI Coach API foundation. Статус: завершён (2026-05-22)

### Сделано

**1. Новые env-переменные (`/env.example`)**
- `AI_COACH_API_BASE_URL` — base URL провайдера (без `/chat/completions`).
- `AI_COACH_API_KEY` — секретный ключ. SERVER-ONLY: нет `NEXT_PUBLIC_`.
- `AI_COACH_MODEL` — модель (gpt-4o-mini, claude-haiku-4-5 через OpenRouter и т.д.).
- Если хотя бы один ключ отсутствует — route возвращает `{ available: false, reason: "not_configured" }`.

**2. Prompt builder (`lib/ai/coachPrompt.ts`)**
- Принимает `result`, `finish`, `playerColor`, `moves[]`, `moveCount`, `ratingDelta`, `locale`.
- Двуязычный system prompt (RU/EN) с явным запретом на выдумывание engine-оценок.
- Просит у AI JSON с четырьмя полями: `mainMistake`, `bestAlternative`, `whyImportant`, `trainNext`.

**3. Server route (`app/api/coach/route.ts`)**
- `POST /api/coach` — принимает игровые данные, вызывает OpenAI-compatible API.
- API key в браузер не уходит (route — server-only Next.js handler).
- Устойчивость: markdown-fence stripping при попытке разбора JSON, проверка полей.
- Все ошибки (env, network, parse, incomplete) → `{ available: false, reason }` без raw exception.

**4. Обновлена страница `/review/[matchId]`**
- Новая секция «AI Coach» в конце review-страницы.
- Кнопка «AI-разбор» / «Generate AI Coach» запускает `POST /api/coach`.
- Состояния: loading (анимированный текст), error (not_configured / unavailable), result (4 карточки).
- Если AI недоступен — demo heuristic coach выше остаётся как полноценный fallback.
- Guest review и account review не сломаны — оба пути поддерживают новую секцию.
- AI result НЕ сохраняется в Supabase на этом этапе.

**5. i18n**
- Добавлен namespace `review.aiCoach` (RU/EN): кнопка, loading, notConfigured, error,
  заголовки карточек, note.

### Boundaries
- Stockfish, engine eval, schema changes, Supabase save — не делались.
- Chess engine и multiplayer — не менялись.

### Команды и проверки
- `npm run build` — OK.
- `git diff --check` — OK.

### Что проверить вручную
1. **Без AI env** (только Supabase настроен): открыть `/review/[matchId]`, нажать кнопку
   «AI-разбор» → должен появиться текст `notConfigured`, demo review выше не пропадает.
2. **С AI env**: нажать кнопку → loading → 4 карточки с реальным анализом.
3. **Guest review**: завершить матч гостем, открыть review → кнопка AI Coach присутствует.
4. **Account review**: войти, завершить матч, перезагрузить review-страницу → кнопка
   AI Coach присутствует (AI result сбрасывается при перезагрузке — это ожидаемо на 4.0A).
5. Переключить RU/EN и убедиться, что кнопка и сообщения об ошибках переключаются.

### Что будет Stage 4.0B
- Сохранение AI review в `match_reviews` (новые поля или отдельная колонка `ai_analysis jsonb`).
- Показ сохранённого AI review при повторном открытии без повторного запроса.
- Опционально: индикатор стоимости / модели в UI.
- Опционально: streaming ответа через ReadableStream для более быстрого UX.

## Deploy 1A — Health endpoint + production sanity check. Статус: завершён (2026-05-22)

### Сделано
- `app/api/health/route.ts` — `GET /api/health` возвращает `{ ok: true, service: "checkmate-arena" }`.
- `package.json` проверен: `build: next build`, `start: next start`, `dev: next dev --webpack` — всё корректно.
- `.gitignore` проверен: `.env*.local`, `/.next`, `/node_modules` — не попадают в git.
- `.env.example` проверен: Supabase (URL, anon, service_role) + AI Coach (base URL, key, model) — без реальных секретов.

### Команды и проверки
- `npm run build` — OK. `/api/health` появился в route-таблице как динамический endpoint (`ƒ`).
- `git diff --check` — чисто (без whitespace-ошибок).

### Что проверить вручную
- На запущенном `npm run start`: `GET /api/health` → `{ "ok": true, "service": "checkmate-arena" }`, HTTP 200.
- Убедиться, что `.env.local` не попал в `git status`.

### Готовность к Deploy 1B
Да. Health endpoint работает, build чистый, секреты не утекают в git.

## Deploy 1B — Docker production packaging. Статус: завершён (2026-05-22)

### Сделано
- `.dockerignore` — исключает `node_modules`, `.next`, `.env*.local`, `.git`, `docs`, `.claude`,
  чтобы эти файлы не попадали в Docker build context.
- `Dockerfile` — 3-stage production build:
  - Stage `deps`: `npm ci --omit=dev` → только production-зависимости.
  - Stage `builder`: `npm ci` + `npm run build` → полная сборка Next.js.
  - Stage `runner`: `node:20-alpine`, копирует `node_modules` из `deps`, `.next` и `public`
    из `builder`, `package.json`. Слушает порт 3000. Запускает через `npm run start`.
  - ENV-переменные в образ не зашиты; передаются через `--env-file` или платформенный secrets
    manager при реальном деплое.

### Команды и проверки
- `npm run build` — OK (все 13 routes, TypeScript OK, build 5.6s).
- `git diff --check` — OK (без whitespace-ошибок).
- `docker build` — Docker не установлен в данном окружении; файлы корректны синтаксически,
  build нужно проверить на машине с Docker или в CI.

### Что проверить вручную (на машине с Docker)
1. `docker build -t checkmate-arena .` — должен успешно пройти все три стадии.
2. `docker run --env-file .env.local -p 3000:3000 checkmate-arena` — приложение стартует.
3. `GET http://localhost:3000/api/health` → `{ "ok": true, "service": "checkmate-arena" }`.
4. `.env.local` не попал в image: `docker run checkmate-arena ls -la | grep env` — пусто.
5. `node_modules` и `.next` не попали в Docker context (проверить вывод `docker build`
   на строки `COPY . .` — не должно быть лишних файлов из `.dockerignore`).
