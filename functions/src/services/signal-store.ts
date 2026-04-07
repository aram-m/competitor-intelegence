import * as admin from "firebase-admin";
import type { RawCrawlItem, ClassificationResult, Source } from "../types";
import { buildSignalIdentity, normalizeSignalUrl } from "./signal-identity";

const db = admin.firestore;

export async function storeSignal(
  source: Source,
  item: RawCrawlItem,
  classification: ClassificationResult,
): Promise<string> {
  const normalizedUrl = normalizeSignalUrl(item.url);
  const signalIdentity = buildSignalIdentity({
    competitorId: source.competitorId,
    sourceType: source.type,
    url: item.url,
  });

  // Deduplicate by canonical identity first.
  const existing = await db()
    .collection("signals")
    .where("signalIdentity", "==", signalIdentity)
    .limit(1)
    .get();

  const fallbackExisting = existing.empty
    ? await db()
        .collection("signals")
        .where("competitorId", "==", source.competitorId)
        .where("normalizedUrl", "==", normalizedUrl)
        .limit(1)
        .get()
    : existing;

  const legacyExisting = fallbackExisting.empty
    ? await db()
        .collection("signals")
        .where("competitorId", "==", source.competitorId)
        .where("url", "==", normalizedUrl)
        .limit(1)
        .get()
    : fallbackExisting;

  if (!legacyExisting.empty) {
    const existingRef = legacyExisting.docs[0].ref;
    await existingRef.update({
      competitorId: source.competitorId,
      competitorName: source.competitorName,
      sourceId: source.id,
      sourceType: source.type,
      signalIdentity,
      normalizedUrl,
      title: item.title,
      url: normalizedUrl,
      rawContent: item.content.slice(0, 2000),
      publishedAt: admin.firestore.Timestamp.fromDate(item.publishedAt),
      signalType: classification.signalType,
      priority: classification.priority,
      summary: classification.summary,
      recommendedAction: classification.recommendedAction,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return legacyExisting.docs[0].id;
  }

  const docRef = await db()
    .collection("signals")
    .add({
      competitorId: source.competitorId,
      competitorName: source.competitorName,
      sourceId: source.id,
      sourceType: source.type,
      signalIdentity,
      normalizedUrl,
      title: item.title,
      url: normalizedUrl,
      rawContent: item.content.slice(0, 2000),
      publishedAt: admin.firestore.Timestamp.fromDate(item.publishedAt),
      signalType: classification.signalType,
      priority: classification.priority,
      summary: classification.summary,
      recommendedAction: classification.recommendedAction,
      isArchived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
}

export async function getUndigestedSignals(
  since: Date,
): Promise<admin.firestore.QuerySnapshot> {
  return db()
    .collection("signals")
    .where("isArchived", "==", false)
    .where(
      "createdAt",
      ">=",
      admin.firestore.Timestamp.fromDate(since),
    )
    .orderBy("createdAt", "desc")
    .get();
}

export async function markSignalsDigested(
  signalIds: string[],
  digestId: string,
): Promise<void> {
  const batch = db().batch();
  for (const id of signalIds) {
    batch.update(db().collection("signals").doc(id), { digestId });
  }
  await batch.commit();
}
