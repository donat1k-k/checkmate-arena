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

## Следующий этап
Stage 3.4 — Supabase leaderboard/account ranking surface. В этом этапе
leaderboard по-прежнему остаётся demo/local, realtime и multiplayer rooms не
начинались.
