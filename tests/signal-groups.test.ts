import assert from "node:assert/strict";
import test from "node:test";

import { groupSignalsByCompany } from "../src/lib/signal-groups";
import type { Signal } from "../src/types";

const now = new Date();

function makeSignal(
  id: string,
  competitorId: string,
  competitorName: string,
  priority: Signal["priority"],
  hoursAgo: number,
): Signal {
  return {
    id,
    competitorId,
    competitorName,
    sourceId: "source-1",
    sourceType: "blog",
    title: id,
    url: `https://example.com/${id}`,
    rawContent: "raw",
    publishedAt: {
      toDate: () => new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
    },
    signalType: "technical",
    priority,
    summary: "summary",
    recommendedAction: "action",
    isArchived: false,
    createdAt: {
      toDate: () => new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
    },
  } as unknown as Signal;
}

test("groupSignalsByCompany groups and sorts signals by company and priority", () => {
  const groups = groupSignalsByCompany([
    makeSignal("b-low", "b", "Blockdaemon", "low", 1),
    makeSignal("a-high", "a", "Figment", "high", 2),
    makeSignal("a-critical", "a", "Figment", "critical", 5),
  ]);

  assert.deepEqual(groups.map((group) => group.competitorName), [
    "Blockdaemon",
    "Figment",
  ]);
  assert.deepEqual(groups[1].signals.map((signal) => signal.id), [
    "a-critical",
    "a-high",
  ]);
});
