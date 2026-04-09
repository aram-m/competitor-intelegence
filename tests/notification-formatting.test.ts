import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAlertPayload,
} from "../functions/lib/alerts/payload.js";
import { buildTelegramMessages } from "../functions/lib/notifications/telegram.js";
import { buildSlackBlocks } from "../functions/lib/notifications/slack.js";

function timestamp(value: string) {
  return {
    toDate: () => new Date(value),
  };
}

const payload = buildAlertPayload({
  alertId: "alert-1",
  generatedAt: new Date("2026-04-09T12:00:00.000Z"),
  signals: [
    {
      id: "s1",
      competitorId: "chaos-labs",
      competitorName: "Chaos Labs",
      sourceId: "chaos-hiring-1",
      sourceType: "hiring",
      title: "Senior AI Data Scientist",
      url: "https://example.com/s1",
      rawContent: "Hiring role focused on AI systems and risk intelligence.",
      publishedAt: timestamp("2026-04-09T10:00:00.000Z"),
      signalType: "other",
      priority: "medium",
      summary: "Hiring role for AI systems.",
      recommendedAction: "Track whether this maps to a product launch.",
      isArchived: false,
      createdAt: timestamp("2026-04-09T10:00:00.000Z"),
    },
  ],
  summaries: [
    {
      id: "chaos-labs",
      competitorId: "chaos-labs",
      competitorName: "Chaos Labs",
      recentCount: 1,
      sourceTypes: ["hiring"],
      strongestPriority: "medium",
      latestSignalAt: timestamp("2026-04-09T10:00:00.000Z"),
      windowStart: timestamp("2026-03-10T10:00:00.000Z"),
      summary: "Chaos Labs is expanding its AI hiring bench.",
      whyItMatters: "This suggests more investment in AI product capacity.",
      watchNext: "Monitor for product announcements tied to these roles.",
      generatedBy: "ai",
      updatedAt: timestamp("2026-04-09T12:00:00.000Z"),
    },
  ],
});

test("buildTelegramMessages renders company brief and supporting signals", () => {
  const messages = buildTelegramMessages(payload);

  assert.equal(messages.length, 1);
  assert.match(messages[0] ?? "", /Chaos Labs is expanding its AI hiring bench/);
  assert.match(messages[0] ?? "", /Senior AI Data Scientist/);
});

test("buildSlackBlocks renders company brief and supporting signals", () => {
  const blocks = buildSlackBlocks(payload);

  assert.ok(blocks.length > 0);
  assert.equal(blocks[0]?.type, "header");
  assert.match(JSON.stringify(blocks), /Chaos Labs/);
  assert.match(JSON.stringify(blocks), /Senior AI Data Scientist/);
});
