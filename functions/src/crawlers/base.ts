import type { CrawlState, RawCrawlItem, Source } from "../types";

export interface CrawlResult {
  items: RawCrawlItem[];
  newState: Partial<CrawlState>;
}

export abstract class BaseCrawler {
  abstract crawl(source: Source, state: CrawlState | null): Promise<CrawlResult>;
}
