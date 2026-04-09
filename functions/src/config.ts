import type { NotificationChannelName } from "./types";

export interface RuntimeConfig {
  projectId: string;
  geminiApiKey?: string;
  geminiModel: string;
  alertsEnabled: boolean;
  githubToken?: string;
  telegram?: TelegramConfig;
  slack?: SlackConfig;
}

export interface TelegramConfig {
  telegramBotToken: string;
  telegramChatId: string;
}

export interface SlackConfig {
  slackBotToken: string;
  slackChannelId: string;
}

type EnvMap = Record<string, string | undefined>;

function readEnv(env: EnvMap, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function readBoolean(env: EnvMap, key: string, defaultValue = false): boolean {
  const value = readEnv(env, key);
  if (!value) {
    return defaultValue;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function readOptionalTelegramConfig(env: EnvMap): TelegramConfig | undefined {
  const telegramBotToken = readEnv(env, "TELEGRAM_BOT_TOKEN");
  const telegramChatId = readEnv(env, "TELEGRAM_CHAT_ID");

  if (!telegramBotToken || !telegramChatId) {
    return undefined;
  }

  return {
    telegramBotToken,
    telegramChatId,
  };
}

function readOptionalSlackConfig(env: EnvMap): SlackConfig | undefined {
  const slackBotToken = readEnv(env, "SLACK_BOT_TOKEN");
  const slackChannelId = readEnv(env, "SLACK_CHANNEL_ID");

  if (!slackBotToken || !slackChannelId) {
    return undefined;
  }

  return {
    slackBotToken,
    slackChannelId,
  };
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
    alertsEnabled: readBoolean(env, "ENABLE_ALERTS", false),
    githubToken: readEnv(env, "GITHUB_TOKEN"),
    telegram: readOptionalTelegramConfig(env),
    slack: readOptionalSlackConfig(env),
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

export function getSlackConfig(
  env: EnvMap = process.env,
): SlackConfig {
  const slackBotToken = readEnv(env, "SLACK_BOT_TOKEN");
  const slackChannelId = readEnv(env, "SLACK_CHANNEL_ID");

  if (!slackBotToken) {
    throw new Error(
      "SLACK_BOT_TOKEN is required when Slack alerts are enabled.",
    );
  }

  if (!slackChannelId) {
    throw new Error(
      "SLACK_CHANNEL_ID is required when Slack alerts are enabled.",
    );
  }

  return {
    slackBotToken,
    slackChannelId,
  };
}

export function getEnabledNotificationChannels(
  config = getRuntimeConfig(),
): NotificationChannelName[] {
  if (!config.alertsEnabled) {
    return [];
  }

  const channels: NotificationChannelName[] = [];

  if (config.telegram) {
    channels.push("telegram");
  }

  if (config.slack) {
    channels.push("slack");
  }

  return channels;
}
