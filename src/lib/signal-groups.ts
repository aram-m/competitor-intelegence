import type { Signal } from "@/types";
import { PRIORITY_ORDER } from "@/types";

export interface CompanySignalGroup {
  competitorId: string;
  competitorName: string;
  signals: Signal[];
}

function signalDate(signal: Signal): number {
  const date = signal.publishedAt?.toDate?.() ?? signal.createdAt?.toDate?.();
  return date ? date.getTime() : 0;
}

export function groupSignalsByCompany(
  signals: Signal[],
): CompanySignalGroup[] {
  const grouped = new Map<string, CompanySignalGroup>();

  for (const signal of signals) {
    const existing = grouped.get(signal.competitorId);
    if (existing) {
      existing.signals.push(signal);
      continue;
    }

    grouped.set(signal.competitorId, {
      competitorId: signal.competitorId,
      competitorName: signal.competitorName,
      signals: [signal],
    });
  }

  return [...grouped.values()]
    .sort((a, b) => a.competitorName.localeCompare(b.competitorName))
    .map((group) => ({
      ...group,
      signals: [...group.signals].sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return signalDate(b) - signalDate(a);
      }),
    }));
}
