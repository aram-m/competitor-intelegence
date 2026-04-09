import * as admin from "firebase-admin";
import { buildAlertPayload, resolveAlertStatus } from "../alerts/payload";
import { getEnabledNotificationChannels, getRuntimeConfig } from "../config";
import { getNotificationChannels } from "../notifications/factory";
import type {
  AlertChannelResult,
  AlertPayload,
  AlertRecord,
  AlertStatus,
  CompanySummary,
  NotificationChannelName,
} from "../types";
import { getSignalsByIds } from "./signal-store";

const db = admin.firestore;

async function getCompanySummariesByCompetitorIds(
  competitorIds: string[],
): Promise<CompanySummary[]> {
  if (competitorIds.length === 0) {
    return [];
  }

  const refs = competitorIds.map((competitorId) =>
    db().collection("company_summaries").doc(competitorId),
  );
  const docs = await db().getAll(...refs);

  return docs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...doc.data() }) as unknown as CompanySummary);
}

async function buildAlertPayloadFromSignalIds(
  alertId: string,
  signalIds: string[],
): Promise<AlertPayload | null> {
  const signals = await getSignalsByIds(signalIds);
  if (signals.length === 0) {
    return null;
  }

  const competitorIds = [...new Set(signals.map((signal) => signal.competitorId))];
  const summaries = await getCompanySummariesByCompetitorIds(competitorIds);

  return buildAlertPayload({
    alertId,
    generatedAt: new Date(),
    signals,
    summaries,
  });
}

function getAlertError(status: AlertStatus, results: AlertChannelResult[]): string | null {
  if (status === "sent") {
    return null;
  }

  return results
    .filter((result) => result.error)
    .map((result) => `${result.channel}: ${result.error}`)
    .join("; ");
}

export async function createPendingAlert(
  signalIds: string[],
  competitorIds: string[],
  channelsRequested: NotificationChannelName[],
): Promise<string> {
  const ref = await db().collection("alerts").add({
    signalIds,
    competitorIds,
    channelsRequested,
    channelResults: [],
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return ref.id;
}

async function updateAlertResult(
  alertId: string,
  results: AlertChannelResult[],
): Promise<void> {
  const status = resolveAlertStatus(results);
  await db().collection("alerts").doc(alertId).set(
    {
      channelResults: results,
      status,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      error: getAlertError(status, results),
    },
    { merge: true },
  );
}

async function markAlertFailed(alertId: string, error: string): Promise<void> {
  await db().collection("alerts").doc(alertId).set(
    {
      status: "failed",
      error,
      channelResults: [],
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function dispatchAlert(alertId: string): Promise<void> {
  const enabledChannels = getEnabledNotificationChannels(getRuntimeConfig());
  if (enabledChannels.length === 0) {
    await markAlertFailed(
      alertId,
      "Alerts are enabled but no valid Slack or Telegram credentials are configured.",
    );
    return;
  }

  const payload = await buildAlertPayloadFromSignalIds(alertId, (
    await db().collection("alerts").doc(alertId).get()
  ).data()?.signalIds ?? []);

  if (!payload) {
    await markAlertFailed(alertId, "No signals were found for alert payload reconstruction.");
    return;
  }

  const channels = getNotificationChannels();
  const results: AlertChannelResult[] = [];

  for (const channel of channels) {
    try {
      await channel.send(payload);
      results.push({ channel: channel.channel, status: "sent" });
    } catch (error) {
      results.push({
        channel: channel.channel,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await updateAlertResult(alertId, results);
}

export async function createAndDispatchAlert(signalIds: string[]): Promise<string | null> {
  if (signalIds.length === 0) {
    return null;
  }

  const config = getRuntimeConfig();
  if (!config.alertsEnabled) {
    return null;
  }

  const signals = await getSignalsByIds(signalIds);
  if (signals.length === 0) {
    return null;
  }

  const competitorIds = [...new Set(signals.map((signal) => signal.competitorId))];
  const channelsRequested = getEnabledNotificationChannels(config);
  const alertId = await createPendingAlert(signalIds, competitorIds, channelsRequested);
  await dispatchAlert(alertId);
  return alertId;
}

export async function dispatchPendingAlerts(): Promise<number> {
  const config = getRuntimeConfig();
  if (!config.alertsEnabled) {
    return 0;
  }

  const [pendingSnapshot, failedSnapshot] = await Promise.all([
    db().collection("alerts").where("status", "==", "pending").get(),
    db().collection("alerts").where("status", "==", "failed").get(),
  ]);

  const docs = [...pendingSnapshot.docs, ...failedSnapshot.docs];

  for (const doc of docs) {
    await dispatchAlert(doc.id);
  }

  return docs.length;
}

export function isAlertRecord(value: unknown): value is AlertRecord {
  return typeof value === "object" && value !== null;
}
