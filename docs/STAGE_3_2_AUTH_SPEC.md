# STAGE 3.2 — AUTH LAYER SPEC

ТЗ для Codex. Этап 3.2 = тонкий auth-слой поверх существующего
guest-режима. Schema (Stage 3.1) готова и не меняется.

Перед чтением этого spec прочитай: `CLAUDE.md`, `docs/HANDOFF.md`
(этапы 3.1), `docs/DECISIONS.md` (этап 3.1), `supabase/schema.sql`,
`docs/SUPABASE_SETUP.md`, `lib/demo/progress.ts`, `lib/i18n/translations.ts`.
Бриф (`docs/PROJECT_BRIEF.md`) — только разделы 2.26–2.28.

Стек: Next.js 16 App Router + TypeScript + Tailwind v4. Без shadcn.

## 1. Цель

Добавить email-аутентификацию на Supabase так, чтобы:
- играть гостем можно было сразу, без auth-стены (бриф 2.26);
- аккаунт нужен только для сохранения прогресса;
- после регистрации создавалась строка `public.profiles` (`id = auth.uid()`);
- сессия жила между перезагрузками и в SSR.

Перенос matches/reviews в БД, realtime, матчмейкинг — НЕ этот этап.

## 2. Границы

Делать:
- установить Supabase SDK;
- browser- и server-client;
- sign up / sign in / sign out;
- создание profile row после регистрации;
- минимальный auth UI в текущем стиле shell;
- session refresh (middleware) при использовании `@supabase/ssr`.

НЕ делать (см. раздел 10).

## 3. Файлы

Создать:
- `lib/supabase/client.ts` — browser-client (anon key).
- `lib/supabase/server.ts` — server-client (anon key + cookies).
- `lib/supabase/profiles.ts` — helper `ensureProfile()` (создание/чтение
  строки `profiles`).
- `middleware.ts` (корень) — обновление auth-сессии, если выбран
  `@supabase/ssr`.
- `app/auth/sign-in/page.tsx` — страница входа.
- `app/auth/sign-up/page.tsx` — страница регистрации.
- `app/auth/callback/route.ts` — обработка email-confirm callback (если
  email-confirmation включён).
- `components/auth/AuthForm.tsx` — общая форма email/password.
- `components/auth/AuthStatus.tsx` — индикатор сессии для shell nav.

Изменить:
- `components/layout/*` (shell/nav) — добавить ссылку Sign in / индикатор
  аккаунта + Sign out. Guest-нику не мешать.
- `lib/i18n/translations.ts` — добавить namespace `auth` (раздел 9).
- `docs/DECISIONS.md` — решения этапа 3.2.
- `docs/HANDOFF.md` — итог этапа 3.2.

`supabase/schema.sql` и `lib/chess/engine.ts` — НЕ трогать.
`lib/demo/progress.ts` — не ломать; правка допустима только если
понадобится точка интеграции guest→account (раздел 8), минимально.

## 4. Env-переменные

Уже описаны в `.env.example`. Нужны:
- `NEXT_PUBLIC_SUPABASE_URL` — browser + server.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser + server, защищён RLS.
- `SUPABASE_SERVICE_ROLE_KEY` — только server, обходит RLS. На этом этапе
  может не понадобиться: регистрация и создание profile идут под
  anon-ключом и RLS-политикой `profiles_insert_own`. Service-role не
  использовать без явной необходимости.

Локально: скопировать `.env.example` → `.env.local`, заполнить. Реальные
ключи в git НЕ коммитить (`.env*.local` уже в `.gitignore`).

## 5. Supabase client

- Установить `@supabase/supabase-js`. Для Next.js 16 App Router + SSR
  cookie-сессий — `@supabase/ssr`. Зафиксировать выбор пакетов в
  `DECISIONS.md`.
- `lib/supabase/client.ts` — `createBrowserClient` из URL + anon key.
- `lib/supabase/server.ts` — `createServerClient` с адаптером cookies
  Next.js (`cookies()` из `next/headers`).
- `middleware.ts` — рефреш сессии на каждый запрос, чтобы серверные
  компоненты видели актуальную сессию.
- service-role client не создавать, пока не понадобится.

## 6. Sign up / sign in / sign out

- Sign up: `supabase.auth.signUp({ email, password })`. Если в дашборде
  включён email-confirmation — показать «проверьте почту» и обработать
  `app/auth/callback/route.ts`. Решение про confirmation зафиксировать в
  `DECISIONS.md`.
- Sign in: `supabase.auth.signInWithPassword({ email, password })`.
- Sign out: `supabase.auth.signOut()`, затем редирект на Home.
- Ошибки маппить на существующие i18n-ключи `errors.*`
  (`invalidCredentials`, `sessionExpired`, `backendUnavailable`,
  `requestFailed`). Сырой текст ошибок Supabase в UI не показывать.
