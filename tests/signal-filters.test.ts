import assert from "node:assert/strict";
import test from "node:test";

import { applySignalFilters, getRecentSignalWindowStart, type Filters } from "../src/lib/signal-filters";
import type { Signal } from "../src/types";

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

function makeFilters(overrides: Partial<Filters>): Filters {
  return {
    companies: [],
    sourceTypes: [],
    priorities: [],
    ...overrides,
  };
}

test("applySignalFilters filters by source type", () => {
  const signals = [
    { ...baseSignal, id: "1", sourceType: "github" },
    { ...baseSignal, id: "2", sourceType: "hiring" },
  ] as Signal[];

  const filtered = applySignalFilters(signals, makeFilters({
    sourceTypes: ["hiring"],
  }));

  assert.deepEqual(
    filtered.map((signal) => signal.id),
    ["2"],
  );
});

test("applySignalFilters can combine source type with priority", () => {
  const signals = [
    { ...baseSignal, id: "1", sourceType: "github", signalType: "technical" },
    { ...baseSignal, id: "2", sourceType: "hiring", priority: "medium" },
    { ...baseSignal, id: "3", sourceType: "hiring", priority: "high" },
  ] as Signal[];

  const filtered = applySignalFilters(signals, makeFilters({
    sourceTypes: ["hiring"],
    priorities: ["high"],
  }));

  assert.deepEqual(
    filtered.map((signal) => signal.id),
    ["3"],
  );
});

test("getRecentSignalWindowStart returns a rolling 30-day cutoff", () => {
  const now = new Date("2026-04-07T12:00:00.000Z");

  assert.equal(
    getRecentSignalWindowStart(now).toISOString(),
    "2026-03-08T12:00:00.000Z",
  );
});

test("applySignalFilters keeps only signals from the last 30 days", () => {
  const now = new Date("2026-04-07T12:00:00.000Z");
  const signals = [
    {
      ...baseSignal,
      id: "older-than-window",
      sourceType: "blog",
      publishedAt: { toDate: () => new Date("2026-03-07T11:59:59.000Z") },
    },
    {
      ...baseSignal,
      id: "window-boundary",
      sourceType: "blog",
      publishedAt: { toDate: () => new Date("2026-03-08T12:00:00.000Z") },
    },
    {
      ...baseSignal,
      id: "recent-github",
      sourceType: "github",
      publishedAt: { toDate: () => new Date("2026-04-01T00:00:00.000Z") },
    },
  ] as Signal[];

  const filtered = applySignalFilters(signals, makeFilters({}), now);

  assert.deepEqual(
    filtered.map((signal) => signal.id),
    ["window-boundary", "recent-github"],
  );
});
