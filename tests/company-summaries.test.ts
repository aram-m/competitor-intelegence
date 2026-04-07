import assert from "node:assert/strict";
import test from "node:test";

import { buildCompanySummary } from "../src/lib/company-summaries";
import { groupSignalsByCompany } from "../src/lib/signal-groups";
import type { Signal } from "../src/types";

const now = new Date("2026-04-07T12:00:00.000Z");

function makeSignal(
  id: string,
  competitorId: string,
  competitorName: string,
  sourceType: Signal["sourceType"],
  priority: Signal["priority"],
  publishedAt: string,
  title = id,
): Signal {
  return {
    id,
    competitorId,
    competitorName,
    sourceId: "source-1",
    sourceType,
    title,
    url: `https://example.com/${id}`,
    rawContent: "raw",
    publishedAt: { toDate: () => new Date(publishedAt) },
    signalType: "technical",
    priority,
    summary: "summary",
    recommendedAction: "action",
    isArchived: false,
    createdAt: { toDate: () => new Date(publishedAt) },
  } as unknown as Signal;
}

test("buildCompanySummary creates a summary-first view model", () => {
  const [group] = groupSignalsByCompany([
    makeSignal(
      "omnivault",
      "kiln",
      "Kiln",
      "blog",
      "high",
      "2026-04-06T10:00:00.000Z",
      "Introducing Kiln OmniVault",
    ),
    makeSignal(
      "release",
      "kiln",
      "Kiln",
      "github",
      "medium",
      "2026-04-05T10:00:00.000Z",
      "SDK release",
    ),
    makeSignal(
      "job",
      "kiln",
      "Kiln",
      "hiring",
      "low",
      "2026-04-03T10:00:00.000Z",
      "Senior DevOps Engineer",
    ),
  ]);

  const summary = buildCompanySummary(group, now);

  assert.equal(summary.recentCount, 3);
  assert.equal(summary.strongestPriority, "high");
  assert.deepEqual(summary.sourceTypes, ["blog", "github", "hiring"]);
  assert.deepEqual(
    summary.featuredSignals.map((signal) => signal.id),
    ["omnivault", "release", "job"],
  );
  assert.equal(summary.brief.generatedBy, "deterministic");
  assert.match(summary.brief.summary, /3 recent changes/i);
  assert.match(summary.brief.summary, /Blog/i);
  assert.match(summary.brief.summary, /GitHub/i);
  assert.match(summary.brief.summary, /Introducing Kiln OmniVault/i);
});

test("buildCompanySummary prefers a stored AI brief when present", () => {
  const [group] = groupSignalsByCompany([
    makeSignal(
      "omnivault",
      "kiln",
      "Kiln",
      "blog",
      "high",
      "2026-04-06T10:00:00.000Z",
      "Introducing Kiln OmniVault",
    ),
  ]);

  const summary = buildCompanySummary(group, now, {
    competitorId: "kiln",
    competitorName: "Kiln",
    recentCount: 1,
    sourceTypes: ["blog"],
    strongestPriority: "high",
    generatedBy: "ai",
    summary:
      "Kiln pushed an institutional yield narrative with OmniVault and is leaning into product positioning.",
    whyItMatters:
      "This sharpens Kiln's appeal to treasury and institutional DeFi allocators.",
    watchNext: "Watch for partnership and distribution announcements around OmniVault.",
  });

  assert.equal(summary.brief.generatedBy, "ai");
  assert.match(summary.brief.summary, /institutional yield narrative/i);
  assert.match(summary.brief.whyItMatters, /institutional DeFi allocators/i);
  assert.match(summary.brief.watchNext, /partnership/i);
});
