import assert from "node:assert/strict";
import test from "node:test";

import type { Signal } from "../src/types";
import {
  getSourceTypeLabel,
  getAvailableSourceTypeOptions,
} from "../src/lib/source-presentation";

const baseSignal = {
  competitorId: "figment",
  competitorName: "Figment",
  sourceId: "source-1",
  title: "Title",
  url: "https://example.com",
  rawContent: "raw",
  publishedAt: { toDate: () => new Date() },
  signalType: "technical",
  priority: "medium",
  summary: "summary",
  recommendedAction: "action",
  isArchived: false,
  createdAt: { toDate: () => new Date() },
} as unknown as Signal;

test("getSourceTypeLabel presents blog as Blog", () => {
  assert.equal(getSourceTypeLabel("blog"), "Blog");
  assert.equal(getSourceTypeLabel("github"), "GitHub");
  assert.equal(getSourceTypeLabel("hiring"), "Hiring");
});

test("getAvailableSourceTypeOptions only includes source types present in signals", () => {
  const signals = [
    { ...baseSignal, id: "1", sourceType: "github" },
    { ...baseSignal, id: "2", sourceType: "blog" },
    { ...baseSignal, id: "3", sourceType: "hiring" },
  ] as Signal[];

  assert.deepEqual(getAvailableSourceTypeOptions(signals), [
    { value: "blog", label: "Blog" },
    { value: "github", label: "GitHub" },
    { value: "hiring", label: "Hiring" },
  ]);
});
