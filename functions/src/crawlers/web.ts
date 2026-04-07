import fetch from "node-fetch";
import Parser from "rss-parser";
import { BaseCrawler, type CrawlResult } from "./base";
import type { CrawlState, RawCrawlItem, Source } from "../types";
import { extractWebItems } from "./web-helpers";

// Common blog selectors to try, in order of specificity
const DEFAULT_SELECTORS = [
  "article",
  "[class*='blog'] a[href]",
  "[class*='post'] a[href]",
  ".entry",
  "main a[href]",
];

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "CompetitorIntelBot/1.0",
  },
});

export class WebCrawler extends BaseCrawler {
  async crawl(source: Source, state: CrawlState | null): Promise<CrawlResult> {
    if (source.config.feedUrl) {
      const feed = await parser.parseURL(source.config.feedUrl);
      const items: RawCrawlItem[] = [];
      const lastItemUrl = state?.lastItemUrl;

      for (const entry of feed.items) {
        const url = entry.link || entry.guid || "";
        if (lastItemUrl && url === lastItemUrl) break;

        items.push({
          title: entry.title || "Untitled",
          url,
          content: (
            entry.contentSnippet ||
            entry.content ||
            entry.summary ||
            ""
          ).slice(0, 2000),
          publishedAt: entry.pubDate ? new Date(entry.pubDate) : new Date(),
        });
      }

      return {
        items,
        newState: {
          lastItemUrl: feed.items[0]?.link || feed.items[0]?.guid || lastItemUrl,
          etag: undefined,
        },
      };
    }

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (compatible; CompetitorIntelBot/1.0)",
    };
    if (state?.etag) headers["If-None-Match"] = state.etag;
    if (state?.lastModified) headers["If-Modified-Since"] = state.lastModified;

    const res = await fetch(source.url, { headers, timeout: 15000 });

    if (res.status === 304) {
      return { items: [], newState: {} };
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${source.url}`);
    }

    const html = await res.text();
    const lastItemUrl = state?.lastItemUrl;
    const selector = source.config.selector || DEFAULT_SELECTORS.join(", ");
    const items: RawCrawlItem[] = extractWebItems({
      html,
      sourceUrl: source.url,
      selector,
      allowedUrlPattern: source.config.allowedUrlPattern,
      sourceType: source.type,
      lastItemUrl,
    });

    return {
      items: items.slice(0, source.type === "blog" ? 50 : 20),
      newState: {
        etag: res.headers.get("etag") || undefined,
        lastModified: res.headers.get("last-modified") || undefined,
        lastItemUrl: items[0]?.url || lastItemUrl,
      },
    };
  }
}