- UI вписать в текущий dark/light стиль shell, поддержать RU/EN.

## 7. Создание profile row

- После успешной регистрации (или первого входа) вызвать `ensureProfile()`.
- `ensureProfile()`: `select` строки `profiles` по `auth.uid()`; если нет —
  `insert` с `id = auth.uid()`, `nickname` (от пользователя или
  производный от email), дефолты рейтинга берёт schema.
- Триггеры НЕ использовать — решение этапа 3.1 (`DECISIONS.md`). Вставка
  только из кода.
- Insert проходит под RLS-политикой `profiles_insert_own`
  (`auth.uid() = id`).
- `nickname` обязан укладываться в констрейнт `profiles_nickname_len`
  (1–24 символа) — переиспользовать `sanitizeNickname()` из
  `lib/demo/progress.ts`.

## 8. Guest-flow остаётся рабочим

- Guest-режим (`lib/demo/progress.ts`, localStorage-ключи
  `checkmate-arena.guest-profile.v1`, `checkmate-arena.local-matches.v1`)
  продолжает работать без аккаунта.
- `/play` гостем без входа — доступен как сейчас. Auth-стену не ставить.
- Auth UI — отдельные страницы `/auth/*` плюс ссылка в nav. Существующие
  экраны (Home/Play/Profile/Leaderboard/Review/Pro) логику не меняют.
- Миграцию guest-прогресса в аккаунт на этом этапе только
  **спроектировать** в `DECISIONS.md` (когда и как `localStorage` →
  `profiles`/`matches`), полную реализацию НЕ делать.

## 9. i18n

В `lib/i18n/translations.ts` уже есть namespace `errors` — переиспользовать
для ошибок auth. Добавить новый namespace `auth` в обе локали (`en`, `ru`),
структура симметрична остальным namespace.

Предлагаемые ключи `auth`:
- `signIn`, `signUp`, `signOut`
- `signInTitle`, `signUpTitle`
- `emailLabel`, `passwordLabel`, `nicknameLabel`
- `signInCta`, `signUpCta`
- `haveAccount`, `noAccount`
- `account`, `signedInAs`
- `guestNotice` — «играй гостем или войди, чтобы сохранить прогресс»
- `emailConfirmSent` — если включён email-confirmation

Захардкоженных строк в auth UI не оставлять. SAN-нотацию и сохранённую
историю матчей перевод не затрагивает.

## 10. Запрещено

- Менять `supabase/schema.sql`, `lib/chess/engine.ts`.
- Realtime, матчмейкинг, перенос matches/reviews в БД.
- Ставить auth-стену перед `/play` или гостевым входом.
- Удалять/ломать guest localStorage-режим.
- Триггеры и сложные SQL-функции.
- Использовать `SUPABASE_SERVICE_ROLE_KEY` в browser-коде или префиксовать
  его `NEXT_PUBLIC_`.
- Коммитить реальные ключи / `.env.local`.
- `git commit` без отдельного подтверждения.

## 11. Критерии готовности

- Регистрация нового email создаёт сессию и строку `public.profiles`
  с `id = auth.uid()`.
- Sign in существующим аккаунтом восстанавливает сессию; sign out её
  завершает.
- Сессия переживает перезагрузку страницы и видна в серверных компонентах.
- Гость без аккаунта по-прежнему играет на `/play`; auth-стены нет.
- Auth UI работает на RU и EN, в dark и light теме, на mobile viewport.
- Ошибки показываются через i18n `errors.*`, без сырого текста Supabase.
- `npm run build` проходит.
- `DECISIONS.md` и `HANDOFF.md` обновлены.

## 12. Ручной QA checklist

- [ ] Sign up новым email → сессия активна, в Supabase Table Editor
      появилась строка `profiles`.
- [ ] Перезагрузить страницу → остаёшься залогинен.
- [ ] Sign out → сессия завершена, редирект на Home.
- [ ] Sign in тем же аккаунтом → вход успешен.
- [ ] Sign in с неверным паролем → ошибка `errors.invalidCredentials`.
- [ ] Без входа открыть `/play`, задать guest-ник, сыграть матч →
      guest-петля работает как раньше.
- [ ] Переключить RU/EN и dark/light на `/auth/sign-in` и
      `/auth/sign-up` → перевод и тема корректны.
- [ ] Mobile viewport (375px) на обеих auth-страницах → ничего не
      разваливается.
- [ ] Консоль браузера без ошибок.

## 13. Команды проверки

- `npm run build` — обязательно.
- `git diff --check` — перед завершением.
- Локальный dev: `npm run dev -- --port 3000` для ручного QA.
- `git commit` — НЕ делать, ждать подтверждения.
