import assert from "node:assert/strict";
import test from "node:test";

import * as runtimeConfig from "../functions/lib/config.js";

const {
  getRuntimeConfig,
  getEnabledNotificationChannels,
  getTelegramConfig,
  getSlackConfig,
} = runtimeConfig;

test("getRuntimeConfig uses safe defaults for optional settings", () => {
  const config = getRuntimeConfig({});

  assert.equal(config.projectId, "p2p-hackathon");
  assert.equal(config.geminiApiKey, undefined);
  assert.equal(config.geminiModel, "gemini-2.5-flash");
  assert.equal(config.alertsEnabled, false);
  assert.equal(config.githubToken, undefined);
  assert.equal(config.telegram, undefined);
  assert.equal(config.slack, undefined);
});

test("getEnabledNotificationChannels returns no channels when alerts are disabled", () => {
  const config = getRuntimeConfig({
    TELEGRAM_BOT_TOKEN: "bot-token",
    TELEGRAM_CHAT_ID: "chat-id",
    SLACK_BOT_TOKEN: "slack-token",
    SLACK_CHANNEL_ID: "channel-id",
  });

  assert.deepEqual(getEnabledNotificationChannels(config), []);
});

test("getEnabledNotificationChannels returns every configured channel when alerts are enabled", () => {
  const config = getRuntimeConfig({
    ENABLE_ALERTS: "true",
    TELEGRAM_BOT_TOKEN: "bot-token",
    TELEGRAM_CHAT_ID: "chat-id",
    SLACK_BOT_TOKEN: "slack-token",
    SLACK_CHANNEL_ID: "channel-id",
  });

  assert.deepEqual(getEnabledNotificationChannels(config), ["telegram", "slack"]);
});

test("getTelegramConfig requires telegram settings when telegram is requested directly", () => {
  assert.throws(
    () => getTelegramConfig({}),
    /TELEGRAM_BOT_TOKEN/,
  );
});

test("getTelegramConfig returns telegram settings when present", () => {
  const config = getTelegramConfig({
    TELEGRAM_BOT_TOKEN: "bot-token",
    TELEGRAM_CHAT_ID: "chat-id",
  });

  assert.equal(config.telegramBotToken, "bot-token");
  assert.equal(config.telegramChatId, "chat-id");
});

test("getSlackConfig requires slack settings when slack is requested directly", () => {
  assert.throws(
    () => getSlackConfig({}),
    /SLACK_BOT_TOKEN/,
  );
});

test("getSlackConfig returns slack settings when present", () => {
  const config = getSlackConfig({
    SLACK_BOT_TOKEN: "slack-token",
    SLACK_CHANNEL_ID: "channel-id",
  });

  assert.equal(config.slackBotToken, "slack-token");
  assert.equal(config.slackChannelId, "channel-id");
});
