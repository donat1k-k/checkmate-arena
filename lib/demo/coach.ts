import type { LocalMatch } from "@/lib/demo/progress";
import { translations, type Locale } from "@/lib/i18n/translations";

export type DemoCoachInsight = {
  title: string;
  body: string;
};

export type DemoCoachReview = {
  headline: string;
  summary: string;
  trainingAdvice: string;
  insights: DemoCoachInsight[];
};

function includesAnyMove(moves: string[], patterns: string[]): boolean {
  return moves.some((move) => patterns.some((pattern) => move.includes(pattern)));
}

export function buildDemoCoachReview(
  match: LocalMatch,
  locale: Locale = "en",
): DemoCoachReview {
  const copy = translations[locale];
  const coach = copy.review.coach;
  const checks = match.sanMoves.filter((move) => move.includes("+") || move.includes("#"));
  const captures = match.sanMoves.filter((move) => move.includes("x"));
  const lastMove = match.sanMoves.at(-1);
  const castled = includesAnyMove(match.sanMoves, ["O-O"]);
  const result = copy.match.result[match.result].toLocaleLowerCase(locale);
  const finish = copy.match.finish[match.finish].toLocaleLowerCase(locale);
  const insights: DemoCoachInsight[] = [
    {
      title: coach.resultSignalTitle,
      body: coach.resultSignalBody({
        result,
        finish,
        moveCount: match.moveCount,
      }),
    },
  ];

  if (checks.length > 0) {
    insights.push({
      title: coach.kingPressureTitle,
      body: coach.kingPressureBody({ count: checks.length }),
    });
  } else {
    insights.push({
      title: coach.quietPressureTitle,
      body: coach.quietPressureBody,
    });
  }

  if (captures.length >= 6) {
    insights.push({
      title: coach.tradeTitle,
      body: coach.tradeBody({ count: captures.length }),
    });
  } else if (castled) {
    insights.push({
      title: coach.kingRoutineTitle,
      body: coach.kingRoutineBody,
    });
  } else {
    insights.push({
      title: coach.developmentTitle,
      body: coach.developmentBody,
    });
  }

  const headline = coach.headline[match.result];
  const summary =
    match.result === "win"
      ? coach.winSummary({
          ratingDelta: match.ratingDelta,
          lastMove: lastMove ?? coach.sequenceFallback,
        })
      : match.result === "loss"
        ? coach.lossSummary({
            ratingDelta: match.ratingDelta,
            lastMove: lastMove ?? coach.sequenceFallback,
          })
        : coach.drawSummary;
  const trainingAdvice =
    match.moveCount <= 12
      ? coach.openingTraining
      : captures.length >= 6
        ? coach.tradeTraining
        : coach.candidateTraining;

  return { headline, summary, trainingAdvice, insights };
}
