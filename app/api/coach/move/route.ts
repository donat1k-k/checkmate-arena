import { NextRequest, NextResponse } from "next/server";
import {
  buildMoveQuestionPrompt,
  type MoveQuestionInput,
} from "@/lib/ai/moveQuestionPrompt";

export type MoveQuestionSuccess = {
  available: true;
  answer: string;
  betterPlan: string;
  trainingTip: string;
};

export type MoveQuestionUnavailable = {
  available: false;
  reason: string;
};

export type MoveQuestionResponse = MoveQuestionSuccess | MoveQuestionUnavailable;

type OpenAiMessage = { role: string; content: string };
type OpenAiChoice = { message?: { content?: string } };
type OpenAiApiResponse = { choices?: OpenAiChoice[] };

type ParsedMoveJson = {
  answer?: unknown;
  betterPlan?: unknown;
  trainingTip?: unknown;
};

function unavailable(reason: string): NextResponse<MoveQuestionUnavailable> {
  return NextResponse.json({ available: false, reason });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<MoveQuestionResponse>> {
  const apiBase = process.env.AI_COACH_API_BASE_URL;
  const apiKey = process.env.AI_COACH_API_KEY;
  const model = process.env.AI_COACH_MODEL;

  if (!apiBase || !apiKey || !model) {
    return unavailable("not_configured");
  }

  let body: MoveQuestionInput;
  try {
    body = (await req.json()) as MoveQuestionInput;
  } catch {
    return NextResponse.json(
      { available: false, reason: "bad_request" },
      { status: 400 },
    );
  }

  const question = body.question ?? "";
  if (!question.trim()) {
    return NextResponse.json(
      { available: false, reason: "empty_question" },
      { status: 400 },
    );
  }
  if (question.length > 500) {
    return NextResponse.json(
      { available: false, reason: "question_too_long" },
      { status: 400 },
    );
  }

  const { system, user } = buildMoveQuestionPrompt(body);
  const messages: OpenAiMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let raw: string;
  try {
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 400, temperature: 0.7 }),
    });

    if (!res.ok) {
      return unavailable("api_error");
    }

    const data = (await res.json()) as OpenAiApiResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return unavailable("empty_response");
    }
    raw = content;
  } catch {
    return unavailable("network_error");
  }

  let parsed: ParsedMoveJson;
  try {
    parsed = JSON.parse(raw) as ParsedMoveJson;
  } catch {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    try {
      parsed = JSON.parse(stripped) as ParsedMoveJson;
    } catch {
      return unavailable("parse_error");
    }
  }

  const { answer, betterPlan, trainingTip } = parsed;
  if (
    typeof answer !== "string" ||
    typeof betterPlan !== "string" ||
    typeof trainingTip !== "string"
  ) {
    return unavailable("incomplete_response");
  }

  return NextResponse.json({ available: true, answer, betterPlan, trainingTip });
}
