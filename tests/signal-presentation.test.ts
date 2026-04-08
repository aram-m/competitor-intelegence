import assert from "node:assert/strict";
import test from "node:test";

import type { Signal } from "../src/types";
import {
  getSignalDisplayRecommendedAction,
  getSignalDisplaySummary,
} from "../src/lib/signal-presentation";

function makeSignal(
  overrides: Partial<Signal> = {},
): Signal {
  return {
    id: "signal-1",
    competitorId: "chaos-labs",
    competitorName: "Chaos Labs",
    sourceId: "chaos-labs-hiring-1",
    sourceType: "hiring",
    title: "AI Engineer",
    url: "https://example.com/role",
    rawContent: "",
    publishedAt: { toDate: () => new Date("2026-04-08T10:00:00.000Z") },
    signalType: "other",
    priority: "medium",
    summary: "Unable to classify — review manually.",
    recommendedAction: "Review the source material directly.",
    isArchived: false,
    createdAt: { toDate: () => new Date("2026-04-08T10:00:00.000Z") },
    ...overrides,
  } as unknown as Signal;
}

test("getSignalDisplaySummary hides manual-review fallback summaries", () => {
  assert.equal(getSignalDisplaySummary(makeSignal()), "");
});

test("getSignalDisplaySummary keeps real summaries", () => {
  assert.equal(
    getSignalDisplaySummary(
      makeSignal({
        summary: "Chaos Labs is hiring several AI and full-stack roles.",
      }),
    ),
    "Chaos Labs is hiring several AI and full-stack roles.",
  );
});

test("getSignalDisplayRecommendedAction hides manual-review fallback actions", () => {
  assert.equal(getSignalDisplayRecommendedAction(makeSignal()), "");
});

test("getSignalDisplayRecommendedAction keeps real actions", () => {
  assert.equal(
    getSignalDisplayRecommendedAction(
      makeSignal({
        recommendedAction: "Track whether these hires map to new oracle products.",
      }),
    ),
    "Track whether these hires map to new oracle products.",
  );
});
