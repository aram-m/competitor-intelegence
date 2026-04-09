import type {
  AlertChannelResult,
  AlertCompany,
  AlertPayload,
  AlertStatus,
  CompanySummary,
  Signal,
} from "../types";

function getSignalDate(signal: Signal): Date {
  return signal.publishedAt?.toDate?.() ?? signal.createdAt?.toDate?.() ?? new Date(0);
}

function compareSignals(a: Signal, b: Signal): number {
  return getSignalDate(b).getTime() - getSignalDate(a).getTime();
}

function buildFallbackBrief(
  competitorName: string,
  signals: Signal[],
): AlertCompany["brief"] {
  return {
    summary: `${competitorName} has ${signals.length} new signal${signals.length === 1 ? "" : "s"} in the latest crawl.`,
    whyItMatters: "New competitor activity was detected and should be reviewed.",
    watchNext: "Monitor follow-on changes from the same company in the next crawl.",
    generatedBy: "fallback",
    strongestPriority: signals[0]?.priority ?? "low",
  };
}

export function buildAlertPayload({
  alertId,
  generatedAt,
  signals,
  summaries,
}: {
  alertId: string;
  generatedAt: Date;
  signals: Signal[];
  summaries: Pick<
    CompanySummary,
    | "competitorId"
    | "competitorName"
    | "summary"
    | "whyItMatters"
    | "watchNext"
    | "generatedBy"
    | "strongestPriority"
  >[];
}): AlertPayload {
  const summaryByCompetitorId = new Map(
    summaries.map((summary) => [summary.competitorId, summary]),
  );
  const groups = new Map<string, Signal[]>();

  for (const signal of [...signals].sort(compareSignals)) {
    const existing = groups.get(signal.competitorId) ?? [];
    existing.push(signal);
    groups.set(signal.competitorId, existing);
  }

  const companies: AlertCompany[] = [...groups.entries()].map(
    ([competitorId, companySignals]) => {
      const fallbackName = companySignals[0]?.competitorName ?? competitorId;
      const summary = summaryByCompetitorId.get(competitorId);

      return {
        competitorId,
        competitorName: summary?.competitorName ?? fallbackName,
        brief: summary
          ? {
              summary: summary.summary,
              whyItMatters: summary.whyItMatters,
              watchNext: summary.watchNext,
              generatedBy: summary.generatedBy,
              strongestPriority: summary.strongestPriority,
            }
          : buildFallbackBrief(fallbackName, companySignals),
        signals: companySignals,
      };
    },
  );

  return {
    alertId,
    generatedAt,
    signalIds: signals.map((signal) => signal.id),
    competitorIds: companies.map((company) => company.competitorId),
    companies,
  };
}

export function resolveAlertStatus(
  results: AlertChannelResult[],
): AlertStatus {
  if (results.length === 0) {
    return "failed";
  }

  const sentCount = results.filter((result) => result.status === "sent").length;
  if (sentCount === 0) {
    return "failed";
  }

  if (sentCount === results.length) {
    return "sent";
  }

  return "partial";
}
