export interface CleanupSignalRecord {
  id: string;
  competitorId: string;
  sourceId: string;
  sourceType: string;
  url: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface CleanupSourceRecord {
  id: string;
  type: string;
  isActive: boolean;
  allowedUrlPattern?: string;
}

export interface SignalDeletion {
  id: string;
  reason: "stale_source" | "invalid_hiring_url" | "invalid_blog_url" | "invalid_url" | "duplicate";
}

const SOURCE_TYPE_PRIORITY: Record<string, number> = {
  github: 4,
  hiring: 3,
  blog: 2,
  rss: 1,
};

function normalizeSignalUrl(url: string): string {
  const sanitized = url.replace(/\\+$/, "");
  const parsed = new URL(sanitized);

  parsed.hash = "";
  parsed.search = "";

  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}

function buildSignalIdentity({
  competitorId,
  url,
}: {
  competitorId: string;
  sourceType: string;
  url: string;
}): string {
  return `${competitorId}:${normalizeSignalUrl(url)}`;
}

function isConcreteHiringUrl(url: string): boolean {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  const path = parsed.pathname;

  if (host === "job-boards.greenhouse.io" || host === "boards.greenhouse.io") {
    return /\/jobs\/\d+/.test(path);
  }

  if (host === "jobs.lever.co") {
    return /^\/[^/]+\/[0-9a-f-]+$/.test(path);
  }

  if (host.endsWith(".workable.com")) {
    return /^\/jobs\/\d+/.test(path);
  }

  if (host === "jobs.ashbyhq.com") {
    return /^\/[^/]+\/job\/[^/]+/.test(path);
  }

  if (host === "comeet.com" || host === "www.comeet.com") {
    return /^\/jobs\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(path);
  }

  return false;
}

function matchesAllowedUrlPattern(url: string, pattern?: string): boolean {
  if (!pattern) {
    return true;
  }

  return new RegExp(pattern).test(url);
}

function timestampScore(signal: CleanupSignalRecord): number {
  const value = signal.updatedAt || signal.createdAt;
  return value ? Date.parse(value) || 0 : 0;
}

function signalScore(signal: CleanupSignalRecord): number {
  return (
    (SOURCE_TYPE_PRIORITY[signal.sourceType] ?? 0) * 1_000_000_000_000 +
    timestampScore(signal)
  );
}

function isValidAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function planSignalCleanup({
  signals,
  sources,
}: {
  signals: CleanupSignalRecord[];
  sources: CleanupSourceRecord[];
}): SignalDeletion[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const candidates: CleanupSignalRecord[] = [];
  const deletions: SignalDeletion[] = [];

  for (const signal of signals) {
    const source = sourceById.get(signal.sourceId);

    if (!source || !source.isActive || source.type !== signal.sourceType) {
      deletions.push({ id: signal.id, reason: "stale_source" });
      continue;
    }

    if (!isValidAbsoluteUrl(signal.url)) {
      deletions.push({ id: signal.id, reason: "invalid_url" });
      continue;
    }

    if (signal.sourceType === "hiring" && !isConcreteHiringUrl(signal.url)) {
      deletions.push({ id: signal.id, reason: "invalid_hiring_url" });
      continue;
    }

    if (
      signal.sourceType === "blog" &&
      !matchesAllowedUrlPattern(signal.url, source.allowedUrlPattern)
    ) {
      deletions.push({ id: signal.id, reason: "invalid_blog_url" });
      continue;
    }

    candidates.push(signal);
  }

  const bestByIdentity = new Map<string, CleanupSignalRecord>();

  for (const signal of candidates) {
    const identity = buildSignalIdentity({
      competitorId: signal.competitorId,
      sourceType: signal.sourceType,
      url: signal.url,
    });
    const existing = bestByIdentity.get(identity);

    if (!existing) {
      bestByIdentity.set(identity, signal);
      continue;
    }

    if (signalScore(signal) > signalScore(existing)) {
      deletions.push({ id: existing.id, reason: "duplicate" });
      bestByIdentity.set(identity, signal);
    } else {
      deletions.push({ id: signal.id, reason: "duplicate" });
    }
  }

  return deletions;
}
