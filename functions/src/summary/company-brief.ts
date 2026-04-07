import { GoogleGenAI } from "@google/genai";
import { getRuntimeConfig } from "../config";
import type { CompanyBriefGeneration, Signal } from "../types";

const PROMPT_HEADER = `You are a competitive intelligence analyst for P2P.

Summarize the competitor's last 30 days of activity.

Return exactly three labeled lines and nothing else:
SUMMARY: <one concise paragraph>
WHY_IT_MATTERS: <one concise sentence>
WATCH_NEXT: <one concise sentence>`;

export interface CompanyBriefResult {
  summary: string;
  whyItMatters: string;
  watchNext: string;
  generatedBy: CompanyBriefGeneration;
}

function getClient() {
  const { geminiApiKey } = getRuntimeConfig();
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey: geminiApiKey });
}

function getSignalDate(signal: Signal): string {
  const date = signal.publishedAt?.toDate?.() ?? signal.createdAt?.toDate?.() ?? new Date();
  return date.toISOString().slice(0, 10);
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildCompanyBriefPrompt(
  competitorName: string,
  signals: Signal[],
): string {
  const evidence = signals
    .slice(0, 8)
    .map(
      (signal) =>
        `- [${signal.priority} / ${signal.sourceType}] ${getSignalDate(signal)} :: ${signal.title} :: ${truncate(signal.summary, 180)}`,
    )
    .join("\n");

  return `${PROMPT_HEADER}

Competitor: ${competitorName}
Recent signals:
${evidence}`;
}

export function buildFallbackCompanyBrief(
  competitorName: string,
  signals: Signal[],
): CompanyBriefResult {
  const latest = signals[0];
  const sourceTypes = [...new Set(signals.map((signal) => signal.sourceType))];
  const sourceLabel = sourceTypes.join(", ");

  return {
    generatedBy: "fallback",
    summary: `${competitorName} showed ${signals.length} recent changes across ${sourceLabel}. Latest signal: ${latest?.title ?? "recent activity detected"}.`,
    whyItMatters: "Recent activity suggests active product, code, or go-to-market movement worth monitoring closely.",
    watchNext: "Watch for follow-on launches, partnerships, or repeated execution in the same area.",
  };
}

function parseLabeledResponse(text: string): Omit<CompanyBriefResult, "generatedBy"> {
  const summary = text.match(/SUMMARY:\s*(.+?)(?=\n[A-Z_]+:|$)/is)?.[1]?.trim();
  const whyItMatters = text.match(/WHY_IT_MATTERS:\s*(.+?)(?=\n[A-Z_]+:|$)/is)?.[1]?.trim();
  const watchNext = text.match(/WATCH_NEXT:\s*(.+?)(?=\n[A-Z_]+:|$)/is)?.[1]?.trim();

  if (!summary || !whyItMatters || !watchNext) {
    throw new Error(`Gemini returned an incomplete company brief: ${text.slice(0, 240)}`);
  }

  return {
    summary,
    whyItMatters,
    watchNext,
  };
}

export async function generateCompanyBrief(
  competitorName: string,
  signals: Signal[],
): Promise<CompanyBriefResult> {
  const fallback = buildFallbackCompanyBrief(competitorName, signals);

  try {
    const client = getClient();
    const { geminiModel } = getRuntimeConfig();
    const result = await client.models.generateContent({
      model: geminiModel,
      contents: buildCompanyBriefPrompt(competitorName, signals),
      config: {
        temperature: 0.2,
        maxOutputTokens: 400,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const parsed = parseLabeledResponse(result.text || "");

    return {
      generatedBy: "ai",
      summary: parsed.summary,
      whyItMatters: parsed.whyItMatters,
      watchNext: parsed.watchNext,
    };
  } catch (error) {
    console.error(`Company brief generation failed for ${competitorName}:`, error);
    return fallback;
  }
}
