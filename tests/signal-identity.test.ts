import assert from "node:assert/strict";
import test from "node:test";

import * as signalIdentity from "../functions/lib/services/signal-identity.js";

const { buildSignalIdentity, normalizeSignalUrl } = signalIdentity;

test("normalizeSignalUrl strips fragments, tracking params, trailing slash, and trailing backslash", () => {
  assert.equal(
    normalizeSignalUrl(
      "https://stakefish.workable.com/jobs/2718848/?utm_source=x#section\\",
    ),
    "https://stakefish.workable.com/jobs/2718848",
  );
});

test("buildSignalIdentity deduplicates the same canonical url across source types", () => {
  assert.equal(
    buildSignalIdentity({
      competitorId: "gauntlet",
      sourceType: "hiring",
      url: "https://jobs.lever.co/gauntlet/e950c88c-eeff-4a7b-aba9-8f812f03c0c9?lever-source=site",
    }),
    buildSignalIdentity({
      competitorId: "gauntlet",
      sourceType: "rss",
      url: "https://jobs.lever.co/gauntlet/e950c88c-eeff-4a7b-aba9-8f812f03c0c9",
    }),
  );
});
