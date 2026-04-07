import { GoogleGenAI } from "@google/genai";
import type {
  ClassificationResult,
  RawCrawlItem,
  SignalType,
  Priority,
  SourceType,
} from "../types";
import { SIGNAL_TYPES, PRIORITIES } from "../types";
import { getRuntimeConfig } from "../config";

const JSON_SCHEMA = {
  type: "object",
  properties: {
    signalType: {
      type: "string",
      enum: SIGNAL_TYPES,
    },
    priority: {
      type: "string",
      enum: PRIORITIES,
    },
    summary: {
      type: "string",
    },
    recommendedAction: {
      type: "string",
    },
  },
  required: ["signalType", "priority", "summary", "recommendedAction"],
  propertyOrdering: [
    "signalType",
    "priority",
    "summary",
    "recommendedAction",
  ],
} as const;

const INSTRUCTIONS = `You are a competitive intelligence analyst for a Web3/DeFi infrastructure company (P2P).

Classify the following competitor signal. Respond with JSON only.

Signal types: ${SIGNAL_TYPES.join(", ")}
Priority levels: ${PRIORITIES.join(", ")}

Priority guidelines:
- critical: Direct competitive threat to P2P's core business (staking, validators, vaults). Needs same-day response.
- high: Significant move that could impact P2P's market position within weeks. Review within 24h.
- medium: Notable industry development. Worth tracking but not urgent.
- low: Routine update, minor change, or informational only.

Important:
- Hiring is a source type, not a signal type.
- If the source is a hiring page/job post, do not output "hiring" as signalType. Use "other" unless the content clearly fits another listed type.
- Return raw JSON only, with no markdown fences, no commentary, and no prose before or after the JSON.
- Keep "summary" to 18 words or fewer.
- Keep "recommendedAction" to 14 words or fewer.
`;

const FALLBACK: ClassificationResult = {
  signalType: "other",
  priority: "medium",
  summary: "Unable to classify — review manually.",
  recommendedAction: "Review the source material directly.",
};

function getClient() {
  const { geminiApiKey } = getRuntimeConfig();
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey: geminiApiKey });
}

function parseClassificationResponse(text: string): Record<string, string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(trimmed) as Record<string, string>;
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1]) as Record<string, string>;
    }

    const objectMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as Record<string, string>;
    }

    throw new Error(`Gemini returned non-JSON content: ${trimmed.slice(0, 200)}`);
  }
}

export async function classifySignal(
  item: RawCrawlItem,
  competitorName: string,
  sourceType: SourceType,
): Promise<ClassificationResult> {
  try {
    const client = getClient();
    const { geminiModel } = getRuntimeConfig();
    const prompt = `${INSTRUCTIONS}

Competitor: ${competitorName}
Source type: ${sourceType}
Title: ${item.title}
URL: ${item.url}
Content:
${item.content.slice(0, 2000)}`;

    const result = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 180,
        responseMimeType: "application/json",
        responseJsonSchema: JSON_SCHEMA,
      },
    });

    const parsed = parseClassificationResponse(result.text || "");

    // Validate enums defensively
    const signalType: SignalType = SIGNAL_TYPES.includes(
      parsed.signalType as SignalType,
    )
      ? (parsed.signalType as SignalType)
      : "other";

    const priority: Priority = PRIORITIES.includes(
      parsed.priority as Priority,
    )
      ? (parsed.priority as Priority)
      : "medium";

    return {
      signalType: sourceType === "hiring" ? "other" : signalType,
      priority,
      summary: parsed.summary || FALLBACK.summary,
      recommendedAction:
        parsed.recommendedAction || FALLBACK.recommendedAction,
    };
  } catch (error) {
    console.error("Classification failed:", error);
    return FALLBACK;
  }
}
