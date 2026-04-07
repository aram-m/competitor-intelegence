import {
  PRIORITY_ORDER,
  type CompanyBriefGeneration,
  type Priority,
  type Signal,
  type SourceType,
  type StoredCompanySummary,
} from "@/types";
import type { CompanySignalGroup } from "@/lib/signal-groups";
import { getSourceTypeLabel } from "@/lib/source-presentation";

const SOURCE_TYPE_ORDER: SourceType[] = ["blog", "github", "hiring", "rss"];
const FEATURED_SIGNAL_LIMIT = 3;

export interface CompanySummary {
  competitorId: string;
  competitorName: string;
  recentCount: number;
  strongestPriority: Priority;
  latestSignalAt: Date | null;
  sourceTypes: SourceType[];
  featuredSignals: Signal[];
  brief: {
    generatedBy: CompanyBriefGeneration;
    summary: string;
    whyItMatters: string;
    watchNext: string;
  };
}

function getSignalDate(signal: Signal): Date | null {
  return signal.publishedAt?.toDate?.() ?? signal.createdAt?.toDate?.() ?? null;
}

function getStrongestPriority(signals: Signal[]): Priority {
  return signals.reduce<Priority>((current, signal) => {
    return PRIORITY_ORDER[signal.priority] < PRIORITY_ORDER[current]
      ? signal.priority
      : current;
  }, "low");
}

function getLatestSignal(signals: Signal[]): Signal | null {
  return [...signals].sort((a, b) => {
    return (getSignalDate(b)?.getTime() ?? 0) - (getSignalDate(a)?.getTime() ?? 0);
  })[0] ?? null;
}

function getSourceTypes(signals: Signal[]): SourceType[] {
  const unique = new Set(signals.map((signal) => signal.sourceType));

  return SOURCE_TYPE_ORDER.filter((sourceType) => unique.has(sourceType));
}

function joinSourceLabels(sourceTypes: SourceType[]): string {
  const labels = sourceTypes.map((sourceType) => getSourceTypeLabel(sourceType));

  if (labels.length <= 1) {
    return labels[0] ?? "recent sources";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

export function buildCompanySummary(
  group: CompanySignalGroup,
  _now = new Date(),
  storedSummary?: StoredCompanySummary,
): CompanySummary {
  const sourceTypes = getSourceTypes(group.signals);
  const latestSignal = getLatestSignal(group.signals);
  const strongestPriority = getStrongestPriority(group.signals);
  const recentCount = group.signals.length;
  const sourceLabel = joinSourceLabels(sourceTypes);
  const latestHeadline = latestSignal?.title ?? "No recent updates";
  const deterministicBrief = {
    generatedBy: "deterministic" as const,
    summary: `${recentCount} recent change${recentCount === 1 ? "" : "s"} across ${sourceLabel}. Latest: ${latestHeadline}.`,
    whyItMatters:
      "This competitor has enough recent movement to deserve a fast manual read of the linked evidence.",
    watchNext:
      "Watch whether the latest theme repeats across upcoming blog, GitHub, or hiring updates.",
  };

  return {
    competitorId: group.competitorId,
    competitorName: group.competitorName,
    recentCount,
    strongestPriority,
    latestSignalAt: latestSignal ? getSignalDate(latestSignal) : null,
    sourceTypes,
    featuredSignals: group.signals.slice(0, FEATURED_SIGNAL_LIMIT),
    brief: storedSummary
      ? {
          generatedBy: storedSummary.generatedBy,
          summary: storedSummary.summary,
          whyItMatters: storedSummary.whyItMatters,
          watchNext: storedSummary.watchNext,
        }
      : deterministicBrief,
  };
}
