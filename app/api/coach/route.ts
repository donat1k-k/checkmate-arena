import { NextRequest, NextResponse } from "next/server";
import {
  buildCoachPrompt,
  type CoachPromptInput,
} from "@/lib/ai/coachPrompt";

export type CoachApiSuccess = {
  available: true;
  mainMistake: string;
  bestAlternative: string;
  whyImportant: string;
  trainNext: string;
};

export type CoachApiUnavailable = {
  available: false;
  reason: string;
};

export type CoachApiResponse = CoachApiSuccess | CoachApiUnavailable;

type OpenAiMessage = { role: string; content: string };
type OpenAiChoice = { message?: { content?: string } };
type OpenAiResponse = { choices?: OpenAiChoice[] };

type ParsedCoachJson = {
  mainMistake?: unknown;
  bestAlternative?: unknown;
  whyImportant?: unknown;
  trainNext?: unknown;
};

function unavailable(reason: string): NextResponse<CoachApiUnavailable> {
  return NextResponse.json({ available: false, reason });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<CoachApiResponse>> {
  const apiBase = process.env.AI_COACH_API_BASE_URL;
  const apiKey = process.env.AI_COACH_API_KEY;
  const model = process.env.AI_COACH_MODEL;

  if (!apiBase || !apiKey || !model) {
    return unavailable("not_configured");
  }

  let body: CoachPromptInput;
  try {
    body = (await req.json()) as CoachPromptInput;
  } catch {
    return NextResponse.json(
      { available: false, reason: "bad_request" },
      { status: 400 },
    );
  }

  const { system, user } = buildCoachPrompt(body);
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
      body: JSON.stringify({ model, messages, max_tokens: 600, temperature: 0.7 }),
    });

    if (!res.ok) {
      return unavailable("api_error");
    }

    const data = (await res.json()) as OpenAiResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return unavailable("empty_response");
    }
    raw = content;
  } catch {
    return unavailable("network_error");
  }

  let parsed: ParsedCoachJson;
  try {
    parsed = JSON.parse(raw) as ParsedCoachJson;
  } catch {
    // Some providers wrap JSON in markdown fences — strip and retry
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    try {
      parsed = JSON.parse(stripped) as ParsedCoachJson;
    } catch {
      return unavailable("parse_error");
    }
  }

  const { mainMistake, bestAlternative, whyImportant, trainNext } = parsed;
  if (
    typeof mainMistake !== "string" ||
    typeof bestAlternative !== "string" ||
    typeof whyImportant !== "string" ||
    typeof trainNext !== "string"
  ) {
    return unavailable("incomplete_response");
  }

  return NextResponse.json({
    available: true,
    mainMistake,
    bestAlternative,
    whyImportant,
    trainNext,
  });
}
