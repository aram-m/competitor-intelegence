import * as admin from "firebase-admin";
import type { CrawlState } from "../types";

const db = admin.firestore;

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

export async function getCrawlState(
  sourceId: string,
): Promise<CrawlState | null> {
  const doc = await db().collection("crawl_state").doc(sourceId).get();
  if (!doc.exists) return null;
  return doc.data() as CrawlState;
}

export async function updateCrawlState(
  sourceId: string,
  update: Partial<CrawlState>,
): Promise<void> {
  await db()
    .collection("crawl_state")
    .doc(sourceId)
    .set(
      withoutUndefined({
        sourceId,
        ...update,
        lastCrawledAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      { merge: true },
    );
}

export async function markCrawlSuccess(sourceId: string): Promise<void> {
  await db()
    .collection("crawl_state")
    .doc(sourceId)
    .set(
      {
        lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
        errorCount: 0,
        lastError: null,
        status: "idle",
      },
      { merge: true },
    );
}

export async function markCrawlError(
  sourceId: string,
  error: string,
): Promise<void> {
  await db()
    .collection("crawl_state")
    .doc(sourceId)
    .set(
      {
        lastError: error,
        errorCount: admin.firestore.FieldValue.increment(1),
        status: "error",
      },
      { merge: true },
    );
}

export async function markCrawling(sourceId: string): Promise<void> {
  await db()
    .collection("crawl_state")
    .doc(sourceId)
    .set({ status: "crawling" }, { merge: true });
}
