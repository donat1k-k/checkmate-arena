# SUPABASE SETUP

Инструкция по подготовке Supabase-проекта для Checkmate Arena.

Этот этап (Stage 3.1) — только schema + документация. React-код Supabase
ещё **не использует**. Пакеты не установлены. Auth UI нет.

## 1. Создать проект

1. Зайти на https://supabase.com, создать новый проект.
2. Запомнить project ref (часть поддомена `https://<ref>.supabase.co`).
3. Регион — ближе к пользователям (СНГ → EU).
4. Сохранить database password в безопасном месте.

## 2. Применить schema

1. Открыть **SQL Editor** в дашборде проекта.
2. Скопировать содержимое `supabase/schema.sql`.
3. Выполнить (Run).
4. Проверить в **Table Editor**, что появились таблицы:
   `profiles`, `matches`, `match_reviews`.
5. Проверить, что у всех трёх включён RLS (значок Authentication / RLS enabled).

Schema создаёт:
- 3 таблицы;
- check-констрейнты на status / result / time_control / rating / accuracy;
- индексы для leaderboard, match history, review lookup;
- RLS-политики (см. раздел 5).

`schema.sql` написан без `DROP` — повторный запуск на чистом проекте
безопасен, но на проекте с данными запускать не нужно.

## 3. Ключи и переменные окружения

В дашборде: **Project Settings → API**.

| Значение | Куда | Назначение |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | адрес проекта |
| anon public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | клиентский ключ, защищён RLS |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` | серверный ключ, обходит RLS |

1. Скопировать `.env.example` → `.env.local`.
2. Подставить реальные значения.
3. `.env.local` уже в `.gitignore` — не коммитить.

**Важно:** `service_role` обходит RLS. Только серверный код (API routes).
Никогда не префиксовать его `NEXT_PUBLIC_` и не отдавать в браузер.

## 4. Auth (следующий этап)

Stage 3.1 auth не настраивает. На Stage 3.2 (Auth Layer) понадобится:

- **Authentication → Providers** — включить Email (и/или другие провайдеры);
- решить, как создаётся строка `profiles` после регистрации
  (клиент/сервер вставляет строку с `id = auth.uid()`; триггеры на MVP
  сознательно не используются — см. `docs/DECISIONS.md`);
- продумать миграцию guest-прогресса (`localStorage`) в аккаунт.

## 5. Модель RLS (кратко)

Полное обоснование — в `docs/DECISIONS.md`.

- **profiles** — публичное чтение (PII в таблице нет, email живёт в
  `auth.users`); insert/update только владельцем (`auth.uid() = id`).
- **matches** — чтение публичных матчей открыто (работают share-ссылки на
  review без авторизации); приватные матчи видят только участники;
  insert/update только участником матча.
- **match_reviews** — видимость наследуется от родительского матча;
  insert только участником матча.

Гостевой режим сейчас полностью в `localStorage` и Supabase не трогает,
поэтому анонимная запись в БД политиками не предусмотрена.

## 6. Что сделать вручную в дашборде (чек-лист)

- [ ] Создать проект Supabase.
- [ ] Выполнить `supabase/schema.sql` в SQL Editor.
- [ ] Убедиться, что RLS включён на трёх таблицах.
- [ ] Скопировать URL + anon + service_role ключи.
- [ ] Заполнить локальный `.env.local` (не коммитить).
- [ ] Auth-провайдеры — отложено до Stage 3.2.
