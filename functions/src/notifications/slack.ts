import { WebClient } from "@slack/web-api";
import type { NotificationChannel } from "./channel";
import type { AlertPayload } from "../types";
import type { SlackConfig } from "../config";
import {
  FALLBACK_RECOMMENDED_ACTION,
  FALLBACK_SUMMARY,
} from "../classifier/llm";

export function buildSlackBlocks(payload: AlertPayload) {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Competitive Watch Alert (${payload.signalIds.length} new)`,
      },
    },
  ];

  for (const company of payload.companies) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*${company.competitorName}*\n` +
          `${company.brief.summary}\n` +
          `*Why it matters:* ${company.brief.whyItMatters}\n` +
          `*Watch next:* ${company.brief.watchNext}`,
      },
    });

    for (const signal of company.signals.slice(0, 5)) {
      const summary =
        signal.summary === FALLBACK_SUMMARY ? "" : `\n${signal.summary}`;
      const action =
        signal.recommendedAction === FALLBACK_RECOMMENDED_ACTION
          ? ""
          : `\n_Action:_ ${signal.recommendedAction}`;

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `• *<${signal.url}|${signal.title}>* (${signal.sourceType}, ${signal.priority})` +
            `${summary}${action}`,
        },
      });
    }

    blocks.push({ type: "divider" });
  }

  return blocks;
}

export class SlackChannel implements NotificationChannel {
  readonly channel = "slack" as const;
  private client: WebClient;
  private channelId: string;

  constructor(config: SlackConfig) {
    this.client = new WebClient(config.slackBotToken);
    this.channelId = config.slackChannelId;
  }

  async send(payload: AlertPayload): Promise<void> {
    await this.client.chat.postMessage({
      channel: this.channelId,
      text: `Competitive Watch Alert (${payload.signalIds.length} new signal${payload.signalIds.length === 1 ? "" : "s"})`,
      blocks: buildSlackBlocks(payload),
      unfurl_links: false,
      unfurl_media: false,
    });
  }
}
