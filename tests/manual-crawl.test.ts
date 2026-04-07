import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_TRIGGER_CRAWL_URL,
  requestManualCrawl,
  resolveTriggerCrawlUrl,
} from "../src/lib/manual-crawl";

test("resolveTriggerCrawlUrl uses the deployed endpoint by default", () => {
  assert.equal(resolveTriggerCrawlUrl({}), DEFAULT_TRIGGER_CRAWL_URL);
});

test("resolveTriggerCrawlUrl prefers an explicit env override", () => {
  assert.equal(
    resolveTriggerCrawlUrl({
      VITE_TRIGGER_CRAWL_URL: "https://example.com/crawl",
    }),
    "https://example.com/crawl",
  );
});

test("requestManualCrawl throws the response message when the request fails", async () => {
  await assert.rejects(
    requestManualCrawl(async () => ({
      ok: false,
      json: async () => ({ error: "Forbidden" }),
    }), "https://example.com/crawl"),
    /Forbidden/,
  );
});

test("requestManualCrawl returns the stored signal count", async () => {
  const result = await requestManualCrawl(async () => ({
    ok: true,
    json: async () => ({ signalsStored: 7 }),
  }), "https://example.com/crawl");

  assert.equal(result.signalsStored, 7);
});
