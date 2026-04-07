import assert from "node:assert/strict";
import test from "node:test";

import * as runtimeConfig from "../functions/lib/config.js";

const { getRuntimeConfig, getTelegramConfig } = runtimeConfig;

test("getRuntimeConfig uses safe defaults for optional settings", () => {
  const config = getRuntimeConfig({});

  assert.equal(config.projectId, "p2p-hackathon");
  assert.equal(config.geminiApiKey, undefined);
  assert.equal(config.geminiModel, "gemini-2.5-flash");
  assert.equal(config.notificationChannel, "telegram");
  assert.equal(config.githubToken, undefined);
});

test("getRuntimeConfig rejects unsupported notification channels", () => {
  assert.throws(
    () =>
      getRuntimeConfig({
        NOTIFICATION_CHANNEL: "discord",
      }),
    /Unsupported NOTIFICATION_CHANNEL/,
  );
});

test("getTelegramConfig requires telegram settings when telegram is selected", () => {
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
