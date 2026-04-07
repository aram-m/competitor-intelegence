import assert from "node:assert/strict";
import test from "node:test";

import { COMPETITOR_SEEDS } from "../src/lib/competitor-seeds";

test("competitor seeds use blog sources instead of generic web sources", () => {
  for (const competitor of COMPETITOR_SEEDS) {
    assert.equal(
      competitor.sources.some((source) => (source.type as string) === "web"),
      false,
      `${competitor.slug} should not include legacy web sources`,
    );
  }
});

test("competitor seeds do not include twitter sources", () => {
  for (const competitor of COMPETITOR_SEEDS) {
    assert.equal(
      competitor.sources.some((source) => source.type === "twitter"),
      false,
      `${competitor.slug} should not include twitter sources`,
    );
  }
});

test("competitor hiring URLs use the expected official pages", () => {
  const expected = new Map([
    ["figment", "https://job-boards.greenhouse.io/figment"],
    ["kiln", "https://www.kiln.fi/contact"],
    ["blockdaemon", "https://jobs.ashbyhq.com/blockdaemon/embed"],
    ["chorus-one", "https://chorus.one/careers"],
    ["stakefish", "https://stake.fish/company/jobs"],
    ["gauntlet", "https://www.gauntlet.xyz/careers"],
    [
      "steakhouse-financial",
      "https://www.steakhouse.financial/careers/general-interest",
    ],
    ["chaos-labs", "https://chaoslabs.xyz/careers"],
  ]);

  for (const competitor of COMPETITOR_SEEDS) {
    const hiringSource = competitor.sources.find(
      (source) => source.type === "hiring",
    );

    assert.equal(hiringSource?.url, expected.get(competitor.slug));
  }
});

test("yield xyz is tracked with an official blog and github source", () => {
  const yieldXyz = COMPETITOR_SEEDS.find((competitor) => competitor.slug === "yield-xyz");

  assert.ok(yieldXyz);
  assert.equal(yieldXyz?.website, "https://yield.xyz/");
  assert.deepEqual(
    yieldXyz?.sources.map((source) => ({
      type: source.type,
      url: source.url,
      feedUrl: source.config?.feedUrl,
      allowedUrlPattern: source.config?.allowedUrlPattern,
    })),
    [
      {
        type: "blog",
        url: "https://yield.xyz/blog",
        feedUrl: "https://stakekit.ghost.io/rss/",
        allowedUrlPattern: "^https://stakekit\\.ghost\\.io/",
      },
      {
        type: "github",
        url: "https://github.com/stakekit",
        feedUrl: undefined,
        allowedUrlPattern: undefined,
      },
    ],
  );
});

test("kiln blog is restricted to real post cards and post urls", () => {
  const kiln = COMPETITOR_SEEDS.find((competitor) => competitor.slug === "kiln");
  const blogSource = kiln?.sources.find((source) => source.type === "blog");

  assert.deepEqual(blogSource, {
    type: "blog",
    url: "https://www.kiln.fi/blog",
    config: {
      selector: ".collection-list-wrapper.first-list .collection-item.w-dyn-item",
      allowedUrlPattern: "^https://www\\.kiln\\.fi/post/",
    },
  });
});

test("kiln uses an explicit official svg logo asset", () => {
  const kiln = COMPETITOR_SEEDS.find((competitor) => competitor.slug === "kiln");

  assert.equal(
    kiln?.logoUrl,
    "https://cdn.prod.website-files.com/625db3caa8abd6c22d5f0ce3/668f029c2bb9c2f43db8fe05_Kiln%20-%20logo%20-%202024.svg",
  );
});

test("chorus one blog is restricted to real article cards and article urls", () => {
  const chorusOne = COMPETITOR_SEEDS.find(
    (competitor) => competitor.slug === "chorus-one",
  );
  const blogSource = chorusOne?.sources.find((source) => source.type === "blog");

  assert.deepEqual(blogSource, {
    type: "blog",
    url: "https://chorus.one/blog",
    config: {
      selector: ".articleslist .articleitem",
      allowedUrlPattern: "^https://chorus\\.one/articles/",
    },
  });
});

test("chaos labs blog is restricted to real post urls", () => {
  const chaosLabs = COMPETITOR_SEEDS.find(
    (competitor) => competitor.slug === "chaos-labs",
  );
  const blogSource = chaosLabs?.sources.find((source) => source.type === "blog");

  assert.deepEqual(blogSource, {
    type: "blog",
    url: "https://chaoslabs.xyz/blog",
    config: {
      selector: "a[href*='/posts/']",
      allowedUrlPattern: "^https://chaoslabs\\.xyz/posts/",
    },
  });
});
