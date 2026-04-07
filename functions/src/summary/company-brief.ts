import { GoogleGenAI } from "@google/genai";
import { getRuntimeConfig } from "../config";
import type { CompanyBriefGeneration, Signal } from "../types";
import {
  FALLBACK_RECOMMENDED_ACTION,
  FALLBACK_SUMMARY,
} from "../classifier/llm";

const PROMPT_HEADER = `You are a competitive intelligence analyst for P2P.

Summarize the competitor's last 30 days of activity using only the evidence provided.

Rules:
- Prioritize concrete launches, partnerships, product changes, distribution moves, technical releases, and repeated hiring themes.
- Do not infer strategy from empty, generic, or weak evidence.
- If evidence is limited, say so directly instead of speculating.
- Use the raw content excerpt and URL as primary evidence, not metadata alone.

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

const MAX_EVIDENCE_SIGNALS = 8;
const MAX_HIRING_SIGNALS = 3;

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

function isFallbackSignal(signal: Signal): boolean {
  return (
    signal.summary === FALLBACK_SUMMARY &&
    signal.recommendedAction === FALLBACK_RECOMMENDED_ACTION
  );
}

function dedupeSignalsByTitle(signals: Signal[]): Signal[] {
  const seen = new Set<string>();

  return signals.filter((signal) => {
    const key = signal.title.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getSignalEvidenceExcerpt(signal: Signal): string {
  const primaryContent = truncate(signal.rawContent || "", 240);
  if (primaryContent) {
    return primaryContent;
  }

  return truncate(signal.summary || "", 180);
}

export function getCompanyBriefEvidenceSignals(signals: Signal[]): Signal[] {
  const prioritizedSignals = signals.filter(
    (signal) => !isFallbackSignal(signal) || signal.sourceType === "hiring",
  );
  const candidates = prioritizedSignals.length > 0 ? prioritizedSignals : signals;
  const hiringSignals = dedupeSignalsByTitle(
    candidates.filter((signal) => signal.sourceType === "hiring"),
  ).slice(0, MAX_HIRING_SIGNALS);
  const selectedIds = new Set(hiringSignals.map((signal) => signal.id));
  const nonHiringSignals = candidates.filter(
    (signal) => !selectedIds.has(signal.id),
  );

  return [...hiringSignals, ...nonHiringSignals].slice(0, MAX_EVIDENCE_SIGNALS);
}

function buildHiringOverview(signals: Signal[]): string | null {
  const hiringSignals = dedupeSignalsByTitle(
    signals.filter((signal) => signal.sourceType === "hiring"),
  );

  if (hiringSignals.length === 0) {
    return null;
  }

  const titles = hiringSignals
    .slice(0, 5)
    .map((signal) => signal.title)
    .join(", ");

  return `Hiring overview: ${hiringSignals.length} concrete role${hiringSignals.length === 1 ? "" : "s"} including ${titles}.`;
}

export function buildCompanyBriefPrompt(
  competitorName: string,
  signals: Signal[],
): string {
  const evidenceSignals = getCompanyBriefEvidenceSignals(signals);
  const hiringOverview = buildHiringOverview(evidenceSignals);
  const evidence = evidenceSignals
    .map(
      (signal) =>
        [
          `- [${signal.priority} / ${signal.sourceType}] ${getSignalDate(signal)} :: ${signal.title}`,
          `  URL: ${signal.url}`,
          `  EVIDENCE: ${getSignalEvidenceExcerpt(signal)}`,
        ].join("\n"),
    )
    .join("\n");

  return `${PROMPT_HEADER}

Competitor: ${competitorName}
${hiringOverview ? `${hiringOverview}\n` : ""}Recent signals:
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
