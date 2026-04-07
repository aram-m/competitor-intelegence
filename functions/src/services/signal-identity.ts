export function normalizeSignalUrl(url: string): string {
  const sanitized = url.replace(/\\+$/, "");
  const parsed = new URL(sanitized);

  parsed.hash = "";
  parsed.search = "";

  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}

export function buildSignalIdentity({
  competitorId,
  url,
}: {
  competitorId: string;
  sourceType: string;
  url: string;
}): string {
  return `${competitorId}:${normalizeSignalUrl(url)}`;
}
