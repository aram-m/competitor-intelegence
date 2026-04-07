import type { DigestPayload } from "../types";

export interface NotificationChannel {
  send(payload: DigestPayload): Promise<void>;
}
