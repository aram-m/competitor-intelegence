import assert from "node:assert/strict";
import test from "node:test";

import type { Signal } from "../functions/src/types";
import {
  getStrongestPriorityForSummary,
  isReliablePrioritySignal,
} from "../functions/lib/services/company-summary-store.js";

function makeSignal(
  id: string,
  priority: Signal["priority"],
  summary: string,
  recommendedAction = "Review the source material directly.",
): Signal {
  return {
    id,
    competitorId: "chorus-one",
    competitorName: "Chorus One",
    sourceId: "chorus-one-blog-1",
    sourceType: "blog",
    title: id,
    url: `https://chorus.one/articles/${id}`,
    rawContent: "Some real content",
    publishedAt: { toDate: () => new Date("2026-04-06T10:00:00.000Z") },
    signalType: "other",
    priority,
    summary,
    recommendedAction,
    isArchived: false,
    createdAt: { toDate: () => new Date("2026-04-06T10:00:00.000Z") },
  } as unknown as Signal;
}

test("isReliablePrioritySignal excludes manual-review fallback rows", () => {
  assert.equal(
    isReliablePrioritySignal(
      makeSignal(
        "fallback",
        "medium",
        "Unable to classify — review manually.",
      ),
    ),
    false,
  );

  assert.equal(
    isReliablePrioritySignal(
      makeSignal(
        "real",
        "high",
        "Bitwise acquired Chorus One and expanded custody distribution.",
        "Review Bitwise distribution implications this week.",
      ),
    ),
    true,
  );
});

test("getStrongestPriorityForSummary ignores fallback medium rows", () => {
  const strongestPriority = getStrongestPriorityForSummary([
    makeSignal(
      "fallback-medium",
      "medium",
      "Unable to classify — review manually.",
    ),
    makeSignal(
      "fallback-low",
      "low",
      "Unable to classify — review manually.",
    ),
  ]);

  assert.equal(strongestPriority, "low");
});

test("getStrongestPriorityForSummary keeps the strongest reliable signal priority", () => {
  const strongestPriority = getStrongestPriorityForSummary([
    makeSignal(
      "fallback-medium",
      "medium",
      "Unable to classify — review manually.",
    ),
    makeSignal(
      "real-high",
      "high",
      "Bitwise acquired Chorus One and expanded custody distribution.",
      "Review Bitwise distribution implications this week.",
    ),
  ]);

  assert.equal(strongestPriority, "high");
});
