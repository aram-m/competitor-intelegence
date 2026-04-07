import { BaseCrawler, type CrawlResult } from "./base";
import type { Source } from "../types";

export class SocialCrawler extends BaseCrawler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async crawl(_source: Source): Promise<CrawlResult> {
    // Placeholder — integrate with specific social APIs when ready
    return { items: [], newState: {} };
  }
}
