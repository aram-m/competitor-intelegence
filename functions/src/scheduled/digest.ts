import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";

async function runDigest() {
  console.log("Digest functions are deprecated. Per-crawl alerting is the active delivery path.");
  return 0;
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
