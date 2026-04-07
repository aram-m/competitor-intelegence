import assert from "node:assert/strict";
import test from "node:test";

import { planSignalCleanup } from "../scripts/lib/signal-cleanup";

test("planSignalCleanup removes stale rss rows and invalid hiring pages", () => {
  const deletions = planSignalCleanup({
    signals: [
      {
        id: "rss-1",
        competitorId: "figment",
        sourceId: "figment-rss-1",
        sourceType: "rss",
        url: "https://figment.io/blog/post-1?utm_source=rss",
        createdAt: "2026-04-01T10:00:00.000Z",
      },
      {
        id: "web-1",
        competitorId: "figment",
        sourceId: "figment-blog-1",
        sourceType: "blog",
        url: "https://figment.io/blog/post-1",
        createdAt: "2026-04-02T10:00:00.000Z",
      },
      {
        id: "hiring-about",
        competitorId: "kiln",
        sourceId: "kiln-hiring-3",
        sourceType: "hiring",
        url: "https://www.kiln.fi/contact",
        createdAt: "2026-04-02T10:00:00.000Z",
      },
    ],
    sources: [
      { id: "figment-blog-1", type: "blog", isActive: true },
      { id: "kiln-hiring-3", type: "hiring", isActive: true },
    ],
  });

  assert.deepEqual(
    deletions.sort((left, right) => left.id.localeCompare(right.id)),
    [
      { id: "hiring-about", reason: "invalid_hiring_url" },
      { id: "rss-1", reason: "stale_source" },
    ],
  );
});

test("planSignalCleanup keeps only the newest canonical duplicate", () => {
  const deletions = planSignalCleanup({
    signals: [
      {
        id: "old",
        competitorId: "gauntlet",
        sourceId: "gauntlet-blog-1",
        sourceType: "blog",
        url: "https://gauntlet.xyz/blog/same-post",
        createdAt: "2026-04-01T10:00:00.000Z",
      },
      {
        id: "new",
        competitorId: "gauntlet",
        sourceId: "gauntlet-blog-1",
        sourceType: "blog",
        url: "https://gauntlet.xyz/blog/same-post?utm_source=newsletter",
        updatedAt: "2026-04-02T10:00:00.000Z",
      },
    ],
    sources: [{ id: "gauntlet-blog-1", type: "blog", isActive: true }],
  });

  assert.deepEqual(deletions, [{ id: "old", reason: "duplicate" }]);
});

test("planSignalCleanup drops malformed urls instead of crashing", () => {
  const deletions = planSignalCleanup({
    signals: [
      {
        id: "bad-url",
        competitorId: "figment",
        sourceId: "figment-blog-1",
        sourceType: "blog",
        url: "?b23db330_page=2",
        createdAt: "2026-04-01T10:00:00.000Z",
      },
    ],
    sources: [{ id: "figment-blog-1", type: "blog", isActive: true }],
  });

  assert.deepEqual(deletions, [{ id: "bad-url", reason: "invalid_url" }]);
});

test("planSignalCleanup drops blog urls outside a source's allowed post pattern", () => {
  const deletions = planSignalCleanup({
    signals: [
      {
        id: "kiln-about",
        competitorId: "kiln",
        sourceId: "kiln-blog-1",
        sourceType: "blog",
        url: "https://www.kiln.fi/about",
        createdAt: "2026-04-01T10:00:00.000Z",
      },
      {
        id: "kiln-post",
        competitorId: "kiln",
        sourceId: "kiln-blog-1",
        sourceType: "blog",
        url: "https://www.kiln.fi/post/a-real-post",
        createdAt: "2026-04-01T10:00:00.000Z",
      },
    ],
    sources: [
      {
        id: "kiln-blog-1",
        type: "blog",
        isActive: true,
        allowedUrlPattern: "^https://www\\.kiln\\.fi/post/",
      },
    ],
  });

  assert.deepEqual(deletions, [{ id: "kiln-about", reason: "invalid_blog_url" }]);
});
