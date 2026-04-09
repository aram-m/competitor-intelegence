import assert from "node:assert/strict";
import test from "node:test";

import type { Signal } from "../functions/src/types";
import type { StoredCompanySummary } from "../src/types";
import {
  buildAlertPayload,
  resolveAlertStatus,
} from "../functions/lib/alerts/payload.js";

function timestamp(value: string) {
  return {
    toDate: () => new Date(value),
  };
}

function makeSignal(
  id: string,
  competitorId: string,
  competitorName: string,
  sourceType: Signal["sourceType"],
  title: string,
): Signal {
  return {
    id,
    competitorId,
    competitorName,
    sourceId: `${competitorId}-${sourceType}-1`,
    sourceType,
    title,
    url: `https://example.com/${id}`,
    rawContent: `${title} raw content`,
    publishedAt: timestamp("2026-04-09T10:00:00.000Z"),
    signalType: "other",
    priority: "medium",
    summary: `${title} summary`,
    recommendedAction: `${title} action`,
    isArchived: false,
    createdAt: timestamp("2026-04-09T10:00:00.000Z"),
  } as unknown as Signal;
}

function makeSummary(
  competitorId: string,
  competitorName: string,
): StoredCompanySummary {
  return {
    id: competitorId,
    competitorId,
    competitorName,
    recentCount: 2,
    sourceTypes: ["blog", "hiring"],
    strongestPriority: "medium",
    latestSignalAt: timestamp("2026-04-09T10:00:00.000Z"),
    windowStart: timestamp("2026-03-10T10:00:00.000Z"),
    summary: `${competitorName} summary`,
    whyItMatters: `${competitorName} matters`,
    watchNext: `${competitorName} next`,
    generatedBy: "ai",
    updatedAt: timestamp("2026-04-09T10:00:00.000Z"),
  } as unknown as StoredCompanySummary;
}

test("buildAlertPayload groups new signals by company and attaches company briefs", () => {
  const payload = buildAlertPayload({
    alertId: "alert-1",
    generatedAt: new Date("2026-04-09T10:00:00.000Z"),
    signals: [
      makeSignal("s1", "chaos-labs", "Chaos Labs", "hiring", "AI Engineer"),
      makeSignal("s2", "chaos-labs", "Chaos Labs", "blog", "New Risk Post"),
      makeSignal("s3", "kiln", "Kiln", "blog", "OmniVault Update"),
    ],
    summaries: [
      makeSummary("chaos-labs", "Chaos Labs"),
      makeSummary("kiln", "Kiln"),
    ],
  });

  assert.deepEqual(payload.signalIds, ["s1", "s2", "s3"]);
  assert.deepEqual(payload.competitorIds, ["chaos-labs", "kiln"]);
  assert.equal(payload.companies.length, 2);
  assert.equal(payload.companies[0]?.competitorName, "Chaos Labs");
  assert.equal(payload.companies[0]?.brief.summary, "Chaos Labs summary");
  assert.equal(payload.companies[0]?.signals.length, 2);
});

test("resolveAlertStatus returns partial when at least one channel fails", () => {
  const status = resolveAlertStatus([
    { channel: "telegram", status: "sent" },
    { channel: "slack", status: "failed", error: "bad auth" },
  ]);

  assert.equal(status, "partial");
});

test("resolveAlertStatus returns sent when every channel succeeds", () => {
  const status = resolveAlertStatus([
    { channel: "telegram", status: "sent" },
    { channel: "slack", status: "sent" },
  ]);

  assert.equal(status, "sent");
});
