import type { NotificationChannel } from "./channel";
import { TelegramChannel } from "./telegram";
import { SlackChannel } from "./slack";
import { getRuntimeConfig } from "../config";

export function getNotificationChannel(): NotificationChannel {
  const { notificationChannel } = getRuntimeConfig();

  switch (notificationChannel) {
    case "telegram":
      return new TelegramChannel();
    case "slack":
      return new SlackChannel();
    default:
      throw new Error(
        `Unknown notification channel: ${notificationChannel}`,
      );
  }
}
