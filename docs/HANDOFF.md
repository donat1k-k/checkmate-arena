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

## Следующий этап — после отдельного подтверждения
- Перенести локальные profile / matches / reviews в Supabase persistence.
- Согласовать Auth и границу между guest progress и аккаунтом.
- Не начинать backend/realtime без новой задачи.
