import type { MatchResult } from "@/lib/demo/progress";
import type { Locale } from "@/lib/i18n/translations";
import type { Color } from "chess.js";

export type MoveQuestionInput = {
  locale: Locale;
  sanMoves: string[];
  selectedPly: number;
  selectedSan: string | null;
  selectedFen: string;
  existingAnalysis?: { mainMistake: string; trainNext: string } | null;
  question: string;
  result: MatchResult;
  playerColor: Color;
  moveCount: number;
};

export type MoveQuestionMessages = {
  system: string;
  user: string;
};

const JSON_SCHEMA_EN = `Respond with a valid JSON object using these keys:
{
  "answer": "1-3 sentences directly answering the user's question about this position",
  "betterPlan": "Concrete improvement or best move for this specific moment (use SAN notation where applicable)",
  "trainingTip": "One habit to work on based on this position"
}

Rules:
- Answer the specific question asked, not a generic analysis
- Do not claim engine precision or invent centipawn values
- Be concrete about this position, not the game in general
- Return only the JSON object, no markdown fences, no preamble`;

const JSON_SCHEMA_RU = `Ответь валидным JSON-объектом с этими ключами:
{
  "answer": "1-3 предложения, прямо отвечающих на вопрос пользователя про эту позицию",
  "betterPlan": "Конкретное улучшение или лучший ход в этот момент (используй SAN-нотацию, если применимо)",
  "trainingTip": "Одна привычка для тренировки на основе этой позиции"
}

Правила:
- Отвечай на конкретный заданный вопрос, а не делай общий анализ
- Не утверждай engine-точность и не придумывай оценки в центипешках
- Будь конкретным про эту позицию, а не про партию в целом
- Возвращай только JSON-объект, без markdown и преамбулы`;

export function buildMoveQuestionPrompt(
  input: MoveQuestionInput,
): MoveQuestionMessages {
  const {
    locale,
    sanMoves,
    selectedPly,
    selectedSan,
    selectedFen,
    existingAnalysis,
    question,
    result,
    playerColor,
    moveCount,
  } = input;
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

  const sanHistory =
    sanMoves.length > 0
      ? sanMoves.join(" ")
      : isRu
        ? "(ходов нет)"
        : "(no moves recorded)";

  const moveLabel = selectedSan
    ? isRu
      ? `полуход ${selectedPly}: ${selectedSan}`
      : `half-move ${selectedPly}: ${selectedSan}`
    : isRu
      ? "стартовая позиция"
      : "start position";

  const fenLine = selectedFen
    ? isRu
      ? `FEN позиции: ${selectedFen}`
      : `Position FEN: ${selectedFen}`
    : "";

  const analysisContext =
    existingAnalysis
      ? isRu
        ? `Общий AI-анализ партии: главная ошибка — ${existingAnalysis.mainMistake}; что тренировать — ${existingAnalysis.trainNext}`
        : `Overall AI game analysis: key mistake — ${existingAnalysis.mainMistake}; training focus — ${existingAnalysis.trainNext}`
      : "";

  const system = isRu
    ? `Ты шахматный тренер. Отвечай на вопросы о конкретных позициях кратко и практично на русском языке. Не выдумывай engine-оценки.\n\n${JSON_SCHEMA_RU}`
    : `You are a chess coach. Answer questions about specific chess positions concisely and practically in English. Do not fabricate engine evaluations.\n\n${JSON_SCHEMA_EN}`;

  const user = isRu
    ? `Партия: ${resultLabel} за ${colorLabel}. Всего ходов: ${moveCount}.
SAN-история: ${sanHistory}
Выбранная позиция: ${moveLabel}
${fenLine}
${analysisContext}

Вопрос игрока: ${question}

Дай короткий ответ в формате JSON.`
    : `Game: ${resultLabel} playing as ${colorLabel}. Total moves: ${moveCount}.
SAN history: ${sanHistory}
Selected position: ${moveLabel}
${fenLine}
${analysisContext}

Player's question: ${question}

Provide a concise answer as JSON.`;

  return { system, user };
}
