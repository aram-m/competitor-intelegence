import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { RssCrawler } from "../crawlers/rss";
import { GitHubCrawler } from "../crawlers/github";
import { WebCrawler } from "../crawlers/web";
import type { BaseCrawler } from "../crawlers/base";
import { classifySignal } from "../classifier/llm";
import {
  getCrawlState,
  updateCrawlState,
  markCrawlSuccess,
  markCrawlError,
  markCrawling,
} from "../services/crawl-state";
import { storeSignal } from "../services/signal-store";
import { refreshCompanySummaries } from "../services/company-summary-refresh";
import type { Source } from "../types";

const crawlers: Record<string, BaseCrawler> = {
  rss: new RssCrawler(),
  github: new GitHubCrawler(),
  blog: new WebCrawler(),
  hiring: new WebCrawler(),
};

async function runCrawl() {
  const db = admin.firestore();

  // Get all active sources
  const sourcesSnap = await db
    .collection("sources")
    .where("isActive", "==", true)
    .get();

  console.log(`Found ${sourcesSnap.size} active sources`);

  let totalSignals = 0;

  for (const doc of sourcesSnap.docs) {
    const source = { id: doc.id, ...doc.data() } as Source;
    const crawler = crawlers[source.type];

    if (!crawler) {
      console.log(`No crawler for source type: ${source.type}`);
      continue;
    }

    try {
      console.log(`Crawling ${source.competitorName} — ${source.type}: ${source.url}`);
      await markCrawling(source.id);

      const state = await getCrawlState(source.id);
      const result = await crawler.crawl(source, state);

      console.log(`  Found ${result.items.length} new items`);

      // Classify and store each item
      for (const item of result.items) {
        try {
          const classification = await classifySignal(
            item,
            source.competitorName,
            source.type,
          );
          await storeSignal(source, item, classification);
          totalSignals++;
          console.log(
            `  Stored: [${classification.priority}] ${item.title}`,
          );
        } catch (err) {
          console.error(`  Failed to classify/store: ${item.title}`, err);
        }
      }

      // Update crawl state
      await updateCrawlState(source.id, result.newState);
      await markCrawlSuccess(source.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Crawl failed for ${source.url}:`, message);
      await markCrawlError(source.id, message);
    }
  }

  const summaryCount = await refreshCompanySummaries();
  console.log(`Company summaries refreshed: ${summaryCount}.`);

  console.log(`Crawl complete. ${totalSignals} new signals stored.`);
  return totalSignals;
}

function setCorsHeaders(res: { set: (key: string, value: string) => void }) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// Runs every 4 hours
export const scheduledCrawl = onSchedule(
  { schedule: "every 4 hours", timeoutSeconds: 540, memory: "512MiB" },
  async () => {
    await runCrawl();
  },
);

// HTTP trigger for manual testing
export const triggerCrawl = onRequest(
  { timeoutSeconds: 540, memory: "512MiB" },
  async (req, res) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const count = await runCrawl();
      res.json({ status: "ok", signalsStored: count });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Manual crawl failed.";
      res.status(500).json({ error: message });
    }
  },
);
