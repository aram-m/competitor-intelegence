import assert from "node:assert/strict";
import test from "node:test";

import * as companyBriefModule from "../functions/lib/summary/company-brief.js";
import type { Signal } from "../src/types";

const {
  buildCompanyBriefPrompt,
  buildFallbackCompanyBrief,
} = companyBriefModule;

function makeSignal(
  id: string,
  title: string,
  sourceType: Signal["sourceType"],
  priority: Signal["priority"],
  publishedAt: string,
): Signal {
  return {
    id,
    competitorId: "kiln",
    competitorName: "Kiln",
    sourceId: "source-1",
    sourceType,
    title,
    url: `https://example.com/${id}`,
    rawContent: "raw",
    publishedAt: { toDate: () => new Date(publishedAt) },
    signalType: "technical",
    priority,
    summary: `${title} summary`,
    recommendedAction: "action",
    isArchived: false,
    createdAt: { toDate: () => new Date(publishedAt) },
  } as unknown as Signal;
}

test("buildCompanyBriefPrompt includes recent signals as compact evidence", () => {
  const prompt = buildCompanyBriefPrompt("Kiln", [
    makeSignal("one", "Introducing Kiln OmniVault", "blog", "high", "2026-04-06T10:00:00.000Z"),
    makeSignal("two", "SDK release", "github", "medium", "2026-04-05T10:00:00.000Z"),
  ]);

  assert.match(prompt, /Competitor: Kiln/);
  assert.match(prompt, /Introducing Kiln OmniVault/);
  assert.match(prompt, /\[high \/ blog\]/i);
  assert.match(prompt, /SDK release/);
});

test("buildFallbackCompanyBrief produces a usable non-empty brief", () => {
  const brief = buildFallbackCompanyBrief("Kiln", [
    makeSignal("one", "Introducing Kiln OmniVault", "blog", "high", "2026-04-06T10:00:00.000Z"),
    makeSignal("two", "SDK release", "github", "medium", "2026-04-05T10:00:00.000Z"),
  ]);

  assert.equal(brief.generatedBy, "fallback");
  assert.match(brief.summary, /Kiln/i);
  assert.match(brief.summary, /OmniVault/i);
  assert.match(brief.whyItMatters, /recent activity/i);
  assert.match(brief.watchNext, /follow-on/i);
});
