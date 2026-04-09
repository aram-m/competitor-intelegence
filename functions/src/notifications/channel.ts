import type { AlertPayload, NotificationChannelName } from "../types";

export interface NotificationChannel {
  readonly channel: NotificationChannelName;
  send(payload: AlertPayload): Promise<void>;
}
