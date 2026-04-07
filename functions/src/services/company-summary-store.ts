import * as admin from "firebase-admin";
import type { Priority, Signal, SourceType } from "../types";
import type { CompanyBriefResult } from "../summary/company-brief";
import { PRIORITIES } from "../types";

const db = admin.firestore;
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

function getSignalDate(signal: Signal): Date {
  return signal.publishedAt?.toDate?.() ?? signal.createdAt?.toDate?.() ?? new Date(0);
}

function comparePriority(a: Priority, b: Priority): number {
  return PRIORITIES.indexOf(a) - PRIORITIES.indexOf(b);
}

function compareSignals(a: Signal, b: Signal): number {
  const priorityDiff = comparePriority(a.priority, b.priority);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return getSignalDate(b).getTime() - getSignalDate(a).getTime();
}

export function getCompanySummaryWindowStart(now = new Date()): Date {
  return new Date(now.getTime() - THIRTY_DAYS_IN_MS);
}

export async function listRecentSignalsByCompetitor(
  since: Date,
): Promise<Map<string, Signal[]>> {
  const snapshot = await db()
    .collection("signals")
    .where("isArchived", "==", false)
    .get();

  const grouped = new Map<string, Signal[]>();

  for (const doc of snapshot.docs) {
    const signal = { id: doc.id, ...doc.data() } as Signal;
    const signalDate = getSignalDate(signal);

    if (signalDate < since) {
      continue;
    }

    const existing = grouped.get(signal.competitorId) ?? [];
    existing.push(signal);
    grouped.set(signal.competitorId, existing);
  }

  for (const [competitorId, signals] of grouped.entries()) {
    grouped.set(competitorId, [...signals].sort(compareSignals));
  }

  return grouped;
}

function getStrongestPriority(signals: Signal[]): Priority {
  return signals.reduce<Priority>((current, signal) => {
    return comparePriority(signal.priority, current) < 0 ? signal.priority : current;
  }, "low");
}

function getSourceTypes(signals: Signal[]): SourceType[] {
  return [...new Set(signals.map((signal) => signal.sourceType))];
}

export async function storeCompanySummary(
  competitorId: string,
  signals: Signal[],
  brief: CompanyBriefResult,
  windowStart: Date,
): Promise<void> {
  const latestSignal = signals[0];
  if (!latestSignal) {
    return;
  }

  await db()
    .collection("company_summaries")
    .doc(competitorId)
    .set({
      competitorId,
      competitorName: latestSignal.competitorName,
      recentCount: signals.length,
      sourceTypes: getSourceTypes(signals),
      strongestPriority: getStrongestPriority(signals),
      latestSignalAt: admin.firestore.Timestamp.fromDate(getSignalDate(latestSignal)),
      windowStart: admin.firestore.Timestamp.fromDate(windowStart),
      summary: brief.summary,
      whyItMatters: brief.whyItMatters,
      watchNext: brief.watchNext,
      generatedBy: brief.generatedBy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
