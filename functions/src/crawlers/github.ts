import fetch from "node-fetch";
import { BaseCrawler, type CrawlResult } from "./base";
import type { CrawlState, RawCrawlItem, Source } from "../types";
import { getRuntimeConfig } from "../config";

const GITHUB_API = "https://api.github.com";

interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  body: string;
  published_at: string;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  created_at: string;
  pushed_at: string;
}

export class GitHubCrawler extends BaseCrawler {
  async crawl(source: Source, state: CrawlState | null): Promise<CrawlResult> {
    const org = source.config.githubOrg;
    if (!org) return { items: [], newState: {} };

    const { githubToken } = getRuntimeConfig();
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CompetitorIntelBot/1.0",
    };
    if (githubToken) headers.Authorization = `token ${githubToken}`;
    if (state?.etag) headers["If-None-Match"] = state.etag;

    const items: RawCrawlItem[] = [];
    const lastItemUrl = state?.lastItemUrl;

    // Fetch recent repos (sorted by pushed_at)
    const reposRes = await fetch(
      `${GITHUB_API}/orgs/${org}/repos?sort=pushed&per_page=10`,
      { headers },
    );

    if (reposRes.status === 304) {
      return { items: [], newState: {} };
    }

    const newEtag = reposRes.headers.get("etag") || undefined;

    if (reposRes.ok) {
      const repos = (await reposRes.json()) as GitHubRepo[];

      for (const repo of repos) {
        // Fetch latest releases for each repo
        const relRes = await fetch(
          `${GITHUB_API}/repos/${repo.full_name}/releases?per_page=5`,
          { headers },
        );

        // Check rate limit
        const remaining = parseInt(
          relRes.headers.get("x-ratelimit-remaining") || "100",
        );
        if (remaining < 10) break;

        if (!relRes.ok) continue;

        const releases = (await relRes.json()) as GitHubRelease[];
        for (const release of releases) {
          if (lastItemUrl && release.html_url === lastItemUrl) break;

          items.push({
            title: `[${repo.name}] ${release.name || release.tag_name}`,
            url: release.html_url,
            content: (release.body || "").slice(0, 2000),
            publishedAt: new Date(release.published_at),
          });
        }
      }
    }

    return {
      items,
      newState: {
        etag: newEtag,
        lastItemUrl: items[0]?.url || lastItemUrl,
      },
    };
  }
}
