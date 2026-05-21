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
