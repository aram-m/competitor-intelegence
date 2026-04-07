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

test("extractWebItems keeps only Chorus One article cards and drops category or external links", () => {
  const html = `
    <div class="articleslist">
      <div class="articleitem">
        <div class="blog-category-item">News</div>
        <a href="/articles/bitwise-acquires-staking-infrastructure-pioneer-chorus-one-expanding-bitwise-onchain-solutions-multichain-capabilities">
          <div class="subheader_2">
            Bitwise Acquires Staking Infrastructure Pioneer Chorus One
          </div>
          <div class="textbody_2 gray_2">
            Bitwise announced the acquisition.
          </div>
          <div class="textbody_2 gray_2">April 6, 2026</div>
        </a>
      </div>
      <div class="articleitem">
        <a href="/categories/networks">
          <div class="subheader_2">Networks</div>
        </a>
      </div>
      <div class="articleitem">
        <a href="https://enterprise.ledger.com/">
          <div class="subheader_2">Ledger Enterprise</div>
        </a>
      </div>
    </div>
  `;

  const items = extractWebItems({
    html,
    sourceUrl: "https://chorus.one/blog",
    selector: ".articleslist .articleitem",
    allowedUrlPattern: "^https://chorus\\.one/articles/",
    sourceType: "blog",
  });

  assert.deepEqual(
    items.map((item) => ({
      title: item.title,
      url: item.url,
    })),
    [
      {
        title: "Bitwise Acquires Staking Infrastructure Pioneer Chorus One",
        url: "https://chorus.one/articles/bitwise-acquires-staking-infrastructure-pioneer-chorus-one-expanding-bitwise-onchain-solutions-multichain-capabilities",
      },
    ],
  );
  assert.equal(items[0]?.publishedAt.toISOString(), "2026-04-06T00:00:00.000Z");
});
