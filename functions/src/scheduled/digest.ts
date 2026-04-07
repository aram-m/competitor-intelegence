import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { getNotificationChannel } from "../notifications/factory";
import {
  getUndigestedSignals,
  markSignalsDigested,
} from "../services/signal-store";
import type { Signal } from "../types";
import { getRuntimeConfig } from "../config";

async function runDigest() {
  const db = admin.firestore();
  const { notificationChannel } = getRuntimeConfig();

  // Get signals from last 24 hours that haven't been digested
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const snapshot = await getUndigestedSignals(since);

  const signals = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Signal)
    .filter((s) => !s.digestId);

  if (signals.length === 0) {
    console.log("No new signals to digest.");
    return 0;
  }

  console.log(`Generating digest for ${signals.length} signals`);

  // Create digest record
  const digestRef = await db.collection("digests").add({
    channel: notificationChannel,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    signalCount: signals.length,
    signalIds: signals.map((s) => s.id),
    status: "sent",
  });

  try {
    const channel = getNotificationChannel();
    await channel.send({
      signals,
      generatedAt: new Date(),
    });

    // Mark signals as digested
    await markSignalsDigested(
      signals.map((s) => s.id),
      digestRef.id,
    );

    console.log(`Digest sent successfully: ${digestRef.id}`);
    return signals.length;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Digest send failed:", message);
    await digestRef.update({ status: "failed", error: message });
    return 0;
  }
}

// Daily at 9 AM UTC
export const scheduledDigest = onSchedule(
  { schedule: "every day 09:00", timeoutSeconds: 120 },
  async () => {
    await runDigest();
  },
);

// HTTP trigger for manual testing
export const triggerDigest = onRequest(
  { timeoutSeconds: 120 },
  async (_req, res) => {
    const count = await runDigest();
    res.json({ status: "ok", signalsSent: count });
  },
);
