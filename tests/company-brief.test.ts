import assert from "node:assert/strict";
import test from "node:test";

import * as companyBriefModule from "../functions/lib/summary/company-brief.js";
import type { Signal } from "../src/types";

const {
  buildCompanyBriefPrompt,
  buildFallbackCompanyBrief,
  getCompanyBriefEvidenceSignals,
} = companyBriefModule;

function makeSignal(
  id: string,
  title: string,
  sourceType: Signal["sourceType"],
  priority: Signal["priority"],
  publishedAt: string,
  overrides: Partial<Signal> = {},
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
    ...overrides,
  } as unknown as Signal;
}

test("getCompanyBriefEvidenceSignals drops fallback rows and keeps the best recent evidence", () => {
  const signals = getCompanyBriefEvidenceSignals([
    makeSignal(
      "fallback",
      "Noise",
      "blog",
      "medium",
      "2026-04-06T10:00:00.000Z",
      {
        summary: "Unable to classify — review manually.",
        recommendedAction: "Review the source material directly.",
      },
    ),
    makeSignal(
      "real",
      "Introducing Kiln OmniVault",
      "blog",
      "high",
      "2026-04-05T10:00:00.000Z",
    ),
  ]);

  assert.deepEqual(
    signals.map((signal) => signal.id),
    ["real"],
  );
});

test("getCompanyBriefEvidenceSignals preserves concrete hiring roles alongside reliable non-hiring evidence", () => {
  const signals = getCompanyBriefEvidenceSignals([
    makeSignal(
      "policy",
      "Privacy Policy",
      "blog",
      "low",
      "2026-04-06T10:00:00.000Z",
      {
        summary: "Chaos Labs updated its privacy policy.",
      },
    ),
    makeSignal(
      "job-1",
      "Senior AI Data Scientist",
      "hiring",
      "medium",
      "2026-04-06T09:00:00.000Z",
      {
        summary: "Unable to classify — review manually.",
        recommendedAction: "Review the source material directly.",
      },
    ),
    makeSignal(
      "job-2",
      "AI Engineer",
      "hiring",
      "medium",
      "2026-04-06T08:00:00.000Z",
      {
        summary: "Unable to classify — review manually.",
        recommendedAction: "Review the source material directly.",
      },
    ),
  ]);

  assert.deepEqual(
    signals.map((signal) => signal.title),
    ["Senior AI Data Scientist", "AI Engineer", "Privacy Policy"],
  );
});

test("buildCompanyBriefPrompt includes primary evidence instead of fallback summaries", () => {
  const prompt = buildCompanyBriefPrompt("Kiln", [
    makeSignal("noise", "Noise", "blog", "medium", "2026-04-06T10:00:00.000Z", {
      summary: "Unable to classify — review manually.",
      recommendedAction: "Review the source material directly.",
      rawContent: "This should be ignored.",
    }),
    makeSignal(
      "one",
      "Introducing Kiln OmniVault",
      "blog",
      "high",
      "2026-04-05T10:00:00.000Z",
      {
        url: "https://www.kiln.fi/post/omnivault",
        rawContent:
          "Kiln launched OmniVault for institutional yield strategies with new treasury controls and validator routing.",
      },
    ),
    makeSignal(
      "two",
      "SDK release",
      "github",
      "medium",
      "2026-04-04T10:00:00.000Z",
      {
        url: "https://github.com/kilnfi/sdk/releases/tag/v2.1.0",
        rawContent:
          "Release adds vault APIs, improved reward accounting, and multi-network support.",
      },
    ),
  ]);

  assert.match(prompt, /Competitor: Kiln/);
  assert.match(prompt, /Introducing Kiln OmniVault/);
  assert.match(prompt, /\[high \/ blog\]/i);
  assert.match(prompt, /SDK release/);
  assert.match(prompt, /https:\/\/www\.kiln\.fi\/post\/omnivault/);
  assert.match(prompt, /institutional yield strategies/i);
  assert.doesNotMatch(prompt, /Unable to classify/);
  assert.doesNotMatch(prompt, /This should be ignored/);
});

test("buildCompanyBriefPrompt adds a hiring rollup when hiring signals exist", () => {
  const prompt = buildCompanyBriefPrompt("Chaos Labs", [
    makeSignal(
      "job-1",
      "Senior AI Data Scientist",
      "hiring",
      "medium",
      "2026-04-06T10:00:00.000Z",
      {
        summary: "Unable to classify — review manually.",
        recommendedAction: "Review the source material directly.",
      },
    ),
    makeSignal(
      "job-2",
      "AI Engineer",
      "hiring",
      "medium",
      "2026-04-06T09:00:00.000Z",
      {
        summary: "Unable to classify — review manually.",
        recommendedAction: "Review the source material directly.",
      },
    ),
  ]);

  assert.match(prompt, /Hiring overview:/);
  assert.match(prompt, /Senior AI Data Scientist/);
  assert.match(prompt, /AI Engineer/);
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
