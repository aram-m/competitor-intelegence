import type { Signal, SourceType } from "@/types";

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  rss: "RSS",
  github: "GitHub",
  blog: "Blog",
  hiring: "Hiring",
};

const SOURCE_TYPE_ORDER: SourceType[] = ["blog", "github", "hiring", "rss"];

export function getSourceTypeLabel(sourceType: SourceType): string {
  return SOURCE_TYPE_LABELS[sourceType];
}

export function getAvailableSourceTypeOptions(signals: Signal[]) {
  const present = new Set(signals.map((signal) => signal.sourceType));

  return SOURCE_TYPE_ORDER.filter((sourceType) => present.has(sourceType)).map(
    (sourceType) => ({
      value: sourceType,
      label: getSourceTypeLabel(sourceType),
    }),
  );
}
