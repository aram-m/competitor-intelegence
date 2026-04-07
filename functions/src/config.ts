export type NotificationChannelName = "telegram" | "slack";

export interface RuntimeConfig {
  projectId: string;
  geminiApiKey?: string;
  geminiModel: string;
  notificationChannel: NotificationChannelName;
  githubToken?: string;
}

export interface TelegramConfig {
  telegramBotToken: string;
  telegramChatId: string;
}

type EnvMap = Record<string, string | undefined>;

function readEnv(env: EnvMap, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function readNotificationChannel(
  env: EnvMap,
): NotificationChannelName {
  const value = readEnv(env, "NOTIFICATION_CHANNEL") ?? "telegram";

  if (value === "telegram" || value === "slack") {
    return value;
  }

  throw new Error(
    `Unsupported NOTIFICATION_CHANNEL: ${value}. Use "telegram" or "slack".`,
  );
}

export function getRuntimeConfig(env: EnvMap = process.env): RuntimeConfig {
  return {
    projectId:
      readEnv(env, "GOOGLE_CLOUD_PROJECT") ??
      readEnv(env, "GCLOUD_PROJECT") ??
      readEnv(env, "PROJECT_ID") ??
      "p2p-hackathon",
    geminiApiKey: readEnv(env, "GEMINI_API_KEY"),
    geminiModel: readEnv(env, "GEMINI_MODEL") ?? "gemini-2.5-flash",
    notificationChannel: readNotificationChannel(env),
    githubToken: readEnv(env, "GITHUB_TOKEN"),
  };
}

export function getTelegramConfig(
  env: EnvMap = process.env,
): TelegramConfig {
  const telegramBotToken = readEnv(env, "TELEGRAM_BOT_TOKEN");
  const telegramChatId = readEnv(env, "TELEGRAM_CHAT_ID");

  if (!telegramBotToken) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is required when NOTIFICATION_CHANNEL=telegram.",
    );
  }

  if (!telegramChatId) {
    throw new Error(
      "TELEGRAM_CHAT_ID is required when NOTIFICATION_CHANNEL=telegram.",
    );
  }

  return {
    telegramBotToken,
    telegramChatId,
  };
}
