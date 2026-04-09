import type { NotificationChannel } from "./channel";
import { TelegramChannel } from "./telegram";
import { SlackChannel } from "./slack";
import { getEnabledNotificationChannels, getRuntimeConfig } from "../config";

export function getNotificationChannels(): NotificationChannel[] {
  const config = getRuntimeConfig();
  const enabledChannels = getEnabledNotificationChannels(config);
  const channels: NotificationChannel[] = [];

  for (const channel of enabledChannels) {
    switch (channel) {
      case "telegram":
        channels.push(new TelegramChannel(config.telegram!));
        break;
      case "slack":
        channels.push(new SlackChannel(config.slack!));
        break;
      default:
        throw new Error(`Unknown notification channel: ${channel}`);
    }
  }

  return channels;
}
