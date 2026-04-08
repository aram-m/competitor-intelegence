import type { Signal } from "@/types";

const FALLBACK_SUMMARY = "Unable to classify — review manually.";
const FALLBACK_RECOMMENDED_ACTION = "Review the source material directly.";

function normalize(value: string): string {
  return value.trim();
}

export function getSignalDisplaySummary(signal: Signal): string {
  const summary = normalize(signal.summary ?? "");
  return summary === FALLBACK_SUMMARY ? "" : summary;
}

export function getSignalDisplayRecommendedAction(signal: Signal): string {
  const recommendedAction = normalize(signal.recommendedAction ?? "");
  return recommendedAction === FALLBACK_RECOMMENDED_ACTION
    ? ""
    : recommendedAction;
}
