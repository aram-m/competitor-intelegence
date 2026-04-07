import type { NotificationChannel } from "./channel";
import type { DigestPayload } from "../types";

export class SlackChannel implements NotificationChannel {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async send(_payload: DigestPayload): Promise<void> {
    // Stub — implement with @slack/web-api when ready
    // 1. Install: npm install @slack/web-api
    // 2. Set SLACK_BOT_TOKEN and SLACK_CHANNEL_ID env vars
    // 3. Format payload as Slack blocks
    // 4. Call client.chat.postMessage()
    throw new Error("Slack channel not implemented yet. Set NOTIFICATION_CHANNEL=telegram.");
  }
}
