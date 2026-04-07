import Parser from "rss-parser";
import { BaseCrawler, type CrawlResult } from "./base";
import type { CrawlState, RawCrawlItem, Source } from "../types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "CompetitorIntelBot/1.0",
  },
});

export class RssCrawler extends BaseCrawler {
  async crawl(source: Source, state: CrawlState | null): Promise<CrawlResult> {
    const feed = await parser.parseURL(source.url);
    const items: RawCrawlItem[] = [];
    const lastItemUrl = state?.lastItemUrl;

    for (const entry of feed.items) {
      const url = entry.link || entry.guid || "";
      // Stop if we've already seen this item
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
}
