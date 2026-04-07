import type { Signal, Priority, SignalType, SourceType } from "@/types";

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export interface Filters {
  companies: string[];
  signalTypes: SignalType[];
  sourceTypes: SourceType[];
  priorities: Priority[];
}

export const EMPTY_FILTERS: Filters = {
  companies: [],
  signalTypes: [],
  sourceTypes: [],
  priorities: [],
};

export function getRecentSignalWindowStart(now = new Date()): Date {
  return new Date(now.getTime() - THIRTY_DAYS_IN_MS);
}

export function applySignalFilters(
  signals: Signal[],
  filters: Filters,
  now = new Date(),
): Signal[] {
  const recentWindowStart = getRecentSignalWindowStart(now);

  return signals.filter((signal) => {
    const signalDate = signal.publishedAt?.toDate?.() ?? signal.createdAt?.toDate?.();
    if (!signalDate || signalDate < recentWindowStart) {
      return false;
    }

    if (
      filters.companies.length > 0 &&
      !filters.companies.includes(signal.competitorId)
    ) {
      return false;
    }
    if (
      filters.signalTypes.length > 0 &&
      !filters.signalTypes.includes(signal.signalType)
    ) {
      return false;
    }
    if (
      filters.sourceTypes.length > 0 &&
      !filters.sourceTypes.includes(signal.sourceType)
    ) {
      return false;
    }
    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(signal.priority)
    ) {
      return false;
    }
    return true;
  });
}
