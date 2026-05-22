import type { MatchFinish, MatchResult } from "@/lib/demo/progress";
import type { Locale } from "@/lib/i18n/translations";
import type { Color } from "chess.js";

export type CoachPromptInput = {
  result: MatchResult;
  finish: MatchFinish;
  playerColor: Color;
  moves: string[];
  moveCount: number;
  ratingDelta: number;
  locale: Locale;
};

export type CoachPromptMessages = {
  system: string;
  user: string;
};

const JSON_SCHEMA_EN = `Respond with a valid JSON object using these keys:
{
  "mainMistake": "1-2 sentences: the key mistake or missed opportunity in this game",
  "bestAlternative": "The better move or plan (use SAN notation where applicable, e.g. Nf3, Rd1)",
  "whyImportant": "1-2 sentences: why this matters tactically or positionally",
  "trainNext": "One concrete habit to focus on in the next game",
  "keyMovePly": 0,
  "keyMoveSan": "e4",
  "keyMoveComment": "One sentence: why this half-move is the key turning point",
  "keyMoments": [
    {
      "ply": 14,
      "san": "Nf3",
      "type": "mistake",
      "title": "Short title (3-6 words)",
      "comment": "1-2 sentences explaining why this moment matters",
      "betterPlan": "The better move or plan at this moment (SAN if applicable)",
      "trainingTip": "One habit to train from this moment",
      "practiceQuestion": "A question to test understanding of this moment",
      "expectedAnswer": "The ideal answer to the practice question"
    }
  ]
}

Rules:
- Do not claim engine precision or invent centipawn values
- Do not mention Stockfish or engine evaluations
- If the player won, focus on what nearly went wrong or what pattern to repeat
- Be specific to the moves provided, not generic
- keyMovePly is the 0-based half-move index of the single most important moment; keyMoveSan is its SAN; keyMoveComment explains why — omit all three if the key moment is unclear
- keyMoments: identify 3-6 important moments only; do not comment every move
- Each keyMoment type must be one of: good, inaccuracy, mistake, critical, turning_point
- ply must be a valid 1-based half-move index from the game (1 = first half-move); omit moment if unsure of exact ply
- For mistakes/critical: include practiceQuestion and expectedAnswer when possible
- betterPlan, trainingTip, practiceQuestion, expectedAnswer are all optional
- Return only the JSON object, no markdown fences, no preamble`;

const JSON_SCHEMA_RU = `Ответь валидным JSON-объектом с этими ключами:
{
  "mainMistake": "1-2 предложения: главная ошибка или упущенная возможность в этой партии",
  "bestAlternative": "Лучший ход или план (используй SAN-нотацию, если применимо: Nf3, Rd1)",
  "whyImportant": "1-2 предложения: почему это важно тактически или позиционно",
  "trainNext": "Одна конкретная привычка для следующей партии",
  "keyMovePly": 0,
  "keyMoveSan": "e4",
  "keyMoveComment": "Одно предложение: почему этот полуход является ключевым поворотным моментом",
  "keyMoments": [
    {
      "ply": 14,
      "san": "Nf3",
      "type": "mistake",
      "title": "Короткий заголовок (3-6 слов)",
      "comment": "1-2 предложения, объясняющих почему этот момент важен",
      "betterPlan": "Лучший ход или план в этот момент (SAN если применимо)",
      "trainingTip": "Одна привычка для тренировки по этому моменту",
      "practiceQuestion": "Вопрос для проверки понимания этого момента",
      "expectedAnswer": "Идеальный ответ на тренировочный вопрос"
    }
  ]
}

Правила:
- Не утверждай engine-точность и не придумывай оценки в центипешках
- Не упоминай Stockfish и engine-оценки
- Если игрок выиграл — сосредоточься на том, что почти пошло не так, или на паттерне, который стоит повторить
- Будь конкретным по предоставленным ходам, не обобщай
- keyMovePly — 0-based индекс полухода самого важного момента; keyMoveSan — его SAN; keyMoveComment — объяснение почему; если ключевой момент неочевиден — опусти все три поля
- keyMoments: 3-6 важных моментов; не комментируй каждый ход
- Тип каждого keyMoment должен быть одним из: good, inaccuracy, mistake, critical, turning_point
- ply — 1-based индекс полухода в партии (1 = первый полуход); пропусти момент если не уверен в точном ply
- Для mistake/critical: желательно добавить practiceQuestion и expectedAnswer
- betterPlan, trainingTip, practiceQuestion, expectedAnswer — все опциональные
- Возвращай только JSON-объект, без markdown и преамбулы`;

export function buildCoachPrompt(input: CoachPromptInput): CoachPromptMessages {
  const { result, finish, playerColor, moves, moveCount, ratingDelta, locale } =
    input;
  const isRu = locale === "ru";

  const colorLabel = isRu
    ? playerColor === "w"
      ? "белыми"
      : "чёрными"
    : playerColor === "w"
      ? "White"
      : "Black";

  const resultLabel = isRu
    ? result === "win"
      ? "победа"
      : result === "loss"
        ? "поражение"
        : "ничья"
    : result;

  const finishLabel = isRu
    ? finish === "checkmate"
      ? "мат"
      : finish === "resignation"
        ? "сдача"
        : finish === "stalemate"
          ? "пат"
          : finish
    : finish;

  const sanHistory =
    moves.length > 0
      ? moves.join(" ")
      : isRu
        ? "(ходов нет)"
        : "(no moves recorded)";

  const lastMovesSlice = moves.slice(-12).join(" ");
  const ratingStr =
    ratingDelta > 0 ? `+${ratingDelta}` : String(ratingDelta);

  const system = isRu
    ? `Ты шахматный тренер. Анализируй партии кратко и практично на русском языке. Не выдумывай engine-оценки.\n\n${JSON_SCHEMA_RU}`
    : `You are a chess coach. Analyze games concisely and practically in English. Do not fabricate engine evaluations.\n\n${JSON_SCHEMA_EN}`;

  const user = isRu
    ? `Партия завершилась: ${resultLabel} (${finishLabel}) за ${colorLabel}.
Сыграно полных ходов: ${moveCount}.
Изменение рейтинга: ${ratingStr}.
SAN-история: ${sanHistory}
Последние 12 ходов: ${lastMovesSlice}

Дай короткий разбор в формате JSON.`
    : `Game result: ${resultLabel} (${finishLabel}) playing as ${colorLabel}.
Full moves played: ${moveCount}.
Rating change: ${ratingStr}.
SAN history: ${sanHistory}
Last 12 moves: ${lastMovesSlice}

Provide a concise analysis as JSON.`;

  return { system, user };
}
