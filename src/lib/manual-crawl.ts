type TriggerCrawlEnv = Record<string, string | boolean | undefined>;

type ManualCrawlResponse = {
  error?: string;
  signalsStored?: number;
  status?: string;
};

type FetchResponse = {
  ok: boolean;
  json: () => Promise<ManualCrawlResponse>;
};

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
  },
) => Promise<FetchResponse>;

export const DEFAULT_TRIGGER_CRAWL_URL =
  "https://triggercrawl-nupvcpdxca-uc.a.run.app";

function readEnvValue(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function resolveTriggerCrawlUrl(env: TriggerCrawlEnv): string {
  return (
    readEnvValue(env.VITE_TRIGGER_CRAWL_URL) ?? DEFAULT_TRIGGER_CRAWL_URL
  );
}

export async function requestManualCrawl(
  fetchImpl: FetchLike,
  url: string,
): Promise<{ signalsStored: number }> {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Manual crawl failed.");
  }

  return {
    signalsStored: body.signalsStored ?? 0,
  };
}

export async function triggerManualCrawl(): Promise<{ signalsStored: number }> {
  return requestManualCrawl(
    (input, init) => fetch(input, init),
    resolveTriggerCrawlUrl(import.meta.env),
  );
}
