import { formatResult, type LocalMatch } from "@/lib/demo/progress";

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

export function buildDemoCoachReview(match: LocalMatch): DemoCoachReview {
  const checks = match.sanMoves.filter((move) => move.includes("+") || move.includes("#"));
  const captures = match.sanMoves.filter((move) => move.includes("x"));
  const lastMove = match.sanMoves.at(-1);
  const castled = includesAnyMove(match.sanMoves, ["O-O"]);
  const result = formatResult(match.result).toLowerCase();
  const insights: DemoCoachInsight[] = [
    {
      title: "Result signal",
      body: `This local ranked demo ended as a ${result} by ${match.finish.replaceAll("-", " ")} after ${match.moveCount} full moves.`,
    },
  ];

  if (checks.length > 0) {
    insights.push({
      title: "King pressure",
      body: `${checks.length} checking move${checks.length === 1 ? "" : "s"} appeared in the move trace. Revisit the first check and ask whether development or king safety made it possible.`,
    });
  } else {
    insights.push({
      title: "Quiet pressure",
      body: "No checking move was recorded. In quieter games, compare your piece activity before trading or pushing pawns.",
    });
  }

  if (captures.length >= 6) {
    insights.push({
      title: "Trade discipline",
      body: `${captures.length} captures were recorded. Before the next exchange, name which side benefits from the resulting position.`,
    });
  } else if (castled) {
    insights.push({
      title: "King routine",
      body: "Castling showed up in the SAN history. Keep pairing king safety with a plan for your least active piece.",
    });
  } else {
    insights.push({
      title: "Development check",
      body: "No castling move was recorded. Use the opening review to spot when king safety and piece development slowed down.",
    });
  }

  const headline =
    match.result === "win"
      ? "Convert pressure with a repeatable plan"
      : match.result === "loss"
        ? "Stabilize before the next tactical turn"
        : "Turn balanced positions into clear choices";
  const summary =
    match.result === "win"
      ? `You gained ${match.ratingDelta} rating in the local loop. The final move ${lastMove ?? "sequence"} is a good checkpoint for how the attack or conversion finished.`
      : match.result === "loss"
        ? `The local loop recorded ${match.ratingDelta} rating. Review the phase just before ${lastMove ?? "the finish"} and look for the last moment your position still had a simple defensive choice.`
        : "The rating stayed level. Use the move trace to identify where the position stopped offering forcing progress.";
  const trainingAdvice =
    match.moveCount <= 12
      ? "Train opening habits: develop pieces, secure the king, then look for tactics."
      : captures.length >= 6
        ? "Train calculation around trades: compare threats before and after each exchange."
        : "Train candidate moves: list one improving move and one forcing move before committing.";

  return { headline, summary, trainingAdvice, insights };
}
