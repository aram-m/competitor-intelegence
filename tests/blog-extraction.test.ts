import assert from "node:assert/strict";
import test from "node:test";

import * as webHelpers from "../functions/lib/crawlers/web-helpers.js";

const { extractWebItems } = webHelpers;

test("extractWebItems respects allowedUrlPattern for Kiln-style blog pages", () => {
  const html = `
    <main>
      <div class="collection-list-wrapper first-list">
        <div class="collection-item w-dyn-item">
          <a href="/post/the-future-of-institutional-yield">Read post</a>
          <div class="div-block-3">
            <div class="all-caps-grey">Announcements</div>
            <div class="all-caps-grey">March 18, 2026</div>
          </div>
          <div class="text-size-medium text-weight-medium">
            The Future of Institutional Yield
          </div>
        </div>
      </div>
      <footer>
        <a href="/about">About</a>
      </footer>
    </main>
  `;

  const items = extractWebItems({
    html,
    sourceUrl: "https://www.kiln.fi/blog",
    selector: ".collection-list-wrapper.first-list .collection-item.w-dyn-item, footer a[href]",
    allowedUrlPattern: "^https://www\\.kiln\\.fi/post/",
    sourceType: "blog",
  });

  assert.deepEqual(
    items.map((item) => ({
      title: item.title,
      url: item.url,
    })),
    [
      {
        title: "The Future of Institutional Yield",
        url: "https://www.kiln.fi/post/the-future-of-institutional-yield",
      },
    ],
  );
  assert.equal(items[0]?.publishedAt.toISOString(), "2026-03-18T00:00:00.000Z");
});
