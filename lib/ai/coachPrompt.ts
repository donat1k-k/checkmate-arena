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

const JSON_SCHEMA_EN = `Respond with a valid JSON object using exactly these four keys:
{
  "mainMistake": "1-2 sentences: the key mistake or missed opportunity in this game",
  "bestAlternative": "The better move or plan (use SAN notation where applicable, e.g. Nf3, Rd1)",
  "whyImportant": "1-2 sentences: why this matters tactically or positionally",
  "trainNext": "One concrete habit to focus on in the next game"
}

Rules:
- Do not claim engine precision or invent centipawn values
- If the player won, focus on what nearly went wrong or what pattern to repeat
- Be specific to the moves provided, not generic
- Return only the JSON object, no markdown fences, no preamble`;

const JSON_SCHEMA_RU = `Ответь валидным JSON-объектом ровно с этими четырьмя ключами:
{
  "mainMistake": "1-2 предложения: главная ошибка или упущенная возможность в этой партии",
  "bestAlternative": "Лучший ход или план (используй SAN-нотацию, если применимо: Nf3, Rd1)",
  "whyImportant": "1-2 предложения: почему это важно тактически или позиционно",
  "trainNext": "Одна конкретная привычка для следующей партии"
}

Правила:
- Не утверждай engine-точность и не придумывай оценки в центипешках
- Если игрок выиграл — сосредоточься на том, что почти пошло не так, или на паттерне, который стоит повторить
- Будь конкретным по предоставленным ходам, не обобщай
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
